# indecap-aprende

Plataforma educativa web para INDECAP — Instituto de Ciencias Aplicadas, sede Envigado. Proyecto final de grado, programa de Desarrollo de Software.

## 1. Requisitos previos

- Python 3.11 o superior instalado.
- Git instalado.
- Visual Studio Code (o el editor de tu preferencia).
- PostgreSQL — **opcional para empezar**: el proyecto corre con SQLite automáticamente si no configuras PostgreSQL. Instálalo cuando quieras probar con la base de datos real de producción.

## 2. Poner el proyecto a correr (con SQLite, sin instalar nada más)

```bash
# 1. Crear y activar un entorno virtual
python3 -m venv .venv
source .venv/bin/activate        # En Windows: .venv\Scripts\activate

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Copiar las variables de entorno de ejemplo
cp .env.example .env

# 4. Inicializar la base de datos (crea las tablas)
flask --app run.py shell -c "
from app.extensions import db
db.create_all()
print('Tablas creadas')
"

# 5. Correr el servidor de desarrollo
flask --app run.py run
```

Abre `http://127.0.0.1:5000/auth/login` en el navegador. Deberías ver la pantalla de login.

> Con este comando el proyecto usa un archivo `instance/indecap_dev.db` (SQLite) automáticamente — no necesitas tener PostgreSQL instalado para empezar a trabajar.

## 3. Instalar PostgreSQL localmente (cuando quieras usar la base de datos real)

**En Windows:** descarga el instalador desde https://www.postgresql.org/download/windows/ y sigue el asistente (anota la contraseña que le pongas al usuario `postgres`).

**En Mac:** `brew install postgresql@16` y luego `brew services start postgresql@16`.

Una vez instalado, crea la base de datos del proyecto:

```bash
psql -U postgres
CREATE DATABASE indecap_aprende;
\q
```

Luego en tu archivo `.env`, descomenta y ajusta:

```
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/indecap_aprende
```

Vuelve a correr el paso 4 de la sección anterior (`db.create_all()`) — esta vez creará las tablas en PostgreSQL, no en SQLite.

## 4. Migraciones con Flask-Migrate (recomendado en cuanto el modelo de datos empiece a cambiar)

`db.create_all()` sirve para arrancar rápido, pero no lleva historial de cambios. En cuanto el proyecto avance, usa migraciones:

```bash
flask --app run.py db init      # solo la primera vez
flask --app run.py db migrate -m "mensaje describiendo el cambio"
flask --app run.py db upgrade
```

## 5. Despliegue en Railway o Render (guía inicial)

Ambos servicios funcionan de forma similar para un proyecto Flask + PostgreSQL:

1. Sube el proyecto a un repositorio de GitHub.
2. Crea una cuenta en [Railway](https://railway.app) o [Render](https://render.com) (ambos tienen plan gratuito/de bajo costo suficiente para un proyecto de grado).
3. Conecta el repositorio de GitHub.
4. Agrega un servicio de base de datos PostgreSQL desde el panel del proveedor — te dará automáticamente una variable `DATABASE_URL`, que el proyecto ya está preparado para leer.
5. Define la variable de entorno `SECRET_KEY` en el panel del proveedor (no la que está en `.env.example`, una nueva y secreta).
6. Como comando de arranque en producción, usa: `gunicorn run:app` (gunicorn ya está en `requirements.txt`).

Cuando lleguemos a esta fase del proyecto, profundizamos paso a paso en el proveedor que elijas.

## 6. Estructura del proyecto

```
app/
├── __init__.py         # application factory
├── config.py            # configuración por entorno (dev/prod/testing)
├── extensions.py        # instancias de SQLAlchemy, Migrate, LoginManager
├── models/               # User, AccessibilityProfile, Progress, Subject, Lesson
├── blueprints/
│   ├── auth/             # login, logout
│   ├── dashboard/        # racha, progreso, logros
│   ├── modules/          # contenido académico
│   ├── admin/             # panel administrador
│   └── inclusive/         # módulo inclusivo (perfiles de accesibilidad)
├── templates/
└── static/
migrations/
tests/
docs/bitacoras/           # documentación formal del proceso de grado
```

## 7. Estado actual

Ver `docs/bitacoras/Bitacora_indecap-aprende.docx` para el registro formal de decisiones y avance del proyecto.
