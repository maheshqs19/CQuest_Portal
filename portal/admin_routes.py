"""User management, app catalogue, usage statistics, audit log and settings."""
import csv, datetime as dt, io, re
from collections import Counter, defaultdict
from flask import Blueprint, request, g, jsonify, Response
from sqlalchemy import func
from .config import Config
from .models import db, User, App, Grant, Session, Event, Audit, OneTimeToken, ROLES, ROLE_LABEL, utcnow
from .security import (roles_required, err, iso, can_manage, audit, settings, save_settings, DEFAULT_SETTINGS,
                       hash_pw, temp_password, new_link_token, end_sessions, sha)
from .auth_routes import user_json, _issuer

bp = Blueprint("admin", __name__, url_prefix="/api/admin")
MANAGERS = ("admin", "superuser")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{1,46}$")


def _apps_by_id():
    return {a.id: a for a in db.query(App).all()}


def _apply_grants(u, wanted):
    """wanted: list of {app_id, app_role}. Replaces the user's grants."""
    apps = _apps_by_id()
    want = {}
    for w in wanted or []:
        aid = int(w.get("app_id", 0))
        if aid in apps:
            roles = [r.strip() for r in (apps[aid].app_roles or "").split(",") if r.strip()]
            role = (w.get("app_role") or "").strip()
            want[aid] = role if (not roles or role in roles) else (roles[-1] if roles else "")
    before = {gr.app_id: gr.app_role for gr in u.grants}
    for gr in list(u.grants):
        if gr.app_id not in want:
            u.grants.remove(gr)
        else:
            gr.app_role = want[gr.app_id]
    for aid, role in want.items():
        if aid not in before:
            u.grants.append(Grant(app_id=aid, app_role=role, granted_by=g.user.id))
    added = [apps[a].name for a in want if a not in before]
    removed = [apps[a].name for a in before if a not in want]
    return added, removed


def _credentials(u, mode):
    """Returns what the creator must pass on: a one-time link (default) or a temporary password."""
    if mode == "temp":
        pw = temp_password()
        u.password_hash, u.must_change_pw = hash_pw(pw), True
        return {"temp_password": pw}
    if mode == "none":
        return {}
    raw = new_link_token(u)
    return {"link": f"{_issuer()}/#set-password={raw}", "link_hours": int(settings()["link_hours"])}


def _clean_user_fields(body, creating=False):
    out = {}
    if "name" in body or creating:
        name = (body.get("name") or "").strip()
        if not name:
            raise ValueError("Enter a name.")
        out["name"] = name[:120]
    if "email" in body or creating:
        email = (body.get("email") or "").strip().lower()
        if not EMAIL_RE.match(email):
            raise ValueError("Enter a valid email address.")
        out["email"] = email
    for f in ("department", "job_title"):
        if f in body:
            out[f] = (body.get(f) or "").strip()[:120]
    if "role" in body or creating:
        role = body.get("role") or "user"
        if role not in ROLES:
            raise ValueError("Unknown role.")
        out["role"] = role
    return out


def _active_admins(exclude=None):
    q = db.query(User).filter(User.role == "admin", User.status == "active")
    if exclude:
        q = q.filter(User.id != exclude)
    return q.count()


# ── users ──────────────────────────────────────────────────────────────────
@bp.get("/users")
@roles_required(*MANAGERS)
def list_users():
    users = db.query(User).order_by(User.name).all()
    return jsonify(users=[dict(user_json(u), manageable=can_manage(g.user, u.role) and u.id != g.user.id) for u in users])


@bp.get("/users/<int:uid>")
@roles_required(*MANAGERS)
def get_user(uid):
    u = db.get(User, uid) or None
    if not u:
        return err("User not found.", 404)
    apps = _apps_by_id()
    ev = db.query(Event).filter(Event.user_id == uid).order_by(Event.ts.desc()).limit(25).all()
    sess = db.query(Session).filter_by(user_id=uid).order_by(Session.last_seen.desc()).all()
    since = utcnow() - dt.timedelta(days=30)
    launches = db.query(Event).filter(Event.user_id == uid, Event.kind == "app_launch", Event.ts > since).count()
    return jsonify(user=dict(user_json(u), manageable=can_manage(g.user, u.role) and u.id != g.user.id),
                   launches_30d=launches,
                   sessions=[{"device": s.agent, "method": s.method, "network": s.ip, "started": iso(s.created_at),
                              "last_seen": iso(s.last_seen)} for s in sess],
                   activity=[{"ts": iso(e.ts), "kind": e.kind, "app": apps[e.app_id].name if e.app_id in apps else "",
                              "detail": e.detail} for e in ev])


@bp.post("/users")
@roles_required(*MANAGERS)
def create_user():
    body = request.get_json(silent=True) or {}
    try:
        f = _clean_user_fields(body, creating=True)
    except ValueError as e:
        return err(str(e), 422)
    if not can_manage(g.user, "user", f["role"]):
        return err("Super users can only create General users.", 403)
    if db.query(User).filter_by(email=f["email"]).first():
        return err("A user with this email already exists.", 409)
    u = User(created_by=g.user.id, **f)
    db.add(u)
    db.flush()
    _apply_grants(u, body.get("apps"))
    creds = _credentials(u, body.get("password_mode", "link"))
    audit("user.create", u.email, {"role": f["role"], "apps": [gr.app_id for gr in u.grants]})
    db.commit()
    return jsonify(user=user_json(u), **creds), 201


@bp.patch("/users/<int:uid>")
@roles_required(*MANAGERS)
def update_user(uid):
    u = db.get(User, uid)
    if not u:
        return err("User not found.", 404)
    body = request.get_json(silent=True) or {}
    self_edit = u.id == g.user.id
    try:
        f = _clean_user_fields(body)
    except ValueError as e:
        return err(str(e), 422)
    if not self_edit and not can_manage(g.user, u.role, f.get("role")):
        return err("You can't change this account.", 403)
    if self_edit and (("role" in f and f["role"] != u.role) or body.get("status") == "disabled"):
        return err("You can't change your own role or disable yourself.", 403)
    if self_edit and g.user.role != "admin" and "apps" in body:
        return err("Ask an admin to change your own app access.", 403)
    if u.role == "admin" and (f.get("role", "admin") != "admin" or body.get("status") == "disabled") \
            and _active_admins(exclude=u.id) == 0:
        return err("Keep at least one active Admin.", 409)
    if "email" in f and f["email"] != u.email and db.query(User).filter_by(email=f["email"]).first():
        return err("A user with this email already exists.", 409)
    changes = {k: [getattr(u, k), v] for k, v in f.items() if getattr(u, k) != v}
    for k, v in f.items():
        setattr(u, k, v)
    if body.get("status") in ("active", "disabled") and body["status"] != u.status:
        changes["status"] = [u.status, body["status"]]
        u.status = body["status"]
        if u.status == "disabled":
            end_sessions(u.id)
    if "apps" in body:
        added, removed = _apply_grants(u, body["apps"])
        if added:
            changes["apps_added"] = added
        if removed:
            changes["apps_removed"] = removed
    if changes:
        audit("user.update", u.email, changes)
    db.commit()
    return jsonify(user=user_json(u))


def _managed(uid):
    u = db.get(User, uid)
    if not u:
        return None, err("User not found.", 404)
    if u.id == g.user.id or not can_manage(g.user, u.role):
        return None, err("You can't change this account.", 403)
    return u, None


@bp.post("/users/<int:uid>/reset")
@roles_required(*MANAGERS)
def reset_user(uid):
    u, e = _managed(uid)
    if e:
        return e
    mode = (request.get_json(silent=True) or {}).get("mode", "link")
    creds = _credentials(u, mode)
    u.locked_until, u.failed_count = None, 0
    end_sessions(u.id)
    audit("user.reset_password", u.email, {"mode": mode})
    db.commit()
    return jsonify(ok=True, **creds)


@bp.post("/users/<int:uid>/unlock")
@roles_required(*MANAGERS)
def unlock_user(uid):
    u, e = _managed(uid)
    if e:
        return e
    u.locked_until, u.failed_count = None, 0
    audit("user.unlock", u.email)
    db.commit()
    return jsonify(user=user_json(u))


@bp.post("/users/<int:uid>/sign-out")
@roles_required(*MANAGERS)
def sign_out_user(uid):
    u, e = _managed(uid)
    if e:
        return e
    n = end_sessions(u.id)
    audit("user.sign_out_everywhere", u.email, {"sessions": n})
    db.commit()
    return jsonify(ok=True, ended=n)


def _delete_user(u):
    """Erasure: removes the account; usage events are kept only as anonymous counts."""
    db.query(Event).filter(Event.user_id == u.id).update({"user_id": None}, synchronize_session=False)
    db.query(Session).filter_by(user_id=u.id).delete()
    db.query(OneTimeToken).filter_by(user_id=u.id).delete()
    audit("user.delete", f"user #{u.id}")
    db.delete(u)


@bp.delete("/users/<int:uid>")
@roles_required("admin")
def delete_user(uid):
    u, e = _managed(uid)
    if e:
        return e
    if u.role == "admin" and _active_admins(exclude=u.id) == 0:
        return err("Keep at least one active Admin.", 409)
    _delete_user(u)
    db.commit()
    return jsonify(ok=True)


@bp.post("/users/bulk")
@roles_required(*MANAGERS)
def bulk():
    body = request.get_json(silent=True) or {}
    action, ids = body.get("action"), [int(i) for i in body.get("ids") or []]
    app = db.get(App, int(body.get("app_id") or 0)) if action in ("grant", "revoke") else None
    if action in ("grant", "revoke") and not app:
        return err("Choose an app.", 422)
    if action == "delete" and g.user.role != "admin":
        return err("Only Admins can delete users.", 403)
    done, skipped = 0, 0
    for u in db.query(User).filter(User.id.in_(ids)).all():
        if u.id == g.user.id or not can_manage(g.user, u.role):
            skipped += 1
            continue
        if action in ("disable", "delete") and u.role == "admin" and _active_admins(exclude=u.id) == 0:
            skipped += 1
            continue
        if action == "enable":
            u.status = "active"
        elif action == "disable":
            u.status = "disabled"
            end_sessions(u.id)
        elif action == "grant":
            gr = next((x for x in u.grants if x.app_id == app.id), None)
            roles = [r.strip() for r in (app.app_roles or "").split(",") if r.strip()]
            role = body.get("app_role") or (roles[-1] if roles else "")
            if gr:
                gr.app_role = role
            else:
                u.grants.append(Grant(app_id=app.id, app_role=role, granted_by=g.user.id))
        elif action == "revoke":
            for gr in list(u.grants):
                if gr.app_id == app.id:
                    u.grants.remove(gr)
        elif action == "delete":
            _delete_user(u)
        else:
            return err("Unknown action.", 422)
        done += 1
    audit(f"bulk.{action}", f"{done} users", {"app": app.name if app else None, "skipped": skipped})
    db.commit()
    return jsonify(ok=True, done=done, skipped=skipped)


@bp.post("/users/import")
@roles_required(*MANAGERS)
def import_users():
    """CSV columns: name,email,role,department,job_title,apps  (apps = app slugs separated by ';',
    optional app role after a colon, e.g. outreach:Reviewer;cv-builder)"""
    body = request.get_json(silent=True) or {}
    text, mode = body.get("csv") or "", body.get("password_mode", "link")
    rows = list(csv.DictReader(io.StringIO(text.strip())))
    if not rows:
        return err("The file has no rows. The first line must be the column headings.", 422)
    slugs = {a.slug: a for a in db.query(App).all()}
    results = []
    for i, r in enumerate(rows, start=2):
        r = {(k or "").strip().lower(): (v or "").strip() for k, v in r.items()}
        try:
            f = _clean_user_fields({"name": r.get("name"), "email": r.get("email"), "role": r.get("role") or "user",
                                    "department": r.get("department", ""), "job_title": r.get("job_title", "")},
                                   creating=True)
        except ValueError as e:
            results.append({"line": i, "email": r.get("email", ""), "status": "error", "message": str(e)})
            continue
        if not can_manage(g.user, "user", f["role"]):
            results.append({"line": i, "email": f["email"], "status": "error", "message": "Role not allowed for you"})
            continue
        if db.query(User).filter_by(email=f["email"]).first():
            results.append({"line": i, "email": f["email"], "status": "skipped", "message": "Already exists"})
            continue
        grants, unknown = [], []
        for part in filter(None, (p.strip() for p in r.get("apps", "").split(";"))):
            slug, _, role = part.partition(":")
            if slug in slugs:
                grants.append({"app_id": slugs[slug].id, "app_role": role})
            else:
                unknown.append(slug)
        u = User(created_by=g.user.id, **f)
        db.add(u)
        db.flush()
        _apply_grants(u, grants)
        creds = _credentials(u, mode)
        results.append({"line": i, "email": f["email"], "name": f["name"], "status": "created",
                        "message": ("Unknown apps: " + ", ".join(unknown)) if unknown else "", **creds})
    created = sum(1 for x in results if x["status"] == "created")
    audit("user.import", f"{created} users", {"rows": len(rows)})
    db.commit()
    return jsonify(results=results, created=created)


@bp.get("/users/export.csv")
@roles_required(*MANAGERS)
def export_users():
    apps = _apps_by_id()
    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(["name", "email", "role", "department", "job_title", "status", "apps", "last_sign_in", "created"])
    for u in db.query(User).order_by(User.name).all():
        w.writerow([u.name, u.email, u.role, u.department, u.job_title, u.status,
                    ";".join(f"{apps[gr.app_id].slug}:{gr.app_role}".rstrip(":") for gr in u.grants if gr.app_id in apps),
                    iso(u.last_login_at) or "", iso(u.created_at)])
    audit("user.export")
    db.commit()
    return Response(out.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": "attachment; filename=cquest-portal-users.csv"})


# ── app catalogue (Admins) ─────────────────────────────────────────────────
def app_admin_json(a, counts):
    return {"id": a.id, "slug": a.slug, "name": a.name, "description": a.description, "url": a.url, "icon": a.icon,
            "status": a.status, "sso": bool(a.sso), "app_roles": a.app_roles or "", "sort": a.sort,
            "users": counts.get(a.id, 0)}


@bp.get("/apps")
@roles_required(*MANAGERS)
def list_apps():
    counts = dict(db.query(Grant.app_id, func.count(Grant.id)).group_by(Grant.app_id).all())
    return jsonify(apps=[app_admin_json(a, counts) for a in db.query(App).order_by(App.sort, App.name).all()])


def _clean_app(body, a=None):
    out = {}
    for k in ("name", "description", "url", "icon", "status", "app_roles", "slug"):
        if k in body:
            out[k] = (body.get(k) or "").strip()
    if "sso" in body:
        out["sso"] = bool(body["sso"])
    if a is None or "name" in out:
        if not out.get("name"):
            raise ValueError("Enter an app name.")
    if a is None or "url" in out:
        if not re.match(r"^https?://", out.get("url", "")):
            raise ValueError("Enter the full app address, starting with https://")
    if a is None or "slug" in out:
        out["slug"] = (out.get("slug") or re.sub(r"[^a-z0-9]+", "-", out.get("name", "").lower()).strip("-"))[:46]
        if not SLUG_RE.match(out["slug"]):
            raise ValueError("Short name: lowercase letters, numbers and hyphens only.")
    if out.get("status", "live") not in ("live", "maintenance", "hidden"):
        raise ValueError("Unknown status.")
    if "app_roles" in out:
        out["app_roles"] = ",".join(r.strip() for r in out["app_roles"].split(",") if r.strip())
    return out


@bp.post("/apps")
@roles_required("admin")
def create_app_entry():
    body = request.get_json(silent=True) or {}
    try:
        f = _clean_app(body)
    except ValueError as e:
        return err(str(e), 422)
    if db.query(App).filter_by(slug=f["slug"]).first():
        return err("Another app already uses this short name.", 409)
    a = App(sort=(db.query(func.max(App.sort)).scalar() or 0) + 10, **f)
    db.add(a)
    audit("app.create", a.name, {"url": a.url})
    db.commit()
    return jsonify(app=app_admin_json(a, {})), 201


@bp.patch("/apps/<int:aid>")
@roles_required("admin")
def update_app_entry(aid):
    a = db.get(App, aid)
    if not a:
        return err("App not found.", 404)
    body = request.get_json(silent=True) or {}
    try:
        f = _clean_app(body, a)
    except ValueError as e:
        return err(str(e), 422)
    if "slug" in f and f["slug"] != a.slug and db.query(App).filter_by(slug=f["slug"]).first():
        return err("Another app already uses this short name.", 409)
    changes = {k: [getattr(a, k), v] for k, v in f.items() if getattr(a, k) != v}
    for k, v in f.items():
        setattr(a, k, v)
    if changes:
        audit("app.update", a.name, changes)
    db.commit()
    return jsonify(ok=True)


@bp.post("/apps/order")
@roles_required("admin")
def reorder_apps():
    ids = [int(i) for i in (request.get_json(silent=True) or {}).get("ids", [])]
    for n, aid in enumerate(ids):
        a = db.get(App, aid)
        if a:
            a.sort = (n + 1) * 10
    db.commit()
    return jsonify(ok=True)


@bp.delete("/apps/<int:aid>")
@roles_required("admin")
def delete_app_entry(aid):
    a = db.get(App, aid)
    if not a:
        return err("App not found.", 404)
    audit("app.delete", a.name)
    db.query(Event).filter(Event.app_id == aid).update({"app_id": None}, synchronize_session=False)
    db.delete(a)
    db.commit()
    return jsonify(ok=True)


# ── usage statistics ───────────────────────────────────────────────────────
@bp.get("/stats")
@roles_required(*MANAGERS)
def stats():
    days = max(1, min(int(request.args.get("days", 30)), 365))
    now = utcnow()
    start = (now - dt.timedelta(days=days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)
    prev_start = start - dt.timedelta(days=days)
    rows = db.query(Event.ts, Event.kind, Event.user_id, Event.app_id).filter(Event.ts >= prev_start).all()
    cur = [r for r in rows if r.ts >= start]
    prev = [r for r in rows if r.ts < start]
    users = {u.id: u for u in db.query(User).all()}
    apps = _apps_by_id()

    def kpis(ev):
        return {"active_users": len({e.user_id for e in ev if e.kind in ("sign_in", "app_launch") and e.user_id}),
                "sign_ins": sum(e.kind == "sign_in" for e in ev),
                "launches": sum(e.kind == "app_launch" for e in ev),
                "failed": sum(e.kind == "sign_in_failed" for e in ev)}

    daily = defaultdict(lambda: {"sign_ins": 0, "launches": 0, "users": set()})
    for e in cur:
        d = daily[e.ts.date().isoformat()]
        if e.kind == "sign_in":
            d["sign_ins"] += 1
        if e.kind == "app_launch":
            d["launches"] += 1
        if e.kind in ("sign_in", "app_launch") and e.user_id:
            d["users"].add(e.user_id)
    series = []
    for i in range(days):
        k = (start + dt.timedelta(days=i)).date().isoformat()
        d = daily.get(k, {"sign_ins": 0, "launches": 0, "users": set()})
        series.append({"date": k, "sign_ins": d["sign_ins"], "launches": d["launches"], "users": len(d["users"])})

    by_app = []
    granted = dict(db.query(Grant.app_id, func.count(Grant.id)).group_by(Grant.app_id).all())
    for aid, a in apps.items():
        ev = [e for e in cur if e.kind == "app_launch" and e.app_id == aid]
        last = max((e.ts for e in rows if e.kind == "app_launch" and e.app_id == aid), default=None)
        by_app.append({"id": aid, "name": a.name, "icon": a.icon, "launches": len(ev),
                       "users": len({e.user_id for e in ev if e.user_id}), "granted": granted.get(aid, 0),
                       "last": iso(last)})
    by_app.sort(key=lambda x: -x["launches"])

    dept = Counter()
    for e in cur:
        if e.kind == "app_launch" and e.user_id in users:
            dept[users[e.user_id].department or "Not set"] += 1

    top = Counter(e.user_id for e in cur if e.kind == "app_launch" and e.user_id in users)
    hours = [0] * 24
    for e in cur:
        if e.kind == "app_launch":
            hours[e.ts.hour] += 1

    cutoff = now - dt.timedelta(days=30)
    act = [u for u in users.values() if u.status == "active"]
    return jsonify(
        days=days, kpis=kpis(cur), previous=kpis(prev), series=series, by_app=by_app,
        by_department=[{"name": k, "launches": v} for k, v in dept.most_common(8)],
        top_users=[{"id": uid, "name": users[uid].name, "department": users[uid].department, "launches": n}
                   for uid, n in top.most_common(8)],
        hours_utc=hours,
        accounts={"total": len(users), "active": len(act), "disabled": len(users) - len(act),
                  "never_signed_in": sum(1 for u in act if not u.last_login_at),
                  "dormant_30d": sum(1 for u in act if u.last_login_at and u.last_login_at < cutoff),
                  "locked": sum(1 for u in act if u.locked_until and u.locked_until > now),
                  "by_role": {r: sum(1 for u in act if u.role == r) for r in ROLES}})


@bp.get("/stats/export.csv")
@roles_required(*MANAGERS)
def export_events():
    days = max(1, min(int(request.args.get("days", 30)), 365))
    since = utcnow() - dt.timedelta(days=days)
    apps, users = _apps_by_id(), {u.id: u for u in db.query(User).all()}
    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(["time_utc", "event", "user", "department", "app"])
    for e in db.query(Event).filter(Event.ts >= since).order_by(Event.ts).all():
        u = users.get(e.user_id)
        w.writerow([iso(e.ts), e.kind, u.email if u else "", u.department if u else "",
                    apps[e.app_id].name if e.app_id in apps else ""])
    return Response(out.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": f"attachment; filename=cquest-portal-usage-{days}d.csv"})


# ── audit log & settings (Admins) ──────────────────────────────────────────
@bp.get("/audit")
@roles_required("admin")
def audit_log():
    rows = db.query(Audit).order_by(Audit.ts.desc()).limit(min(int(request.args.get("limit", 300)), 2000)).all()
    return jsonify(entries=[{"ts": iso(a.ts), "actor": a.actor, "action": a.action, "target": a.target,
                             "detail": a.detail} for a in rows])


@bp.get("/settings")
@roles_required("admin")
def get_settings():
    return jsonify(settings=settings(), microsoft={"configured": Config.entra_enabled(),
                                                   "redirect_uri": _issuer() + "/auth/microsoft/callback"})


LIMITS = {"session_hours": (1, 72), "idle_minutes": (5, 480), "lockout_attempts": (3, 20),
          "lockout_minutes": (1, 240), "password_min": (8, 64), "retention_days": (30, 1095), "link_hours": (1, 168)}


@bp.patch("/settings")
@roles_required("admin")
def update_settings():
    body = request.get_json(silent=True) or {}
    changes = {}
    for k, v in body.items():
        if k not in DEFAULT_SETTINGS:
            continue
        if isinstance(DEFAULT_SETTINGS[k], bool):
            v = bool(v)
        else:
            lo, hi = LIMITS[k]
            try:
                v = int(v)
            except (TypeError, ValueError):
                return err(f"{k.replace('_', ' ').capitalize()} must be a number.", 422)
            if not lo <= v <= hi:
                return err(f"{k.replace('_', ' ').capitalize()} must be between {lo} and {hi}.", 422)
        changes[k] = v
    if changes.get("password_login") is False and not Config.entra_enabled():
        return err("Set up Microsoft sign-in before turning off password sign-in.", 409)
    old = settings()
    diff = {k: [old.get(k), v] for k, v in changes.items() if old.get(k) != v}
    save_settings(changes)
    if diff:
        audit("settings.update", "", diff)
    db.commit()
    return jsonify(settings=settings())
