"""Runtime configuration. Everything comes from environment variables so the same
container image runs unchanged on Railway today and Azure (App Service / Container Apps) later."""
import os, secrets, logging


def _bool(name, default=False):
    v = os.environ.get(name)
    return default if v is None else v.strip().lower() in ("1", "true", "yes", "on")


def _db_url():
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url:
        return "sqlite:///" + os.path.abspath(os.environ.get("SQLITE_PATH", "portal.db"))
    # Railway / Heroku style -> SQLAlchemy + psycopg 3
    for old in ("postgres://", "postgresql://"):
        if url.startswith(old):
            return "postgresql+psycopg://" + url[len(old):]
    return url


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY") or ""
    DATABASE_URL = _db_url()
    PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "").rstrip("/")
    COOKIE_SECURE = _bool("COOKIE_SECURE", True)
    TRUST_PROXY = _bool("TRUST_PROXY", True)          # Railway and Azure both terminate TLS at a proxy

    # Optional Microsoft Entra ID single sign-on (enabled when all three are set)
    ENTRA_TENANT_ID = os.environ.get("ENTRA_TENANT_ID", "")
    ENTRA_CLIENT_ID = os.environ.get("ENTRA_CLIENT_ID", "")
    ENTRA_CLIENT_SECRET = os.environ.get("ENTRA_CLIENT_SECRET", "")

    # Optional: PEM private key for launch tokens. If absent one is generated and kept in the database.
    SIGNING_KEY_PEM = os.environ.get("SIGNING_KEY_PEM", "")

    # First run only: creates the first Admin when the user table is empty
    BOOTSTRAP_ADMIN_EMAIL = os.environ.get("BOOTSTRAP_ADMIN_EMAIL", "")
    BOOTSTRAP_ADMIN_PASSWORD = os.environ.get("BOOTSTRAP_ADMIN_PASSWORD", "")
    BOOTSTRAP_ADMIN_NAME = os.environ.get("BOOTSTRAP_ADMIN_NAME", "Portal Admin")

    @classmethod
    def entra_enabled(cls):
        return bool(cls.ENTRA_TENANT_ID and cls.ENTRA_CLIENT_ID and cls.ENTRA_CLIENT_SECRET)

    @classmethod
    def validate(cls):
        if not cls.SECRET_KEY:
            logging.warning("SECRET_KEY not set - using a random key (sessions reset on restart). Set it in production.")
            cls.SECRET_KEY = secrets.token_urlsafe(48)
