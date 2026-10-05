"""C-Quest Portal - one sign-in, role-based access to C-Quest web apps."""
import logging, os
from flask import Flask, g, request, send_from_directory, jsonify
from werkzeug.middleware.proxy_fix import ProxyFix
from .config import Config
from .models import db, init_engine, User, App
from .security import load_session, purge_old, hash_pw, err
from . import keys

STATIC = os.path.join(os.path.dirname(__file__), "static")
CSRF_FREE = {"/api/auth/login", "/api/auth/set-password", "/api/launch/redeem"}


def create_app():
    Config.validate()
    app = Flask(__name__, static_folder=STATIC, static_url_path="/static")
    app.secret_key = Config.SECRET_KEY
    app.json.sort_keys = False
    if Config.TRUST_PROXY:
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    engine = init_engine(Config.DATABASE_URL)
    keys.load_key(Config.SIGNING_KEY_PEM)
    _bootstrap()
    db.remove()
    engine.dispose()          # gunicorn --preload: each worker opens its own connections

    from .auth_routes import bp as auth_bp
    from .admin_routes import bp as admin_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)

    @app.before_request
    def _before():
        if request.path.startswith("/static/") or request.path == "/healthz":
            return
        load_session()
        if request.method in ("POST", "PATCH", "PUT", "DELETE") and request.path.startswith("/api/") \
                and request.path not in CSRF_FREE and g.get("sess"):
            if request.headers.get("X-CSRF-Token") != g.sess.csrf:
                return err("Your session needs refreshing. Reload the page.", 403)
        try:
            purge_old()
        except Exception:                       # never block a request on housekeeping
            db.rollback()
            logging.exception("purge failed")

    @app.after_request
    def _headers(resp):
        resp.headers.setdefault("X-Content-Type-Options", "nosniff")
        resp.headers.setdefault("X-Frame-Options", "DENY")
        resp.headers.setdefault("Referrer-Policy", "same-origin")
        resp.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        resp.headers.setdefault("Content-Security-Policy",
                                "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; "
                                "script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; "
                                "form-action 'self' https://login.microsoftonline.com")
        if request.is_secure:
            resp.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        if request.path.startswith("/api/"):
            resp.headers.setdefault("Cache-Control", "no-store")
        return resp

    @app.teardown_appcontext
    def _teardown(exc):
        if exc:
            db.rollback()
        db.remove()

    @app.get("/healthz")
    def health():
        from sqlalchemy import text
        db.execute(text("select 1"))
        return jsonify(ok=True)

    @app.get("/")
    def index():
        r = send_from_directory(STATIC, "index.html")
        r.headers["Cache-Control"] = "no-cache"
        return r

    @app.errorhandler(404)
    def nf(e):
        if request.path.startswith("/api/"):
            return err("Not found.", 404)
        return index()

    return app


def _bootstrap():
    """First run: create the first Admin from env vars, and register the Email Outreach app."""
    try:
        if db.query(User).count() == 0 and Config.BOOTSTRAP_ADMIN_EMAIL:
            u = User(email=Config.BOOTSTRAP_ADMIN_EMAIL.strip().lower(), name=Config.BOOTSTRAP_ADMIN_NAME,
                     role="admin", must_change_pw=True)
            if Config.BOOTSTRAP_ADMIN_PASSWORD:
                u.password_hash = hash_pw(Config.BOOTSTRAP_ADMIN_PASSWORD)
            db.add(u)
            logging.warning("Created first Admin %s", u.email)
        if db.query(App).count() == 0:
            db.add(App(slug="outreach", name="Email Outreach", description="Review and send BD outreach emails",
                       url=os.environ.get("SEED_OUTREACH_URL", "https://web-production-30f18.up.railway.app"),
                       icon="mail", app_roles="Administrator,Reviewer", sso=True, sort=10))
        db.commit()
    except Exception:
        db.rollback()          # another worker bootstrapped at the same moment
