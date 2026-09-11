"""
Comandos de línea de comandos personalizados para indecap-aprende.

Uso: flask --app run.py create-admin
Esto es el equivalente profesional a "createsuperuser" de Django —
la forma correcta de crear la primera cuenta con rol administrador.

Uso: flask --app run.py seed-trastornos
Carga (o actualiza) los 8 trastornos/discapacidades base del proyecto,
tomados directamente del apartado "Necesidades reales del instituto"
de la landing de indecap-aprende. Es idempotente: correrlo varias veces
no duplica registros, solo actualiza nombre/descripción si ya existen
(match por slug).
"""
import click
from flask.cli import with_appcontext

from app.extensions import db
from app.models.user import User, RoleEnum
from app.models.content import Trastorno


@click.command("create-admin")
@click.option("--name", prompt="Nombre completo")
@click.option("--email", prompt="Correo electrónico")
@click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True)
@with_appcontext
def create_admin_command(name, email, password):
    """Crea (o promueve a admin) el usuario administrador inicial."""
    email = email.lower().strip()
    user = User.query.filter_by(email=email).first()
    if user:
        user.role = RoleEnum.ADMIN
        user.full_name = name
        user.set_password(password)
        click.echo(f"Usuario existente {email} promovido a administrador.")
    else:
        user = User(full_name=name, email=email, role=RoleEnum.ADMIN)
        user.set_password(password)
        db.session.add(user)
        click.echo(f"Administrador {email} creado correctamente.")
    db.session.commit()


TRASTORNOS_SEED = [
    {
        "name": "Dislexia",
        "slug": "dislexia",
        "description": "Lectura en voz alta con resaltado de palabra en tiempo real.",
        "icon": "book-open",
    },
    {
        "name": "Discalculia",
        "slug": "discalculia",
        "description": "Recta numérica y bloques visuales, no solo cifras.",
        "icon": "hash",
    },
    {
        "name": "TDAH",
        "slug": "tdah",
        "description": "Micro-actividades de 20-30 min con checkpoints visibles.",
        "icon": "clock",
    },
    {
        "name": "TEA",
        "slug": "tea",
        "description": "Rutinas predecibles y control real del entorno visual.",
        "icon": "repeat",
    },
    {
        "name": "Trastorno opositor desafiante",
        "slug": "trastorno-opositor-desafiante",
        "description": "Autonomía real de avance, sin límites de tiempo impuestos.",
        "icon": "compass",
    },
    {
        "name": "Discapacidad visual",
        "slug": "discapacidad-visual",
        "description": "Navegación por teclado, lector de pantalla, alto contraste.",
        "icon": "eye",
    },
    {
        "name": "Discapacidad auditiva",
        "slug": "discapacidad-auditiva",
        "description": "Subtítulos y biblioteca de video en LSC.",
        "icon": "ear",
    },
    {
        "name": "Discapacidad cognitiva",
        "slug": "discapacidad-cognitiva",
        "description": "Perfil de accesibilidad configurable por docente.",
        "icon": "brain",
    },
]


@click.command("seed-trastornos")
@with_appcontext
def seed_trastornos_command():
    """Carga los 8 trastornos base del proyecto (ver TRASTORNOS_SEED)."""
    creados = 0
    actualizados = 0
    for data in TRASTORNOS_SEED:
        trastorno = Trastorno.query.filter_by(slug=data["slug"]).first()
        if trastorno:
            trastorno.name = data["name"]
            trastorno.description = data["description"]
            trastorno.icon = data["icon"]
            actualizados += 1
        else:
            db.session.add(Trastorno(**data))
            creados += 1
    db.session.commit()
    click.echo(f"Trastornos: {creados} creados, {actualizados} actualizados.")


def register_cli(app):
    app.cli.add_command(create_admin_command)
    app.cli.add_command(seed_trastornos_command)