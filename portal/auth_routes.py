"""Sign-in, own account, launching apps, Microsoft sign-in and the public token endpoints."""
import datetime as dt, secrets, urllib.parse
import jwt, requests
from flask import Blueprint, request, g, jsonify, redirect, current_app, make_response
from itsdangerous import URLSafeTimedSerializer, BadSignature
from .config import Config
from .models import db, User, App, Grant, Session, OneTimeToken, UsedLaunch, ROLE_LABEL, utcnow
from .security import (COOKIE, settings, sha, iso, err, login_required, start_session, set_cookie, end_sessions,
                       check_pw, hash_pw, password_problem, log_event, audit, client_ip)
from . import keys

bp = Blueprint("auth", __name__)


def user_json(u, detail=False):
    d = {"id": u.id, "email": u.email, "name": u.name, "department": u.department or "",
         "job_title": u.job_title or "", "role": u.role, "role_label": ROLE_LABEL.get(u.role, u.role),
         "status": u.status, "locked": bool(u.locked_until and u.locked_until > utcnow()),
         "must_change_pw": bool(u.must_change_pw), "has_password": bool(u.password_hash),
         "sso_linked": bool(u.entra_oid), "last_login_at": iso(u.last_login_at), "created_at": iso(u.created_at),
         "apps": [{"app_id": gr.app_id, "app_role": gr.app_role or ""} for gr in u.grants]}
    return d


def app_card(a, grant=None):
    return {"id": a.id, "slug": a.slug, "name": a.name, "description": a.description or "", "icon": a.icon,
            "status": a.status, "app_role": (grant.app_role if grant else "") or ""}


def my_apps(u):
    rows = (db.query(App, Grant).join(Grant, Grant.app_id == App.id)
            .filter(Grant.user_id == u.id, App.status != "hidden").order_by(App.sort, App.name).all())
    return [app_card(a, gr) for a, gr in rows]


def _issuer():
    return Config.PUBLIC_BASE_URL or request.host_url.rstrip("/")


def _safe_next(n):
    return n if n and n.startswith("/") and not n.startswith("//") else "/"


# ── who am I ───────────────────────────────────────────────────────────────
@bp.get("/api/session")
def session_info():
    s = settings()
    base = {"password_login": bool(s["password_login"]), "microsoft_login": Config.entra_enabled(),
            "password_min": int(s["password_min"])}
    if not g.user:
        return jsonify(signed_in=False, **base)
    return jsonify(signed_in=True, user=user_json(g.user), csrf=g.sess.csrf, apps=my_apps(g.user), **base)


# ── password sign-in ───────────────────────────────────────────────────────
@bp.post("/api/auth/login")
def login():
    s = settings()
    if not s["password_login"]:
        return err("Password sign-in is turned off. Use Sign in with Microsoft.", 403)
    body = request.get_json(silent=True) or {}
    email = (body.get("email") or "").strip().lower()
    pw = body.get("password") or ""
    ip = client_ip()
    from .models import Event
    since = utcnow() - dt.timedelta(minutes=15)
    if db.query(Event).filter(Event.kind == "sign_in_failed", Event.ip == ip, Event.ts > since).count() >= 30:
        return err("Too many attempts from this network. Wait 15 minutes and try again.", 429)
    u = db.query(User).filter(User.email == email).first()
    generic = "Email or password is incorrect."
    if not u:
        log_event("sign_in_failed", detail="unknown account")
        db.commit()
        return err(generic, 401)
    now = utcnow()
    if u.locked_until and u.locked_until > now:
        mins = max(1, int((u.locked_until - now).total_seconds() // 60) + 1)
        return err(f"This account is locked after repeated failed attempts. Try again in {mins} min or ask an admin to unlock it.", 423)
    if u.status != "active" or not check_pw(u, pw):
        if u.status == "active":
            u.failed_count = (u.failed_count or 0) + 1
            if u.failed_count >= int(s["lockout_attempts"]):
                u.locked_until = now + dt.timedelta(minutes=int(s["lockout_minutes"]))
                u.failed_count = 0
                log_event("account_locked", user_id=u.id)
        log_event("sign_in_failed", user_id=u.id)
        db.commit()
        return err(generic, 401)
    raw, sess = start_session(u, "password")
    log_event("sign_in", user_id=u.id, detail="password")
    db.commit()
    resp = jsonify(ok=True, must_change_pw=bool(u.must_change_pw))
    return set_cookie(resp, raw, Config.COOKIE_SECURE)


@bp.post("/api/auth/logout")
def logout():
    if g.get("sess"):
        log_event("sign_out", user_id=g.user.id)
        db.delete(g.sess)
        db.commit()
    resp = jsonify(ok=True)
    resp.delete_cookie(COOKIE, path="/")
    return resp


# ── set password from a one-time link ──────────────────────────────────────
@bp.post("/api/auth/set-password")
def set_password_from_link():
    body = request.get_json(silent=True) or {}
    t = db.get(OneTimeToken, sha(body.get("token") or ""))
    if not t or t.used_at or t.expires_at < utcnow() or t.purpose != "set_password":
        return err("This link has expired or was already used. Ask an admin for a new one.", 410)
    u = db.get(User, t.user_id)
    if not u or u.status != "active":
        return err("This account isn't active. Ask an admin.", 403)
    pw = body.get("password") or ""
    p = password_problem(pw, u.email)
    if p:
        return err(p, 422)
    u.password_hash, u.must_change_pw, u.pw_changed_at = hash_pw(pw), False, utcnow()
    u.locked_until, u.failed_count = None, 0
    t.used_at = utcnow()
    end_sessions(u.id)
    log_event("password_set", user_id=u.id)
    db.commit()
    return jsonify(ok=True, email=u.email)


# ── own account ────────────────────────────────────────────────────────────
@bp.post("/api/me/password")
@login_required
def change_password():
    body = request.get_json(silent=True) or {}
    u = g.user
    if u.password_hash and not check_pw(u, body.get("current") or ""):
        return err("Current password is incorrect.", 422)
    new = body.get("new") or ""
    if u.password_hash and check_pw(u, new):
        return err("Choose a password you haven't used here before.", 422)
    p = password_problem(new, u.email)
    if p:
        return err(p, 422)
    u.password_hash, u.must_change_pw, u.pw_changed_at = hash_pw(new), False, utcnow()
    end_sessions(u.id, keep=g.sess.id)
    log_event("password_changed", user_id=u.id)
    db.commit()
    return jsonify(ok=True)


@bp.get("/api/me/sessions")
@login_required
def my_sessions():
    rows = db.query(Session).filter_by(user_id=g.user.id).order_by(Session.last_seen.desc()).all()
    return jsonify(sessions=[{"id": s.id[:12], "current": s.id == g.sess.id, "device": s.agent, "method": s.method,
                              "network": s.ip, "started": iso(s.created_at), "last_seen": iso(s.last_seen)} for s in rows])


@bp.post("/api/me/sessions/end-others")
@login_required
def end_other_sessions():
    n = end_sessions(g.user.id, keep=g.sess.id)
    db.commit()
    return jsonify(ok=True, ended=n)


# ── launching an app (card click opens this in a new tab) ──────────────────
@bp.get("/launch/<slug>")
def launch(slug):
    if not g.user:
        return redirect("/?next=" + urllib.parse.quote(f"/launch/{slug}"))
    if g.user.must_change_pw:
        return redirect("/")
    a = db.query(App).filter_by(slug=slug).first()
    gr = a and db.query(Grant).filter_by(user_id=g.user.id, app_id=a.id).first()
    if not a or not gr or a.status == "hidden":
        log_event("launch_denied", user_id=g.user.id, app_id=a.id if a else None)
        db.commit()
        return redirect("/#denied")
    if a.status == "maintenance":
        return redirect("/#maintenance")
    log_event("app_launch", user_id=g.user.id, app_id=a.id)
    db.commit()
    target = a.url
    if a.sso:
        token = keys.mint(_issuer(), g.user, a, gr)
        parts = urllib.parse.urlsplit(a.url)
        q = urllib.parse.parse_qsl(parts.query) + [("cq_token", token)]
        target = urllib.parse.urlunsplit(parts._replace(query=urllib.parse.urlencode(q)))
    resp = redirect(target)
    resp.headers["Referrer-Policy"] = "no-referrer"
    return resp


# ── public endpoints for connected apps ────────────────────────────────────
@bp.get("/.well-known/jwks.json")
def jwks():
    r = jsonify(keys.jwks())
    r.headers["Cache-Control"] = "public, max-age=3600"
    return r


@bp.get("/.well-known/cquest-portal")
def portal_meta():
    iss = _issuer()
    return jsonify(issuer=iss, jwks_uri=f"{iss}/.well-known/jwks.json", redeem_endpoint=f"{iss}/api/launch/redeem",
                   token_param="cq_token", algorithm="RS256", token_lifetime_seconds=keys.TOKEN_SECONDS)


@bp.post("/api/launch/redeem")
def redeem():
    """Optional: apps can POST the token here instead of verifying it themselves. Single use."""
    token = (request.get_json(silent=True) or {}).get("token") or request.form.get("token") or ""
    try:
        c = keys.decode(token, _issuer())
    except jwt.PyJWTError:
        return err("Invalid or expired launch token.", 401)
    if db.get(UsedLaunch, c["jti"]):
        return err("This launch token was already used.", 401)
    db.add(UsedLaunch(jti=c["jti"], expires_at=dt.datetime.fromtimestamp(c["exp"], dt.timezone.utc).replace(tzinfo=None)))
    u = db.get(User, int(c["sub"]))
    a = db.query(App).filter_by(slug=c["aud"]).first()
    still = u and u.status == "active" and a and db.query(Grant).filter_by(user_id=u.id, app_id=a.id).first()
    db.commit()
    if not still:
        return err("Access has been removed for this user.", 403)
    return jsonify(valid=True, claims=c)


# ── Microsoft Entra ID sign-in (optional; portal still decides app access) ──
def _ser():
    return URLSafeTimedSerializer(current_app.secret_key, salt="entra-state")


@bp.get("/auth/microsoft")
def ms_start():
    if not Config.entra_enabled():
        return redirect("/#sso-off")
    state, nonce = secrets.token_urlsafe(16), secrets.token_urlsafe(16)
    nxt = _safe_next(request.args.get("next"))
    params = {"client_id": Config.ENTRA_CLIENT_ID, "response_type": "code", "response_mode": "query",
              "redirect_uri": _issuer() + "/auth/microsoft/callback", "scope": "openid profile email",
              "state": state, "nonce": nonce, "prompt": "select_account"}
    resp = redirect(f"https://login.microsoftonline.com/{Config.ENTRA_TENANT_ID}/oauth2/v2.0/authorize?"
                    + urllib.parse.urlencode(params))
    resp.set_cookie("cq_oidc", _ser().dumps({"s": state, "n": nonce, "next": nxt}), max_age=600,
                    httponly=True, secure=Config.COOKIE_SECURE, samesite="Lax")
    return resp


@bp.get("/auth/microsoft/callback")
def ms_callback():
    try:
        st = _ser().loads(request.cookies.get("cq_oidc", ""), max_age=600)
    except BadSignature:
        return redirect("/#sso-failed")
    if request.args.get("state") != st["s"] or "code" not in request.args:
        return redirect("/#sso-failed")
    tid = Config.ENTRA_TENANT_ID
    r = requests.post(f"https://login.microsoftonline.com/{tid}/oauth2/v2.0/token", timeout=15, data={
        "client_id": Config.ENTRA_CLIENT_ID, "client_secret": Config.ENTRA_CLIENT_SECRET, "grant_type": "authorization_code",
        "code": request.args["code"], "redirect_uri": _issuer() + "/auth/microsoft/callback", "scope": "openid profile email"})
    if r.status_code != 200:
        return redirect("/#sso-failed")
    idt = r.json().get("id_token", "")
    try:
        jwk = jwt.PyJWKClient(f"https://login.microsoftonline.com/{tid}/discovery/v2.0/keys").get_signing_key_from_jwt(idt)
        c = jwt.decode(idt, jwk.key, algorithms=["RS256"], audience=Config.ENTRA_CLIENT_ID,
                       issuer=f"https://login.microsoftonline.com/{tid}/v2.0")
    except jwt.PyJWTError:
        return redirect("/#sso-failed")
    if c.get("nonce") != st["n"]:
        return redirect("/#sso-failed")
    oid = c.get("oid", "")
    email = (c.get("email") or c.get("preferred_username") or "").strip().lower()
    u = db.query(User).filter_by(entra_oid=oid).first() or db.query(User).filter_by(email=email).first()
    if not u or u.status != "active" or (u.entra_oid and u.entra_oid != oid):
        log_event("sign_in_failed", user_id=u.id if u else None, detail="microsoft: no portal access")
        db.commit()
        return redirect("/#no-access")
    u.entra_oid = oid
    raw, sess = start_session(u, "microsoft")
    u.must_change_pw = False
    log_event("sign_in", user_id=u.id, detail="microsoft")
    db.commit()
    resp = redirect(st["next"])
    resp.delete_cookie("cq_oidc")
    return set_cookie(resp, raw, Config.COOKIE_SECURE)
