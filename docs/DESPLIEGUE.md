# Guía de despliegue de indecap-aprende

Guía para el área de sistemas de INDECAP. Explica cómo instalar la plataforma en un servidor del instituto, publicarla con HTTPS, configurar el correo y programar copias de seguridad.

Contacto técnico del proyecto: Ana Melo.

---

## 1. Qué se necesita

| Elemento | Recomendado |
|---|---|
| Servidor | Linux (Ubuntu Server 22.04 o 24.04) con 2 GB de RAM y 10 GB de disco. También funciona en Windows Server (sección 9). |
| Python | 3.11 o superior |
| Base de datos | PostgreSQL 14 o superior. SQLite sirve para pruebas o muy pocos usuarios. |
| Dominio | Un subdominio del instituto, por ejemplo `aprende.indecap.edu.co`, apuntando al servidor |
| Certificado HTTPS | Let's Encrypt (gratuito) o el certificado del instituto |
| Correo saliente | Una cuenta institucional para enviar los enlaces de recuperación de contraseña |

La plataforma se probó con SQLite y con PostgreSQL 16: migraciones, juegos, paneles, informes, exportación y borrado de datos.

## 2. Preparar el servidor (Linux)

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nginx postgresql postgresql-client
sudo adduser --system --group --home /opt/indecap indecap
```

Copiar el código del proyecto a `/opt/indecap/app` (con `git clone` o copiando la carpeta) y crear el entorno virtual:

```bash
cd /opt/indecap/app
sudo -u indecap python3 -m venv .venv
sudo -u indecap .venv/bin/pip install -r requirements.txt   # incluye el controlador de PostgreSQL
```

## 3. Base de datos

```bash
sudo -u postgres psql
CREATE USER indecap WITH PASSWORD 'una-clave-larga-y-unica';
CREATE DATABASE indecap_aprende OWNER indecap;
\q
```

## 4. Variables de entorno

Crear `/opt/indecap/app/.env` (solo lo puede leer el usuario `indecap`). Los comentarios van siempre en su propia línea:

```ini
FLASK_ENV=production
# Generar con: python3 -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=
DATABASE_URL=postgresql+psycopg://indecap:una-clave-larga-y-unica@localhost:5432/indecap_aprende

# Correo para la recuperación de contraseña (ver sección 7)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=plataforma@indecap.edu.co
# Contraseña de aplicación, no la clave normal de la cuenta
MAIL_PASSWORD=
MAIL_DEFAULT_SENDER=indecap-aprende <plataforma@indecap.edu.co>

# Correo donde se atienden las solicitudes sobre datos personales
DATA_CONTACT_EMAIL=indecap@indecap.edu.co

# nginx está delante de la aplicación
TRUSTED_PROXIES=1

# Copias de seguridad
BACKUP_DIR=/opt/indecap/respaldos
BACKUP_KEEP=14
```

```bash
sudo chown indecap:indecap /opt/indecap/app/.env
sudo chmod 600 /opt/indecap/app/.env
```

Con `FLASK_ENV=production` la aplicación no arranca si `SECRET_KEY` falta o es corta: así se evita publicarla con la clave de ejemplo.

## 5. Crear las tablas y la primera cuenta

```bash
cd /opt/indecap/app
sudo -u indecap .venv/bin/flask --app run.py db upgrade
sudo -u indecap .venv/bin/flask --app run.py seed-trastornos
sudo -u indecap .venv/bin/flask --app run.py create-admin
```

La cuenta de `create-admin` queda como administrador principal: desde el menú del avatar, en «Usuarios», crea a los demás administradores y a los docentes.

## 6. Servicio y HTTPS

**Servicio de la aplicación** — `/etc/systemd/system/indecap.service`:

```ini
[Unit]
Description=indecap-aprende
After=network.target postgresql.service

[Service]
User=indecap
Group=indecap
WorkingDirectory=/opt/indecap/app
EnvironmentFile=/opt/indecap/app/.env
ExecStart=/opt/indecap/app/.venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 run:app
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now indecap
```

**nginx** — `/etc/nginx/sites-available/indecap`:

```nginx
server {
    listen 80;
    server_name aprende.indecap.edu.co;

    client_max_body_size 5m;

    location /static/ {
        alias /opt/indecap/app/app/static/;
        expires 7d;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/indecap /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**Certificado HTTPS** con Let's Encrypt:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d aprende.indecap.edu.co
```

En producción las cookies de sesión solo viajan por HTTPS, así que la plataforma tiene que publicarse con certificado.

## 7. Correo de recuperación de contraseña

La plataforma envía el enlace por SMTP. Datos según el proveedor del instituto:

| Proveedor | `MAIL_SERVER` | `MAIL_PORT` | Notas |
|---|---|---|---|
| Google Workspace o Gmail | `smtp.gmail.com` | `587` | Activar verificación en dos pasos y crear una «contraseña de aplicación» |
| Microsoft 365 | `smtp.office365.com` | `587` | La cuenta debe tener habilitado «SMTP autenticado» |
| Servidor propio | el del instituto | `587` (o `465` con `MAIL_USE_SSL=true`) | |

Prueba: en la pantalla de ingreso, «¿Olvidaste tu contraseña?» con una cuenta real. El enlace sirve una sola vez y durante una hora. Si el correo no está configurado, la plataforma no muestra el enlace en pantalla y deja un aviso en el registro del servicio (`journalctl -u indecap`).

## 8. Copias de seguridad

El comando `flask respaldo` copia la base de datos en `BACKUP_DIR` y conserva las `BACKUP_KEEP` más recientes. Con PostgreSQL usa `pg_dump` (paquete `postgresql-client`).

Programarlo cada noche a las 2:00 a. m. (`sudo crontab -u indecap -e`). Los comandos `flask` leen el archivo `.env` de la carpeta del proyecto:

```cron
0 2 * * * cd /opt/indecap/app && .venv/bin/flask --app run.py respaldo >> /opt/indecap/respaldos/registro.log 2>&1
```

Además, copiar la carpeta `/opt/indecap/respaldos` a otro equipo o almacenamiento del instituto: una copia en el mismo disco no protege si el servidor se daña.

**Restaurar** una copia de PostgreSQL:

```bash
sudo systemctl stop indecap
pg_restore --clean --no-owner -d indecap_aprende /opt/indecap/respaldos/indecap-AAAAMMDD-HHMMSS.dump
sudo systemctl start indecap
```

Con SQLite basta con detener el servicio y reemplazar el archivo de la base por la copia.

## 9. Si el servidor es Windows

`gunicorn` no funciona en Windows. Alternativa:

1. Instalar Python 3.11+ y PostgreSQL para Windows.
2. Instalar el servidor `waitress` (licencia ZPL 2.1): `pip install waitress`.
3. Definir las variables de entorno de la sección 4 en las variables del sistema o en el `.env`.
4. Ejecutar `waitress-serve --listen=127.0.0.1:8000 run:app` como servicio (por ejemplo con NSSM).
5. Publicar con IIS (URL Rewrite y ARR) o nginx para Windows, con certificado HTTPS, y `TRUSTED_PROXIES=1`.
6. Programar `flask --app run.py respaldo` cada noche en el Programador de tareas.

## 10. Actualizar la plataforma

```bash
cd /opt/indecap/app
sudo -u indecap .venv/bin/flask --app run.py respaldo     # copia antes de actualizar
sudo -u indecap git pull                                   # o copiar la nueva versión
sudo -u indecap .venv/bin/pip install -r requirements.txt
sudo -u indecap .venv/bin/flask --app run.py db upgrade
sudo systemctl restart indecap
```

## 11. Lista de verificación antes de abrirla a estudiantes

- [ ] `FLASK_ENV=production` y `SECRET_KEY` propia de 64 caracteres.
- [ ] El sitio abre con `https://` y el candado del navegador está bien.
- [ ] «¿Olvidaste tu contraseña?» envía el correo y el enlace funciona.
- [ ] `flask respaldo` crea una copia y la tarea nocturna está programada.
- [ ] Las copias se guardan también fuera del servidor.
- [ ] INDECAP revisó y aprobó la política de datos (`/politica-de-datos`) y el correo de contacto es el correcto.
- [ ] Se recogieron las autorizaciones de tratamiento de datos de los estudiantes, o de sus acudientes si son menores de edad.
- [ ] Hay al menos dos administradores, por si uno pierde el acceso.

## 12. Ajustes de seguridad disponibles

| Variable | Qué controla | Valor por defecto |
|---|---|---|
| `LOGIN_MAX_ATTEMPTS` | Intentos fallidos por correo antes de bloquear | 5 |
| `LOGIN_MAX_ATTEMPTS_IP` | Intentos fallidos por dirección IP (en el instituto muchos comparten la misma) | 30 |
| `LOGIN_LOCK_MINUTES` | Minutos de bloqueo | 10 |
| `RESET_MAX_REQUESTS` | Correos de recuperación por cuenta y por hora | 3 |
| `IDLE_TIMEOUT_MINUTES` | Cierre de sesión por inactividad (no aplica a quien marcó «Recordarme») | 30 |
| `IDLE_WARNING_MINUTES` | Aviso antes del cierre | 5 |
