# Licencias de terceros

indecap-aprende usa las bibliotecas, fuentes y recursos de esta lista. Todas permiten el uso gratuito, también en instituciones educativas, siempre que se conserven sus avisos de copyright y de licencia. Ninguna se modificó.

## Bibliotecas de Python (`requirements.txt`)

| Biblioteca | Versión | Licencia | Titular |
|---|---|---|---|
| Flask | 3.0.3 | BSD-3-Clause | Pallets |
| Flask-SQLAlchemy | 3.1.1 | BSD-3-Clause | Pallets |
| Flask-Migrate | 4.0.7 | MIT | Miguel Grinberg |
| Flask-Login | 0.6.3 | MIT | Matthew Frazier y colaboradores |
| Flask-WTF | 1.2.1 | BSD-3-Clause | WTForms |
| Flask-Babel | 4.0.0 | BSD-3-Clause | Armin Ronacher, Tyler Kennedy y colaboradores |
| python-dotenv | 1.0.1 | BSD-3-Clause | Saurabh Kumar y colaboradores |
| gunicorn | 22.0.0 | MIT | Benoit Chesneau y colaboradores |
| email-validator | 2.1.1 | Unlicense (dominio público) | Joshua Tauberer |
| psycopg (binary) | 3.3.6 | LGPL-3.0 | Daniele Varrazzo y colaboradores. Se usa como biblioteca sin modificarla, lo que la LGPL permite en cualquier proyecto. |

Dependencias que se instalan con las anteriores:

| Biblioteca | Licencia | Titular |
|---|---|---|
| SQLAlchemy | MIT | Mike Bayer y colaboradores |
| Alembic | MIT | Mike Bayer |
| Werkzeug, Jinja2, MarkupSafe, itsdangerous, click, blinker | BSD-3-Clause / MIT | Pallets |
| WTForms | BSD-3-Clause | WTForms |
| Babel | BSD-3-Clause | The Babel Team |
| dnspython | ISC | Dnspython Contributors |
| idna | BSD-3-Clause | Kim Davies |

Solo en el servidor, según cómo se instale (ver `docs/DESPLIEGUE.md`):

| Biblioteca | Licencia | Para qué |
|---|---|---|
| waitress | ZPL 2.1 | Servidor de la aplicación si el servidor del instituto es Windows. |

## Recursos que carga el navegador

| Recurso | Versión | Licencia | Titular | Desde |
|---|---|---|---|---|
| Bootstrap (CSS y JS) | 5.3.3 | MIT | The Bootstrap Authors | cdn.jsdelivr.net |
| Chart.js | 4.4.4 | MIT | Chart.js Contributors | cdn.jsdelivr.net |
| Fuente Montserrat | — | SIL Open Font License 1.1 | The Montserrat Project Authors | Google Fonts |
| Fuente Inter | — | SIL Open Font License 1.1 | The Inter Project Authors | Google Fonts |
| Fuente Playfair Display | — | SIL Open Font License 1.1 | The Playfair Display Project Authors | Google Fonts |

La lectura en voz alta usa la Web Speech API del navegador y las voces instaladas en cada equipo; la plataforma no incluye voces ni sonidos grabados. Los íconos con emoji de los juegos los dibuja la fuente del sistema de cada dispositivo.

## Imágenes

| Archivo | Titular | Uso |
|---|---|---|
| `app/static/images/logo-indecap-aprende.png` y `logo-indecap-aprende-blanco.png` | Corporación Educativa INDECAP (marca del instituto, adaptada para la plataforma) | Usado con autorización del instituto, solo dentro de la plataforma |
| `app/static/images/profesionaljpg.jpg` | Fotografía propia de Ana Melo | Todos los derechos reservados; no se incluye en la licencia del código |

## Textos de licencia

- **MIT:** se permite usar, copiar, modificar y distribuir el software, a condición de incluir el aviso de copyright y el texto de la licencia. Se entrega «tal cual», sin garantía.
- **BSD-3-Clause:** igual que MIT, y además no se puede usar el nombre de los autores para promocionar productos derivados sin su permiso.
- **ISC:** equivalente a MIT.
- **SIL Open Font License 1.1:** las fuentes se pueden usar, incrustar y redistribuir libremente; no se pueden vender por sí solas.
- **LGPL-3.0:** se puede usar la biblioteca desde cualquier programa; si se modificara la biblioteca misma, esos cambios tendrían que publicarse con la misma licencia.
- **ZPL 2.1:** licencia permisiva similar a BSD.
- **Unlicense:** dominio público.

Los textos completos de cada licencia vienen dentro de cada paquete instalado (carpeta `site-packages/<paquete>-<versión>.dist-info/`) y en los sitios oficiales de cada proyecto.
