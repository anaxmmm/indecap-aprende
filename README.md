# INDECAP-APRENDE

Inclusive educational web platform for Corporación Educativa INDECAP (Instituto de Ciencias Aplicadas) in Envigado, Colombia. Degree project for the Software Development program.

It supports students aged 15 to 26 with eight learning conditions through one game per condition, built on Universal Design for Learning (UDL). It is a teaching support tool: it does not diagnose and does not replace the guidance of the institute's psychology team.

Author: Ana Melo · 2026

---

## What's included

- **8 web games**, one per condition, each with 50 activities across 5 levels (Basic, Medium, High, Very High and Super Hard):

  | Game | Condition |
  |---|---|
  | Space Market | Dyscalculia |
  | The Linguistic Enigma | Hearing impairment |
  | Routine Sorter | Cognitive disability |
  | Sound Eco-Explorer | Visual impairment |
  | The Rebel Letter Detector | Dyslexia |
  | Rhythm and Focus Mission | ADHD |
  | The World Architect | Oppositional defiant disorder |
  | The Signal Station | Autism spectrum disorder |

- **Shared accessibility bar**: read-aloud, high contrast (deep blue and white), text size, reduced motion, hints and full keyboard navigation.
- **Student dashboard**: monthly streak, progress in each game, games introduced by their characters, and a "How did you feel?" self-assessment. Students never see clinical labels; conditions only appear in the teacher and administrator dashboards.
- **Teacher dashboard**: overview with a performance chart, student registry by group, each student's history with a report to print or save as PDF, Teacher Mode to project any activity and see its answers, and user guides.
- **Administration**: administrator, teacher and student accounts; archived accounts that can be restored; export and permanent deletion of a student's data.
- **Spanish and English** across the whole platform, games included.
- **Security and personal data**: login attempt limits, password recovery by email, automatic logout after inactivity, data processing consent and a public data policy (Colombian Law 1581 of 2012).
- **Colombia time zone** in every dashboard; the database stores dates in UTC.

## Tech stack

| Layer | Tools |
|---|---|
| Server | Python 3.11 or later, Flask 3 with blueprints |
| Data | SQLAlchemy 2 and Alembic migrations (Flask-Migrate). SQLite for development; PostgreSQL recommended for production |
| Interface | Jinja templates, HTML, CSS and vanilla JavaScript; Bootstrap 5 and Chart.js from a CDN |
| Languages | Flask-Babel (catalog in `app/translations`) and one dictionary per game (`app/static/js/games/<game>/en.json`) |
| Accessibility | ARIA, full keyboard support and the Web Speech API |
| Testing | pytest |

## Project structure

```
indecap-aprende/
├── run.py                  entry point (flask and gunicorn)
├── requirements.txt
├── babel.cfg
├── app/
│   ├── __init__.py         application factory, security and languages
│   ├── config.py           per-environment settings and variables
│   ├── cli.py              commands: create-admin, seed-trastornos, respaldo
│   ├── blueprints/         auth · dashboard · games · admin · inclusive · modules
│   │                       (routes.py, services.py, forms.py in each one)
│   ├── models/             data models
│   ├── utils/              dates (Colombia time) and email
│   ├── templates/
│   ├── static/
│   │   ├── css/  images/
│   │   └── js/games/core/  shared engine (engine.js, a11y.js, session.js)
│   │       └── <game>/     each game's logic and its English dictionary
│   └── translations/en/
├── migrations/             database history (Alembic)
├── tests/
└── docs/                   deployment guide and project logs
```

## Running the project locally

```bash
# 1. Virtual environment
python -m venv .venv
.venv\Scripts\activate            # Windows
source .venv/bin/activate         # Linux or macOS

# 2. Dependencies
pip install -r requirements.txt

# 3. Environment variables
copy .env.example .env            # Windows
cp .env.example .env              # Linux or macOS

# 4. Database (creates or updates every table)
flask --app run.py db upgrade

# 5. Base conditions and the first administrator account
flask --app run.py seed-trastornos
flask --app run.py create-admin

# 6. Development server
flask --app run.py run
```

Open `http://127.0.0.1:5000`. The first account created with `create-admin` becomes the main administrator, the only one who can create other administrators.

Without `DATABASE_URL`, the project uses the file `instance/indecap_dev.db` (SQLite).

## Useful commands

| Command | What it does |
|---|---|
| `flask --app run.py db upgrade` | Applies pending migrations. Run it every time you update the code. |
| `flask --app run.py db migrate -m "message"` | Generates a new migration after changing a model. |
| `flask --app run.py create-admin` | Creates or promotes an administrator account. |
| `flask --app run.py seed-trastornos` | Loads or updates the 8 base conditions. |
| `flask --app run.py respaldo` | Backs up the database (see `docs/DESPLIEGUE.md`). |
| `python -m pytest` | Runs the tests. |

## Translations

Platform text is written in Spanish inside `_()` and translated in `app/translations/en/LC_MESSAGES/messages.po`:

```bash
pybabel extract -F babel.cfg -k _l -k lazy_gettext -o messages.pot .
pybabel update -i messages.pot -d app/translations
# translate the new entries in messages.po
pybabel compile -d app/translations
```

In the games, instructions, hints and explanations are marked with `_t("...")` and translated in each game's `en.json`. Words and sentences that students practice in Spanish (dictations, readings, stories) are not translated.

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `FLASK_ENV` | `development` or `production` | `development` |
| `SECRET_KEY` | Secret key for sessions and links. Required in production (32 characters or more). | development only |
| `DATABASE_URL` | Database, for example `postgresql://user:password@host:5432/indecap_aprende` | local SQLite |
| `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_USE_TLS`, `MAIL_USE_SSL`, `MAIL_DEFAULT_SENDER` | Outgoing email for password recovery | no email |
| `DATA_CONTACT_EMAIL` | Email for personal data requests | `indecap@indecap.edu.co` |
| `TRUSTED_PROXIES` | Proxies (for example nginx) in front of the application | `0` |
| `IDLE_TIMEOUT_MINUTES`, `IDLE_WARNING_MINUTES` | Logout after inactivity and the warning before it | `30` and `5` |
| `LOGIN_MAX_ATTEMPTS`, `LOGIN_MAX_ATTEMPTS_IP`, `LOGIN_LOCK_MINUTES` | Failed login attempts before lockout, and its duration | `5`, `30` and `10` |
| `RESET_MAX_REQUESTS` | Password recovery requests per email per hour | `3` |
| `BACKUP_DIR`, `BACKUP_KEEP` | Backup folder and how many backups to keep | `instance/respaldos` and `14` |

The `.env` file is never committed to the repository.

## Deploying to a server

The guide for the IT team is in [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md): server, database, HTTPS, email, backups and updates.

## Personal data

The platform stores student data, some of it about minors, and sensitive data (learning conditions). The data processing policy is published at `/politica-de-datos`. INDECAP is the data controller and must review and approve that policy before using the platform with real students.

## License

The code is the work of Ana Melo. INDECAP uses it under the license in [`LICENCIA.md`](LICENCIA.md). Third-party libraries, fonts and assets, with their licenses, are listed in [`LICENCIAS-TERCEROS.md`](LICENCIAS-TERCEROS.md). The INDECAP logo and brand belong to the institute.
