# Connecting an app to the C-Quest Portal

## How a launch works

1. User clicks a card → browser opens `https://<portal>/launch/<short-name>` in a new tab.
2. Portal checks the user is signed in, active and has access, then records the launch.
3. If *Sign users in automatically* is on for the app, the portal redirects to the app's address with `?cq_token=<JWT>`; otherwise it just opens the address.
4. The app verifies the token, starts its own session, and removes the token from the address bar.

## Launch token (RS256 JWT, valid 60 seconds)

| Claim | Meaning |
|---|---|
| `iss` | Portal address (`PUBLIC_BASE_URL`) |
| `aud` | App short name, e.g. `outreach` |
| `sub` | Portal user id (stable) |
| `email`, `name`, `department` | User details |
| `portal_role` | `admin`, `superuser` or `user` |
| `app_role` | Role chosen for this app, e.g. `Reviewer` |
| `jti` | Unique id (for single use) |

Public keys: `GET /.well-known/jwks.json`. Metadata: `GET /.well-known/cquest-portal`.

## Two ways to verify

**A. Verify locally (recommended):** check signature against the JWKS, `iss`, `aud`, `exp`. See `examples/portal_sso.py`.

**B. Ask the portal:** `POST /api/launch/redeem` with `{"token": "..."}` → `200 {"valid": true, "claims": {...}}`. Single use, and it also confirms access hasn't been removed since the click.

## App responsibilities

- Map `app_role` to the app's own permissions; ignore unknown roles (lowest permission).
- If there's no app session, redirect to `https://<portal>/launch/<short-name>` — this gives single sign-on for bookmarks.
- Keep machine endpoints (e.g. Power Automate webhooks) outside the portal gate; they keep their own secrets.
- Session lifetime is the app's own; access removed in the portal takes effect at the user's next launch (use option B or short sessions if that must be immediate).

## Email Outreach

Register it in App catalogue with roles `Administrator,Reviewer`, then add `portal_sso.py` to the Outreach repo with
`init_portal_sso(app, role_map={"Administrator": "admin", "Reviewer": "reviewer"}, open_paths=("/static/", "/api/flow/"))`
— adjust `open_paths` to the Outreach webhook routes. Keep its existing login as a fallback until everyone is moved over.
