"""Sessions, passwords, CSRF, permissions, settings and statistics helpers."""
import datetime as dt, hashlib, ipaddress, json, secrets
from functools import wraps
from flask import request, g, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from .models import db, User, Session, Setting, Event, Audit, OneTimeToken, UsedLaunch, utcnow

COOKIE = "cq_portal"

DEFAULT_SETTINGS = {
    "session_hours": 10,          # absolute session lifetime
    "idle_minutes": 60,           # sign out after inactivity
    "lockout_attempts": 5,
    "lockout_minutes": 15,
    "password_min": 12,
    "password_login": True,       # email + password sign-in
    "retention_days": 365,        # usage statistics + audit retention
    "link_hours": 72,             # set-password link validity
}

COMMON = {"password", "password1", "password123", "qwerty123", "letmein", "welcome1", "123456789",
          "1234567890", "cquest123", "c-quest123", "admin123", "changeme", "iloveyou"}


def sha(v):
    return hashlib.sha256(v.encode()).hexdigest()


def iso(d):
    return d.isoformat(timespec="seconds") + "Z" if d else None


# ── settings ────────────────────────────────────────────────────────────────
def settings():
    if "settings" not in g:
        vals = dict(DEFAULT_SETTINGS)
        for s in db.query(Setting).filter(Setting.key.in_(list(DEFAULT_SETTINGS))).all():
            try:
                vals[s.key] = json.loads(s.value)
            except ValueError:
                pass
        g.settings = vals
    return g.settings


def save_settings(changes):
    for k, v in changes.items():
        row = db.get(Setting, k)
        if row:
            row.value = json.dumps(v)
        else:
            db.add(Setting(key=k, value=json.dumps(v)))
    g.pop("settings", None)


# ── client info (privacy: truncated IP only) ───────────────────────────────
def client_ip():
    raw = (request.remote_addr or "").strip()
    try:
        ip = ipaddress.ip_address(raw)
    except ValueError:
        return ""
    net = ipaddress.ip_network(f"{ip}/{24 if ip.version == 4 else 48}", strict=False)
    return str(net)


def agent_label():
    ua = request.headers.get("User-Agent", "")
    os_ = next((n for k, n in (("Windows", "Windows"), ("Mac OS", "macOS"), ("iPhone", "iPhone"),
                                ("iPad", "iPad"), ("Android", "Android"), ("Linux", "Linux")) if k in ua), "Unknown device")
    br = next((n for k, n in (("Edg/", "Edge"), ("Chrome/", "Chrome"), ("Firefox/", "Firefox"),
                               ("Safari/", "Safari")) if k in ua), "Browser")
    return f"{br} on {os_}"


# ── events & audit ─────────────────────────────────────────────────────────
def log_event(kind, user_id=None, app_id=None, detail=""):
    db.add(Event(kind=kind, user_id=user_id, app_id=app_id, ip=client_ip(), detail=detail[:200]))


def audit(action, target="", detail=None):
    u = g.get("user")
    db.add(Audit(actor_id=u.id if u else None, actor=(u.email if u else "system"), action=action,
                 target=target[:200], detail=json.dumps(detail or {}, default=str)))


def purge_old():
    """Retention: runs at most once an hour, from any worker."""
    marker = db.get(Setting, "last_purge")
    now = utcnow()
    if marker and now - dt.datetime.fromisoformat(json.loads(marker.value)) < dt.timedelta(hours=1):
        return
    cutoff = now - dt.timedelta(days=int(settings()["retention_days"]))
    db.query(Event).filter(Event.ts < cutoff).delete(synchronize_session=False)
    db.query(Audit).filter(Audit.ts < cutoff).delete(synchronize_session=False)
    db.query(Session).filter(Session.expires_at < now).delete(synchronize_session=False)
    db.query(OneTimeToken).filter(OneTimeToken.expires_at < now - dt.timedelta(days=7)).delete(synchronize_session=False)
    db.query(UsedLaunch).filter(UsedLaunch.expires_at < now).delete(synchronize_session=False)
    if marker:
        marker.value = json.dumps(now.isoformat())
    else:
        db.add(Setting(key="last_purge", value=json.dumps(now.isoformat())))
    db.commit()


# ── passwords ──────────────────────────────────────────────────────────────
def hash_pw(pw):
    return generate_password_hash(pw)


def check_pw(user, pw):
    return bool(user.password_hash) and check_password_hash(user.password_hash, pw)


def password_problem(pw, email=""):
    n = int(settings()["password_min"])
    if len(pw) < n:
        return f"Use at least {n} characters."
    if pw.lower() in COMMON or len(set(pw)) < 5:
        return "This password is too easy to guess."
    local = email.split("@")[0].lower()
    if len(local) >= 4 and local in pw.lower():
        return "Don't include your email name in the password."
    return None


def temp_password():
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
    return "-".join("".join(secrets.choice(alphabet) for _ in range(4)) for _ in range(4))


def new_link_token(user):
    raw = secrets.token_urlsafe(32)
    db.query(OneTimeToken).filter_by(user_id=user.id, purpose="set_password", used_at=None) \
        .update({"used_at": utcnow()})
    db.add(OneTimeToken(id=sha(raw), user_id=user.id, purpose="set_password",
                        expires_at=utcnow() + dt.timedelta(hours=int(settings()["link_hours"]))))
    return raw


# ── sessions ───────────────────────────────────────────────────────────────
def start_session(user, method="password"):
    raw = secrets.token_urlsafe(32)
    now = utcnow()
    s = Session(id=sha(raw), user_id=user.id, csrf=secrets.token_urlsafe(24), method=method,
                created_at=now, last_seen=now,
                expires_at=now + dt.timedelta(hours=int(settings()["session_hours"])),
                ip=client_ip(), agent=agent_label())
    db.add(s)
    user.last_login_at = now
    user.failed_count = 0
    user.locked_until = None
    return raw, s


def set_cookie(resp, raw, secure):
    resp.set_cookie(COOKIE, raw, httponly=True, secure=secure, samesite="Lax", path="/",
                    max_age=int(settings()["session_hours"]) * 3600)
    return resp


def load_session():
    g.user = g.sess = None
    raw = request.cookies.get(COOKIE)
    if not raw:
        return
    s = db.get(Session, sha(raw))
    if not s:
        return
    now = utcnow()
    idle = dt.timedelta(minutes=int(settings()["idle_minutes"]))
    if s.expires_at < now or now - s.last_seen > idle:
        db.delete(s)
        db.commit()
        return
    u = db.get(User, s.user_id)
    if not u or u.status != "active":
        db.delete(s)
        db.commit()
        return
    if (now - s.last_seen).total_seconds() > 60:
        s.last_seen = now
        db.commit()
    g.user, g.sess = u, s


def end_sessions(user_id, keep=None):
    q = db.query(Session).filter(Session.user_id == user_id)
    if keep:
        q = q.filter(Session.id != keep)
    return q.delete(synchronize_session=False)


# ── access control ─────────────────────────────────────────────────────────
def err(msg, code=400, **extra):
    return jsonify(error=msg, **extra), code


def login_required(fn):
    @wraps(fn)
    def w(*a, **k):
        if not g.get("user"):
            return err("Your session has ended. Sign in again.", 401)
        return fn(*a, **k)
    return w


def roles_required(*roles):
    def deco(fn):
        @wraps(fn)
        @login_required
        def w(*a, **k):
            if g.user.role not in roles:
                return err("You don't have permission to do that.", 403)
            return fn(*a, **k)
        return w
    return deco


def can_manage(actor, target_role, new_role=None):
    """Admins manage everyone. Super users manage General users only and can't promote."""
    if actor.role == "admin":
        return True
    if actor.role == "superuser":
        return target_role == "user" and (new_role in (None, "user"))
    return False
