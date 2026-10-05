"""Drop-in for a connected Flask app (e.g. C-Quest Outreach) to accept portal sign-in.

    pip install "PyJWT[crypto]" requests
    env: PORTAL_URL=https://portal.c-quest.com   PORTAL_APP_SLUG=outreach

    from portal_sso import init_portal_sso
    init_portal_sso(app, role_map={"Administrator": "admin", "Reviewer": "reviewer"})
"""
import os
import jwt, requests
from flask import request, session, redirect

PORTAL = os.environ.get("PORTAL_URL", "").rstrip("/")
SLUG = os.environ.get("PORTAL_APP_SLUG", "")
_jwks = jwt.PyJWKClient(f"{PORTAL}/.well-known/jwks.json", cache_keys=True) if PORTAL else None


def verify(token):
    """Checks signature, issuer, audience and expiry. Raises jwt.PyJWTError if invalid."""
    key = _jwks.get_signing_key_from_jwt(token).key
    return jwt.decode(token, key, algorithms=["RS256"], audience=SLUG, issuer=PORTAL, leeway=10)


def redeem(token):
    """Optional stricter check: single use + access still current. Returns claims or None."""
    r = requests.post(f"{PORTAL}/api/launch/redeem", json={"token": token}, timeout=10)
    return r.json()["claims"] if r.status_code == 200 else None


def init_portal_sso(app, role_map, open_paths=("/static/", "/api/hooks/")):
    @app.before_request
    def _portal_gate():
        token = request.args.get("cq_token")
        if token:
            try:
                c = verify(token)
            except jwt.PyJWTError:
                return redirect(f"{PORTAL}/launch/{SLUG}")
            session.clear()
            session.update(user_email=c["email"], user_name=c["name"],
                           role=role_map.get(c.get("app_role"), "reviewer"), portal_sub=c["sub"])
            args = {k: v for k, v in request.args.items() if k != "cq_token"}
            clean = request.path + ("?" + "&".join(f"{k}={v}" for k, v in args.items()) if args else "")
            return redirect(clean)          # removes the token from the address bar
        if not session.get("user_email") and not request.path.startswith(open_paths):
            return redirect(f"{PORTAL}/launch/{SLUG}")   # no session -> go via the portal
