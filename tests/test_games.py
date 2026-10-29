import pytest
from flask_babel import force_locale

from app import create_app
from app.extensions import db
from app.blueprints.games.registry import (
    GAMES,
    build_levels,
    condition_label,
    get_game,
    split_activity,
    stars_for,
)
from app.blueprints.games.services import get_unlocked_level, save_game_session
from app.models.assignment import TrastornoAsignado
from app.models.content import Trastorno
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


@pytest.fixture
def people(app):
    teacher = User(full_name="Docente Prueba", email="docente@prueba.co", role=RoleEnum.TEACHER)
    student = User(full_name="Estudiante Prueba", email="estudiante@prueba.co", role=RoleEnum.STUDENT)
    for user in (teacher, student):
        user.set_password("clave-segura-1")
        db.session.add(user)
    trastorno = Trastorno(name="Discalculia", slug="discalculia")
    db.session.add(trastorno)
    db.session.commit()

    grupo = Grupo(name="Grupo A", teacher_id=teacher.id)
    grupo.estudiantes.append(student)
    db.session.add(grupo)
    db.session.add(TrastornoAsignado(student_id=student.id, trastorno_id=trastorno.id, assigned_by_id=teacher.id))
    db.session.commit()
    return {"teacher": teacher, "student": student, "trastorno": trastorno}


def login(client, user):
    with client.session_transaction() as session:
        session["_user_id"] = str(user.id)
        session["_fresh"] = True


# --- Estructura: 5 niveles × 10 actividades ---

def test_every_game_has_five_levels_of_ten_activities(app):
    with app.test_request_context():
        check_structure()


def check_structure():
    for game in GAMES.values():
        levels = build_levels(game)
        assert len(levels) == 5
        assert all(len(level["activities"]) == 10 for level in levels)
        assert [a["index"] for lvl in levels for a in lvl["activities"]] == list(range(1, 51))


@pytest.mark.parametrize("index, expected", [(1, (1, 1)), (10, (1, 10)), (11, (2, 1)), (23, (3, 3)), (50, (5, 10))])
def test_split_activity(app, index, expected):
    assert split_activity(get_game("discalculia_mercado"), index) == expected


def test_activity_titles_come_from_the_plan(app):
    with app.test_request_context():
        levels = build_levels(get_game("discalculia_mercado"))
    assert levels[0]["activities"][0]["title"] == "Contar de un vistazo"
    assert levels[0]["theme"] == "Sentido numérico"


# --- Estrellas: deben coincidir con core/engine.js::starsFor ---

@pytest.mark.parametrize("score, stars", [(100, 3), (99, 2), (75, 2), (74, 1), (60, 1), (59, 0), (0, 0)])
def test_stars_for(score, stars):
    assert stars_for(score) == stars


# --- Guardado de partidas ---

def test_submitted_values_are_clamped(app, people):
    game = get_game("discalculia_mercado")
    session = save_game_session(people["student"], {"level": 999, "score": 450, "time_spent": -5}, game)
    assert session.level == 50
    assert session.score == 100
    assert session.time_spent == 0


def test_passing_an_activity_unlocks_the_next(app, people):
    game = get_game("discalculia_mercado")
    save_game_session(people["student"], {"level": 1, "score": 55}, game)
    assert get_unlocked_level(people["student"], game["slug"]) == 1
    save_game_session(people["student"], {"level": 1, "score": 80}, game)
    assert get_unlocked_level(people["student"], game["slug"]) == 2


def test_teacher_is_notified_once_per_activity_with_level_and_activity(app, people):
    game = get_game("discalculia_mercado")
    save_game_session(people["student"], {"level": 13, "score": 90}, game)
    save_game_session(people["student"], {"level": 13, "score": 100}, game)
    notes = Notification.query.filter_by(recipient_id=people["teacher"].id).all()
    assert len(notes) == 1
    assert "actividad 3 del nivel 2 (Media)" in notes[0].message


# --- Rutas ---

def test_teacher_preview_is_never_saved(app, people):
    client = app.test_client()
    login(client, people["teacher"])
    response = client.post("/games/api/game-session/submit", json={"game_id": "discalculia_mercado", "level": 1, "score": 100})
    assert response.status_code == 200
    assert response.get_json()["saved"] is False
    assert GameSession.query.count() == 0


def test_student_cannot_skip_locked_activities(app, people):
    client = app.test_client()
    login(client, people["student"])
    response = client.get("/games/discalculia_mercado/nivel/30")
    assert response.status_code == 302
    assert response.headers["Location"].endswith("/games/discalculia_mercado/nivel/1")


def test_student_map_and_game_render(app, people):
    client = app.test_client()
    login(client, people["student"])
    tid = people["trastorno"].id
    page = client.get(f"/games/discalculia_mercado/etapas?trastorno_id={tid}").get_data(as_text=True)
    assert "Nivel 1" in page and "Contar de un vistazo" in page
    game = client.get(f"/games/discalculia_mercado/nivel/1?trastorno_id={tid}").get_data(as_text=True)
    assert "Actividad 1 de 10" in game


def test_teacher_goes_to_modo_maestro_with_all_games(app, people):
    client = app.test_client()
    login(client, people["teacher"])
    assert client.get("/games/discalculia_mercado/etapas").headers["Location"].endswith("/dashboard/sesiones-sistema")
    page = client.get("/dashboard/sesiones-sistema").get_data(as_text=True)
    assert "Modo maestro" in page
    assert 'target="_blank"' not in page
    for game in GAMES.values():
        assert str(game["name"]) in page


# --- Autoevaluación e historial ---

def _play(student, level=1, score=80, errors=None):
    return save_game_session(student, {"level": level, "score": score, "errors": errors or []}, get_game("discalculia_mercado"))


def test_student_saves_how_they_felt(app, people):
    sesion = _play(people["student"])
    client = app.test_client()
    login(client, people["student"])
    url = f"/games/api/game-session/{sesion.id}/feeling"
    assert client.post(url, json={"feeling": "furioso"}).status_code == 400
    assert client.post(url, json={"feeling": "regular"}).status_code == 200
    assert db.session.get(GameSession, sesion.id).feeling == "regular"


def test_nobody_can_answer_for_another_students_game(app, people):
    sesion = _play(people["student"])
    client = app.test_client()
    login(client, people["teacher"])
    assert client.post(f"/games/api/game-session/{sesion.id}/feeling", json={"feeling": "bien"}).status_code == 404
    assert db.session.get(GameSession, sesion.id).feeling is None


def test_history_shows_scores_and_skills_to_reinforce(app, people):
    student = people["student"]
    _play(student, level=1, score=100)
    _play(student, level=2, score=40, errors=[{"skill": "vuelto", "label": "Calcular el vuelto"}])
    _play(student, level=2, score=70, errors=[{"skill": "vuelto", "label": "Calcular el vuelto"}, {"skill": "vuelto", "label": "Calcular el vuelto", "phase": "repaso"}])
    client = app.test_client()
    login(client, people["teacher"])
    page = client.get(f"/dashboard/estudiante/{student.id}").get_data(as_text=True)
    assert "Avance por juego" in page and "Para reforzar" in page
    assert "Calcular el vuelto" in page and "2 partidas" in page
    assert "Contar de un vistazo" in page


def test_submitted_errors_are_kept_short(app, people):
    sesion = save_game_session(people["student"], {"level": 1, "score": 50, "errors": ["texto"] + [{"skill": "x"}] * 300}, get_game("discalculia_mercado"))
    assert len(sesion.errors) == 100 and all(isinstance(e, dict) for e in sesion.errors)


# --- Hora de Colombia ---

def test_dates_are_shown_in_colombian_time(app):
    from datetime import datetime
    from app.utils.fechas import format_local, local_day_start_utc

    # 03:30 UTC del 10 de marzo son las 22:30 del 9 de marzo en Colombia.
    assert format_local(datetime(2026, 3, 10, 3, 30)) == "09/03/2026 22:30"
    assert local_day_start_utc(datetime(2026, 3, 9).date()) == datetime(2026, 3, 9, 5, 0)


def test_condition_names_follow_the_active_language(app):
    """En español se ve el nombre que escribió el administrador; en inglés,
    el nombre traducido de la condición del juego."""
    tod = Trastorno(name="Trastorno opositor desafiante (TOD)", slug="tod")
    otra = Trastorno(name="Condición sin juego", slug="sin-juego")
    with app.test_request_context("/"):
        assert condition_label(tod) == "Trastorno opositor desafiante (TOD)"
    with app.test_request_context("/"), force_locale("en"):
        assert condition_label(tod) == "Oppositional defiant disorder"
        assert condition_label(otra) == "Condición sin juego"
