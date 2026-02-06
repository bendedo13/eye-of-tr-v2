import smtplib
from contextlib import contextmanager
from email.message import EmailMessage
from urllib.parse import quote

from app.core.config import settings


class MailerError(Exception):
    pass


_last_codes: dict[str, str] = {}
_last_reset_urls: dict[str, str] = {}


def _base_url() -> str:
    return (settings.PUBLIC_BASE_URL or "").rstrip("/")


def _default_locale() -> str:
    return (settings.DEFAULT_LOCALE or "en").strip("/") or "en"


def _verification_links(to_email: str, code: str) -> tuple[str, str]:
    base = _base_url()
    locale = _default_locale()
    email_q = quote(to_email)
    code_q = quote(code)
    frontend = f"{base}/{locale}/verify-email?email={email_q}&debug_code={code_q}"
    api = f"{base}/api/auth/verify-link?email={email_q}&code={code_q}"
    return frontend, api


@contextmanager
def _smtp_client():
    if not settings.SMTP_HOST:
        raise MailerError("SMTP is not configured")
    timeout = settings.SMTP_TIMEOUT or 20
    if settings.SMTP_USE_SSL:
        server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=timeout)
    else:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=timeout)
    try:
        if settings.SMTP_STARTTLS and not settings.SMTP_USE_SSL:
            server.starttls()
        if settings.SMTP_USER and settings.SMTP_PASS:
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
        yield server
    finally:
        try:
            server.quit()
        except Exception:
            pass


def send_verification_code(to_email: str, code: str) -> None:
    _last_codes[to_email] = code
    if not settings.SMTP_HOST or not settings.SMTP_FROM:
        if settings.DEBUG:
            return
        raise MailerError("SMTP is not configured")

    frontend_link, api_link = _verification_links(to_email, code)
    from_email = settings.SMTP_FROM_VERIFY or settings.SMTP_FROM

    msg = EmailMessage()
    msg["Subject"] = "FaceSeek verification code"
    msg["From"] = from_email
    msg["To"] = to_email
    msg.set_content(
        "\n".join(
            [
                "Your FaceSeek verification code:",
                "",
                code,
                "",
                "Verify instantly:",
                api_link,
                "",
                "Or enter your code manually:",
                frontend_link,
                "",
                "If you did not create an account, you can ignore this email.",
            ]
        )
    )

    try:
        with _smtp_client() as server:
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
        with _smtp_client() as server:
            server.send_message(msg)
    except Exception as e:
        raise MailerError(str(e))


def get_last_reset_url(email: str) -> str | None:
    return _last_reset_urls.get(email)


def send_welcome_email(to_email: str) -> None:
    if not settings.SMTP_HOST or not settings.SMTP_FROM:
        if settings.DEBUG:
            return
        raise MailerError("SMTP is not configured")

    from_email = settings.SMTP_FROM_WELCOME or settings.SMTP_FROM

    msg = EmailMessage()
    msg["Subject"] = "Welcome to FaceSeek"
    msg["From"] = from_email
    msg["To"] = to_email
    msg.set_content(
        "\n".join(
            [
                "Welcome to FaceSeek!",
                "",
                "Your account is now active. You can sign in and start using the platform.",
                "",
                "If you need help, reply to this email or contact support.",
            ]
        )
    )

    try:
        with _smtp_client() as server:
            server.send_message(msg)
    except Exception as e:
        raise MailerError(str(e))
