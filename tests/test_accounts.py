import pytest
from flask import g

from app import create_app
from app.extensions import db
from app.blueprints.admin.services import archive_account, create_account, restore_account
from app.models.game_session import GameSession
from app.models.group import Grupo
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
        "principal": make("Admin Principal", "principal@prueba.co", RoleEnum.ADMIN, principal=True),
        "admin": make("Admin Apoyo", "admin@prueba.co", RoleEnum.ADMIN),
        "teacher": make("Docente Prueba", "docente@prueba.co", RoleEnum.TEACHER),
        "other_teacher": make("Otra Docente", "otra@prueba.co", RoleEnum.TEACHER),
        "student": make("Estudiante Prueba", "estudiante@prueba.co", RoleEnum.STUDENT),
    }
    db.session.commit()
    grupo = Grupo(name="Grupo A", teacher_id=people["teacher"].id)
    grupo.estudiantes.append(people["student"])
    db.session.add(grupo)
    db.session.commit()
    people["group"] = grupo
    return people


def post_login(client, email, portal):
    # El fixture mantiene abierto un contexto de aplicación, así que Flask-Login
    # guardaría en g al usuario de la petición anterior.
    g.pop("_login_user", None)
    return client.post("/auth/login", data={"email": email, "password": "clave-segura-1", "portal_role": portal})


# --- Acceso por el portal correcto ---

def test_student_cannot_enter_through_teacher_portal(app, people):
    client = app.test_client()
    response = post_login(client, "estudiante@prueba.co", "docente")
    assert "portal=estudiante" in response.headers["Location"]
    with client.session_transaction() as session:
        assert "_user_id" not in session


def test_teacher_cannot_enter_through_student_portal(app, people):
    client = app.test_client()
    post_login(client, "docente@prueba.co", "estudiante")
    with client.session_transaction() as session:
        assert "_user_id" not in session


def test_each_role_enters_through_its_portal(app, people):
    for email, portal in (("estudiante@prueba.co", "estudiante"), ("docente@prueba.co", "docente"), ("admin@prueba.co", "docente")):
        client = app.test_client()
        post_login(client, email, portal)
        with client.session_transaction() as session:
            assert "_user_id" in session, email


def test_public_registration_is_gone(app):
    assert app.test_client().post("/auth/register", data={}).status_code == 404


# --- Quién crea qué cuentas ---

def test_account_hierarchy(app, people):
    assert set(people["principal"].creatable_roles()) == {RoleEnum.ADMIN, RoleEnum.TEACHER, RoleEnum.STUDENT}
    assert set(people["admin"].creatable_roles()) == {RoleEnum.TEACHER, RoleEnum.STUDENT}
    assert people["teacher"].creatable_roles() == [RoleEnum.STUDENT]
    assert people["student"].creatable_roles() == []


def test_only_principal_creates_admins(app, people):
    with app.test_request_context():
        with pytest.raises(ValueError):
            create_account(people["admin"], "Nuevo Admin", "nuevo@prueba.co", "clave-segura-1", "administrador")
        nuevo = create_account(people["principal"], "Nuevo Admin", "nuevo@prueba.co", "clave-segura-1", "administrador")
    assert nuevo.is_admin and not nuevo.is_principal and nuevo.created_by_id == people["principal"].id


def test_admin_creates_teacher_and_student_in_group(app, people):
    with app.test_request_context():
        docente = create_account(people["admin"], "Docente Nueva", "nueva@prueba.co", "clave-segura-1", "docente")
        estudiante = create_account(people["admin"], "Estudiante Nuevo", "nuevo.est@prueba.co", "clave-segura-1", "estudiante",
                                    group_id=people["group"].id, data_consent=True)
    assert docente.is_teacher
    assert people["group"] in estudiante.grupos
    assert estudiante.data_consent_at is not None
    assert estudiante.data_consent_by_id == people["admin"].id


def test_student_accounts_need_data_consent(app, people):
    with app.test_request_context():
        with pytest.raises(ValueError):
            create_account(people["admin"], "Sin Permiso", "sin.permiso@prueba.co", "clave-segura-1", "estudiante")
    assert User.query.filter_by(email="sin.permiso@prueba.co").first() is None


# --- Eliminar conserva la información ---

def test_teacher_archive_keeps_progress(app, people):
    student = people["student"]
    db.session.add(GameSession(user_id=student.id, game_slug="discalculia_mercado", level=1, score=80))
    db.session.commit()
    with app.test_request_context():
        archive_account(people["teacher"], student.id)
    archived = db.session.get(User, student.id)
    assert archived.is_archived and not archived.is_active_account
    assert archived.archived_by_id == people["teacher"].id
    assert GameSession.query.filter_by(user_id=student.id).count() == 1


def test_teacher_cannot_archive_students_of_other_groups(app, people):
    with app.test_request_context():
        with pytest.raises(ValueError):
            archive_account(people["other_teacher"], people["student"].id)


def test_nobody_archives_the_principal_or_themselves(app, people):
    with app.test_request_context():
        with pytest.raises(ValueError):
            archive_account(people["admin"], people["principal"].id)
        with pytest.raises(ValueError):
            archive_account(people["admin"], people["admin"].id)
        with pytest.raises(ValueError):
            archive_account(people["teacher"], people["admin"].id)


def test_only_principal_archives_admins(app, people):
    with app.test_request_context():
        with pytest.raises(ValueError):
            archive_account(people["admin"], db.session.get(User, people["principal"].id).id)
        archive_account(people["principal"], people["admin"].id)
    assert db.session.get(User, people["admin"].id).is_archived


def test_admin_restores_archived_account(app, people):
    with app.test_request_context():
        archive_account(people["teacher"], people["student"].id)
        with pytest.raises(ValueError):
            restore_account(people["teacher"], people["student"].id)
        restore_account(people["admin"], people["student"].id)
    restored = db.session.get(User, people["student"].id)
    assert not restored.is_archived and restored.is_active_account


def test_archived_account_cannot_log_in(app, people):
    with app.test_request_context():
        archive_account(people["teacher"], people["student"].id)
    client = app.test_client()
    post_login(client, "estudiante@prueba.co", "estudiante")
    with client.session_transaction() as session:
        assert "_user_id" not in session


def test_archived_email_is_reported_when_creating(app, people):
    with app.test_request_context():
        archive_account(people["teacher"], people["student"].id)
        with pytest.raises(ValueError, match="archivada"):
            create_account(people["admin"], "Otro", "estudiante@prueba.co", "clave-segura-1", "estudiante")


# --- Migraciones ---

def test_migrations_build_the_whole_database_from_scratch(tmp_path, monkeypatch):
    from flask_migrate import upgrade
    from sqlalchemy import inspect

    from app.config import config_by_name

    ruta = tmp_path / "nueva.db"
    base = config_by_name["testing"]
    monkeypatch.setitem(config_by_name, "migracion", type("Migracion", (base,), {"SQLALCHEMY_DATABASE_URI": "sqlite:///" + str(ruta)}))
    nueva = create_app("migracion")
    with nueva.app_context():
        upgrade()
        tablas = set(inspect(db.engine).get_table_names())
        assert str(ruta) in str(db.engine.url)
        assert set(db.metadata.tables) <= tablas


def test_login_form_sends_the_portal_only_once(app):
    # Si el campo del portal aparece dos veces, el navegador envía los dos
    # valores y el servidor toma el primero («estudiante»): ningún docente
    # podría entrar aunque elija «Docente».
    page = app.test_client().get("/").get_data(as_text=True)
    assert page.count('name="portal_role"') == 1


# --- Alcance del administrador y reasignación de grupos ---

from app.blueprints.dashboard.services import (
    get_groups_for_teacher,
    get_student_if_owned_by_teacher,
    reassign_group,
)


def test_admin_sees_every_group_and_student(app, people):
    assert people["group"] in get_groups_for_teacher(people["admin"])
    assert get_student_if_owned_by_teacher(people["admin"], people["student"].id) is people["student"]


def test_teacher_only_sees_own_groups(app, people):
    assert get_groups_for_teacher(people["other_teacher"]) == []
    assert get_student_if_owned_by_teacher(people["other_teacher"], people["student"].id) is None


def test_admin_reassigns_group_to_another_teacher(app, people):
    reassign_group(people["admin"], people["group"].id, people["other_teacher"].id)
    assert people["group"].teacher_id == people["other_teacher"].id
    assert people["student"] in people["group"].estudiantes
    assert get_student_if_owned_by_teacher(people["other_teacher"], people["student"].id) is people["student"]
    assert get_student_if_owned_by_teacher(people["teacher"], people["student"].id) is None


def test_teacher_cannot_reassign_groups(app, people):
    with app.test_request_context(), pytest.raises(ValueError):
        reassign_group(people["teacher"], people["group"].id, people["other_teacher"].id)
    assert people["group"].teacher_id == people["teacher"].id


def test_group_cannot_go_to_a_student_or_archived_teacher(app, people):
    with app.test_request_context(), pytest.raises(ValueError):
        reassign_group(people["admin"], people["group"].id, people["student"].id)
    archive_account(people["admin"], people["other_teacher"].id)
    with app.test_request_context(), pytest.raises(ValueError):
        reassign_group(people["admin"], people["group"].id, people["other_teacher"].id)


def test_teachers_and_groups_page_is_admin_only(app, people):
    client = app.test_client()
    post_login(client, "docente@prueba.co", "docente")
    assert client.get("/dashboard/docentes-grupos").status_code == 302
    g.pop("_login_user", None)
    client = app.test_client()
    post_login(client, "admin@prueba.co", "docente")
    g.pop("_login_user", None)
    page = client.get("/dashboard/docentes-grupos")
    assert page.status_code == 200
    assert "Grupo A".encode() in page.data


def test_teacher_cannot_move_a_student_from_another_teachers_group(app, people):
    from app.blueprints.dashboard.services import move_student_to_group
    ajeno = make("Estudiante Ajeno", "ajeno@prueba.co", RoleEnum.STUDENT)
    grupo_otra = Grupo(name="Grupo B", teacher_id=people["other_teacher"].id)
    grupo_otra.estudiantes.append(ajeno)
    destino = Grupo(name="Grupo C", teacher_id=people["teacher"].id)
    db.session.add_all([grupo_otra, destino])
    db.session.commit()
    with app.test_request_context(), pytest.raises(ValueError):
        move_student_to_group(people["teacher"], ajeno.id, destino.id, people["group"].id)
    assert ajeno not in destino.estudiantes
    move_student_to_group(people["teacher"], people["student"].id, destino.id, people["group"].id)
    assert people["student"] in destino.estudiantes
    assert people["student"] not in people["group"].estudiantes


def test_move_selector_starts_empty(app, people):
    db.session.add(Grupo(name="Grupo C", teacher_id=people["teacher"].id))
    db.session.commit()
    client = app.test_client()
    post_login(client, "docente@prueba.co", "docente")
    html = client.get("/dashboard/registro-estudiantes").get_data(as_text=True)
    assert 'value="" selected disabled' in html
    response = client.post(f"/dashboard/registro-estudiantes/grupo/{people['group'].id}/mover",
                           data={"student_id": people["student"].id, "target_group_id": ""})
    assert response.status_code == 302
    assert people["student"] in people["group"].estudiantes
