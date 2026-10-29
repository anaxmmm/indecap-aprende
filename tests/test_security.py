import json
import sqlite3
import time

import pytest
from flask import g

from app import create_app
from app.blueprints.admin.services import archive_account, export_student_data, purge_student
from app.blueprints.auth.services import generate_reset_token, verify_reset_token
from app.config import config_by_name
from app.extensions import db
from app.models.game_session import GameSession
from app.models.group import Grupo
from app.models.notification import Notification
from app.models.user import RoleEnum, User


@pytest.fixture
def app():
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


def make(name, email, role, principal=False):
    user = User(full_name=name, email=email, role=role, is_principal=principal)
    user.set_password("clave-segura-1")
    db.session.add(user)
    return user


@pytest.fixture
def people(app):
    people = {
        "admin": make("Admin Principal", "admin@prueba.co", RoleEnum.ADMIN, principal=True),
        "teacher": make("Docente Prueba", "docente@prueba.co", RoleEnum.TEACHER),
        "student": make("Estudiante Prueba", "estudiante@prueba.co", RoleEnum.STUDENT),
    }
    db.session.commit()
    grupo = Grupo(name="Grupo A", teacher_id=people["teacher"].id)
    grupo.estudiantes.append(people["student"])
    db.session.add(grupo)
    db.session.commit()
    people["group"] = grupo
    return people


def login(client, email, password="clave-segura-1", portal="estudiante", remember=False):
    g.pop("_login_user", None)
    data = {"email": email, "password": password, "portal_role": portal}
    if remember:
        data["remember_me"] = "y"
    return client.post("/auth/login", data=data)


def logged_in(client):
    with client.session_transaction() as session:
        return "_user_id" in session


# --- Límite de intentos de inicio de sesión ---

def test_login_locks_after_too_many_failures(app, people):
    client = app.test_client()
    for _ in range(app.config["LOGIN_MAX_ATTEMPTS"]):
        login(client, "estudiante@prueba.co", password="equivocada")
    # Con la contraseña correcta tampoco entra mientras dure el bloqueo.
    login(client, "estudiante@prueba.co")
    assert not logged_in(client)


def test_successful_login_clears_failures(app, people):
    client = app.test_client()
    for _ in range(app.config["LOGIN_MAX_ATTEMPTS"] - 1):
        login(client, "estudiante@prueba.co", password="equivocada")
    login(client, "estudiante@prueba.co")
    assert logged_in(client)


# --- Recuperación de contraseña ---

def test_reset_link_works_only_once(app, people):
    student = people["student"]
    with app.test_request_context():
        token = generate_reset_token(student)
        assert verify_reset_token(token) == student
        student.set_password("otra-clave-segura")
        db.session.commit()
        assert verify_reset_token(token) is None


def test_reset_link_is_not_shown_outside_development(app, people):
    response = app.test_client().post("/auth/forgot-password", data={"email": "estudiante@prueba.co"}, follow_redirects=True)
    assert b"reset-password/" not in response.data


# --- Sesión inactiva ---

def test_idle_session_is_closed(app, people):
    client = app.test_client()
    login(client, "estudiante@prueba.co")
    with client.session_transaction() as session:
        session["last_seen"] = time.time() - app.config["IDLE_TIMEOUT_MINUTES"] * 60 - 5
    g.pop("_login_user", None)
    client.get("/dashboard/mi-panel")
    assert not logged_in(client)


def test_remember_me_skips_idle_logout(app, people):
    client = app.test_client()
    login(client, "estudiante@prueba.co", remember=True)
    with client.session_transaction() as session:
        session["last_seen"] = time.time() - app.config["IDLE_TIMEOUT_MINUTES"] * 60 - 5
    g.pop("_login_user", None)
    client.get("/dashboard/mi-panel")
    assert logged_in(client)


def test_background_requests_do_not_keep_the_session_alive(app, people):
    client = app.test_client()
    login(client, "estudiante@prueba.co")
    viejo = time.time() - 600
    with client.session_transaction() as session:
        session["last_seen"] = viejo
    g.pop("_login_user", None)
    client.get("/dashboard/notificaciones/estado", headers={"X-Background": "1"})
    with client.session_transaction() as session:
        assert session["last_seen"] == viejo


# --- Configuración de producción ---

def test_production_refuses_the_example_secret_key(monkeypatch):
    monkeypatch.setattr(config_by_name["production"], "SECRET_KEY", "cambia-esta-clave-en-produccion")
    with pytest.raises(RuntimeError):
        create_app("production")


def test_security_headers(app):
    response = app.test_client().get("/")
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "SAMEORIGIN"


# --- Datos personales ---

def test_data_policy_page_is_public(app):
    response = app.test_client().get("/politica-de-datos")
    assert response.status_code == 200
    assert "Ley 1581".encode() in response.data


def test_admin_exports_student_data(app, people):
    student = people["student"]
    db.session.add(GameSession(user_id=student.id, game_slug="discalculia_mercado", level=1, score=80))
    db.session.commit()
    with app.test_request_context():
        data = export_student_data(people["admin"], student.id)
    assert data["cuenta"]["correo"] == "estudiante@prueba.co"
    assert len(data["partidas"]) == 1
    json.dumps(data)  # se puede descargar como JSON


def test_teacher_cannot_export_student_data(app, people):
    with app.test_request_context():
        with pytest.raises(ValueError):
            export_student_data(people["teacher"], people["student"].id)


def test_purge_needs_archive_and_email_confirmation(app, people):
    student = people["student"]
    with app.test_request_context():
        with pytest.raises(ValueError):
            purge_student(people["admin"], student.id, student.email)
        archive_account(people["admin"], student.id)
        with pytest.raises(ValueError):
            purge_student(people["admin"], student.id, "otro@correo.co")
    assert db.session.get(User, student.id) is not None


def test_purge_removes_the_student_and_their_activity(app, people):
    student = people["student"]
    db.session.add(GameSession(user_id=student.id, game_slug="discalculia_mercado", level=1, score=80))
    db.session.add(Notification(recipient_id=people["teacher"].id, student_id=student.id, message="x"))
    db.session.commit()
    student_id = student.id
    with app.test_request_context():
        archive_account(people["admin"], student_id)
        purge_student(people["admin"], student_id, "estudiante@prueba.co")
    assert db.session.get(User, student_id) is None
    assert GameSession.query.filter_by(user_id=student_id).count() == 0
    assert Notification.query.filter_by(student_id=student_id).count() == 0
    assert people["group"].estudiantes == []


def test_printable_report_for_the_teacher(app, people):
    client = app.test_client()
    login(client, "docente@prueba.co", portal="docente")
    g.pop("_login_user", None)
    response = client.get("/dashboard/estudiante/%d/informe" % people["student"].id)
    assert response.status_code == 200
    assert b"Estudiante Prueba" in response.data


def test_reset_email_is_sent_when_mail_is_configured(app, people, monkeypatch):
    enviados = []

    class FakeSMTP:
        def __init__(self, host, port, timeout=None):
            self.host = host

        def starttls(self, context=None):
            pass

        def login(self, user, password):
            pass

        def send_message(self, msg):
            enviados.append(msg)

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

    monkeypatch.setattr("app.utils.correo.smtplib.SMTP", FakeSMTP)
    app.config.update(MAIL_SERVER="smtp.prueba.co", MAIL_DEFAULT_SENDER="no-responder@prueba.co")
    app.test_client().post("/auth/forgot-password", data={"email": "estudiante@prueba.co"})
    assert len(enviados) == 1
    assert enviados[0]["To"] == "estudiante@prueba.co"
    assert "reset-password/" in enviados[0].get_body(("plain",)).get_content()


def test_reset_requests_are_limited(app, people, monkeypatch):
    llamadas = []
    monkeypatch.setattr("app.blueprints.auth.routes._send_reset_email", lambda user: llamadas.append(user))
    client = app.test_client()
    for _ in range(app.config["RESET_MAX_REQUESTS"] + 2):
        client.post("/auth/forgot-password", data={"email": "estudiante@prueba.co"})
    assert len(llamadas) == app.config["RESET_MAX_REQUESTS"]


def test_backup_command_copies_sqlite_and_keeps_the_latest(tmp_path, monkeypatch):
    base = tmp_path / "app.db"
    monkeypatch.setattr(config_by_name["testing"], "SQLALCHEMY_DATABASE_URI", "sqlite:///" + str(base))
    monkeypatch.setattr(config_by_name["testing"], "BACKUP_DIR", str(tmp_path / "respaldos"))
    monkeypatch.setattr(config_by_name["testing"], "BACKUP_KEEP", 1)
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        db.session.add(User(full_name="Copia", email="copia@prueba.co", role=RoleEnum.TEACHER, password_hash="x"))
        db.session.commit()
    runner = app.test_cli_runner()
    assert runner.invoke(args=["respaldo"]).exit_code == 0
    (tmp_path / "respaldos" / "indecap-00000000-000000.db").write_bytes(b"")
    assert runner.invoke(args=["respaldo"]).exit_code == 0
    copias = list((tmp_path / "respaldos").iterdir())
    assert len(copias) == 1
    assert sqlite3.connect(copias[0]).execute("select count(*) from users").fetchone() == (1,)
