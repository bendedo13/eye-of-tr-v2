import smtplib
from email.message import EmailMessage

from app.core.config import settings


class MailerError(Exception):
    pass


_last_codes: dict[str, str] = {}
_last_reset_urls: dict[str, str] = {}


def send_verification_code(to_email: str, code: str) -> None:
    _last_codes[to_email] = code
    if not settings.SMTP_HOST or not settings.SMTP_FROM:
        if settings.DEBUG:
            return
        raise MailerError("SMTP is not configured")

    msg = EmailMessage()
    msg["Subject"] = "FaceSeek verification code"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email
    msg.set_content(
        "\n".join(
            [
                "Your FaceSeek verification code:",
                "",
                code,
                "",
                "If you did not create an account, you can ignore this email.",
            ]
        )
    )

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
            server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASS:
                server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.send_message(msg)
    except Exception as e:
        raise MailerError(str(e))


def get_last_code(email: str) -> str | None:
    return _last_codes.get(email)


def send_password_reset(to_email: str, reset_url: str) -> None:
    _last_reset_urls[to_email] = reset_url
    if not settings.SMTP_HOST or not settings.SMTP_FROM:
        if settings.DEBUG:
            return
        raise MailerError("SMTP is not configured")

    msg = EmailMessage()
    msg["Subject"] = "FaceSeek password reset"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email
    msg.set_content(
        "\n".join(
            [
                "Password reset requested for your FaceSeek account.",
                "",
                f"Reset link: {reset_url}",
                "",
                "If you did not request this, you can ignore this email.",
            ]
        )
    )

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
            server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASS:
                server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.send_message(msg)
    except Exception as e:
        raise MailerError(str(e))


def get_last_reset_url(email: str) -> str | None:
    return _last_reset_urls.get(email)
