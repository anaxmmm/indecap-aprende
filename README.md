# INDECAP-APRENDE

Plataforma educativa web inclusiva para la Corporación Educativa INDECAP — Instituto de Ciencias Aplicadas, sede Envigado. Proyecto final de grado del programa de Desarrollo de Software.

Acompaña a estudiantes de 15 a 26 años con ocho condiciones de aprendizaje mediante un juego por condición, diseñado bajo el Diseño Universal para el Aprendizaje (DUA). Es una herramienta de apoyo pedagógico: no hace diagnósticos ni reemplaza el acompañamiento del área de psicología.

Autora: Ana Melo · 2026

---

## Qué incluye

- **8 juegos web**, uno por condición, cada uno con 50 actividades en 5 niveles (Base, Media, Alta, Muy Alta y Súper Difícil):

  | Juego | Condición |
  |---|---|
  | Mercado Espacial | Discalculia |
  | El Enigma Lingüístico | Discapacidad auditiva |
  | Clasificador de Rutinas | Discapacidad cognitiva |
  | Eco-Explorador Sonoro | Discapacidad visual |
  | El Detector de Letras Rebeldes | Dislexia |
  | Misión Ritmo y Enfoque | TDAH |
  | El Arquitecto del Mundo | Trastorno opositor desafiante |
  | La Estación de las Señales | Trastorno del espectro autista |

- **Barra de accesibilidad común**: lectura en voz alta, alto contraste, tamaño de texto, reducción de movimiento, pistas y navegación completa por teclado.
- **Panel del estudiante**: racha del mes, avance por condición, juegos y autoevaluación «¿Cómo te sentiste?».
- **Panel docente**: panel general con gráfica de rendimiento, registro de estudiantes por grupos, historial de cada estudiante con informe para imprimir o guardar como PDF, Modo maestro para proyectar cualquier actividad y ver sus respuestas, y guías de uso.
- **Administración**: cuentas de administradores, docentes y estudiantes; cuentas archivadas que se pueden restaurar; exportación y borrado definitivo de los datos de un estudiante.
- **Español e inglés** en toda la plataforma, incluidos los juegos.
- **Seguridad y datos personales**: límite de intentos de ingreso, recuperación de contraseña por correo, cierre de sesión por inactividad, autorización de tratamiento de datos y política de datos pública (Ley 1581 de 2012).
- **Horas en hora de Colombia** en todos los paneles; la base guarda las fechas en UTC.

## Tecnología

| Capa | Herramientas |
|---|---|
| Servidor | Python 3.11 o superior, Flask 3 con blueprints |
| Datos | SQLAlchemy 2 y migraciones con Alembic (Flask-Migrate). SQLite en desarrollo; PostgreSQL recomendado en producción |
| Interfaz | Plantillas Jinja, HTML, CSS y JavaScript sin frameworks; Bootstrap 5 y Chart.js desde CDN |
| Idiomas | Flask-Babel (catálogo en `app/translations`) y diccionarios por juego (`app/static/js/games/<juego>/en.json`) |
| Accesibilidad | ARIA, teclado completo y Web Speech API |
| Pruebas | pytest |

## Estructura

```
indecap-aprende/
├── run.py                  punto de entrada (flask y gunicorn)
├── requirements.txt
├── babel.cfg
├── app/
│   ├── __init__.py         fábrica de la aplicación, seguridad e idiomas
│   ├── config.py           configuración por entorno y variables
│   ├── cli.py              comandos: create-admin, seed-trastornos, respaldo
│   ├── blueprints/         auth · dashboard · games · admin · inclusive · modules
│   │                       (routes.py, services.py, forms.py en cada uno)
│   ├── models/             modelos de datos
│   ├── utils/              fechas (hora de Colombia) y correo
│   ├── templates/
│   ├── static/
│   │   ├── css/  images/
│   │   └── js/games/core/  motor común (engine.js, a11y.js, session.js)
│   │       └── <juego>/    lógica de cada juego y su diccionario en inglés
│   └── translations/en/
├── migrations/             historial de la base de datos (Alembic)
├── tests/
└── docs/                   despliegue y bitácoras
```

## Poner el proyecto a correr en un computador

```bash
# 1. Entorno virtual
python -m venv .venv
.venv\Scripts\activate            # Windows
source .venv/bin/activate         # Linux o macOS

# 2. Dependencias
pip install -r requirements.txt

# 3. Variables de entorno
copy .env.example .env            # Windows
cp .env.example .env              # Linux o macOS

# 4. Base de datos (crea o actualiza todas las tablas)
flask --app run.py db upgrade

# 5. Condiciones base y primera cuenta de administrador
flask --app run.py seed-trastornos
flask --app run.py create-admin

# 6. Servidor de desarrollo
flask --app run.py run
```

Abre `http://127.0.0.1:5000`. La primera cuenta creada con `create-admin` queda como administrador principal: es la única que puede crear otros administradores.

Sin `DATABASE_URL`, el proyecto usa el archivo `instance/indecap_dev.db` (SQLite).

## Comandos útiles

| Comando | Para qué |
|---|---|
| `flask --app run.py db upgrade` | Aplica las migraciones pendientes. Ejecútalo cada vez que actualices el código. |
| `flask --app run.py db migrate -m "mensaje"` | Genera una migración nueva después de cambiar un modelo. |
| `flask --app run.py create-admin` | Crea o promueve una cuenta de administrador. |
| `flask --app run.py seed-trastornos` | Carga o actualiza las 8 condiciones base. |
| `flask --app run.py respaldo` | Copia de seguridad de la base de datos (ver `docs/DESPLIEGUE.md`). |
| `python -m pytest` | Ejecuta las pruebas. |

## Traducciones

Los textos de la plataforma se escriben en español dentro de `_()` y se traducen en `app/translations/en/LC_MESSAGES/messages.po`:

```bash
pybabel extract -F babel.cfg -k _l -k lazy_gettext -o messages.pot .
pybabel update -i messages.pot -d app/translations
# traducir las entradas nuevas en messages.po
pybabel compile -d app/translations
```

En los juegos, las consignas, pistas y explicaciones se marcan con `_t("...")` y su traducción va en el `en.json` de cada juego. Las palabras y frases que el estudiante practica en español (dictados, lecturas, cuentos) no se traducen.

## Variables de entorno

| Variable | Para qué | Valor por defecto |
|---|---|---|
| `FLASK_ENV` | `development` o `production` | `development` |
| `SECRET_KEY` | Clave secreta de sesiones y enlaces. En producción es obligatoria (32 caracteres o más). | solo para desarrollo |
| `DATABASE_URL` | Base de datos, por ejemplo `postgresql://usuario:clave@servidor:5432/indecap_aprende` | SQLite local |
| `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_USE_TLS`, `MAIL_USE_SSL`, `MAIL_DEFAULT_SENDER` | Correo saliente para la recuperación de contraseña | sin correo |
| `DATA_CONTACT_EMAIL` | Correo para ejercer derechos sobre los datos personales | `indecap@indecap.edu.co` |
| `TRUSTED_PROXIES` | Servidores intermedios (por ejemplo nginx) delante de la aplicación | `0` |
| `IDLE_TIMEOUT_MINUTES`, `IDLE_WARNING_MINUTES` | Cierre de sesión por inactividad y aviso previo | `30` y `5` |
| `LOGIN_MAX_ATTEMPTS`, `LOGIN_MAX_ATTEMPTS_IP`, `LOGIN_LOCK_MINUTES` | Intentos fallidos de ingreso antes del bloqueo y su duración | `5`, `30` y `10` |
| `RESET_MAX_REQUESTS` | Solicitudes de recuperación por correo y por hora | `3` |
| `BACKUP_DIR`, `BACKUP_KEEP` | Carpeta de copias de seguridad y cuántas conservar | `instance/respaldos` y `14` |

El archivo `.env` nunca se sube al repositorio.

## Publicar en un servidor

La guía para el área de sistemas está en [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md): servidor, base de datos, HTTPS, correo, copias de seguridad y actualización.

## Datos personales

La plataforma guarda datos de estudiantes, algunos menores de edad, y datos sensibles (condiciones de aprendizaje). La política de tratamiento de datos se publica en `/politica-de-datos`. INDECAP es el responsable del tratamiento y debe revisar y aprobar esa política antes de usar la plataforma con estudiantes reales.

## Licencia

El código es obra de Ana Melo. INDECAP lo usa bajo la licencia de [`LICENCIA.md`](LICENCIA.md). Las bibliotecas, fuentes y recursos de terceros, con sus licencias, están en [`LICENCIAS-TERCEROS.md`](LICENCIAS-TERCEROS.md). El logo y la marca INDECAP pertenecen al instituto.
