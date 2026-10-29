"""Envío de correos con la biblioteca estándar de Python (smtplib).

El servidor de correo lo define el área de sistemas en las variables de
entorno MAIL_*. Si no está configurado, el envío no se intenta y la función
devuelve False para que quien la llama decida qué hacer.
"""
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr

from flask import current_app


def mail_configured() -> bool:
    cfg = current_app.config
    return bool(cfg.get("MAIL_SERVER") and (cfg.get("MAIL_DEFAULT_SENDER") or cfg.get("MAIL_USERNAME")))


def send_mail(to: str, subject: str, text: str, html: str = None) -> bool:
    """Envía un correo. Devuelve True si el servidor lo aceptó."""
    if not mail_configured():
        return False

    cfg = current_app.config
    sender = cfg.get("MAIL_DEFAULT_SENDER") or cfg.get("MAIL_USERNAME")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender if "<" in sender else formataddr(("indecap-aprende", sender))
    msg["To"] = to
    msg.set_content(text)
    if html:
        msg.add_alternative(html, subtype="html")

    try:
        context = ssl.create_default_context()
        if cfg.get("MAIL_USE_SSL"):
            server = smtplib.SMTP_SSL(cfg["MAIL_SERVER"], cfg["MAIL_PORT"], context=context, timeout=20)
        else:
            server = smtplib.SMTP(cfg["MAIL_SERVER"], cfg["MAIL_PORT"], timeout=20)
            if cfg.get("MAIL_USE_TLS"):
                server.starttls(context=context)
        with server:
            if cfg.get("MAIL_USERNAME"):
                server.login(cfg["MAIL_USERNAME"], cfg.get("MAIL_PASSWORD", ""))
            server.send_message(msg)
        return True
    except (OSError, smtplib.SMTPException):
        current_app.logger.exception("No se pudo enviar el correo a %s", to)
        return False
