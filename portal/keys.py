"""Launch tokens: short-lived RS256 JWTs the portal hands to an app when a card is opened.
Apps verify them against /.well-known/jwks.json - the identity/permissions contract."""
import base64, datetime as dt, hashlib, json, secrets
import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from sqlalchemy.exc import IntegrityError
from .models import db, Setting, utcnow

TOKEN_SECONDS = 60
_cache = {}


def _b64(n):
    b = n.to_bytes((n.bit_length() + 7) // 8, "big")
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def load_key(pem_from_env=""):
    if _cache.get("key"):
        return _cache["key"]
    pem = pem_from_env.strip()
    if not pem:
        row = db.get(Setting, "signing_key")
        if not row:
            k = rsa.generate_private_key(public_exponent=65537, key_size=2048)
            pem_new = k.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8,
                                      serialization.NoEncryption()).decode()
            try:
                db.add(Setting(key="signing_key", value=json.dumps(pem_new)))
                db.commit()
            except IntegrityError:                 # another worker created it first
                db.rollback()
            row = db.get(Setting, "signing_key")
        pem = json.loads(row.value)
    key = serialization.load_pem_private_key(pem.encode(), password=None)
    pub = key.public_key()
    der = pub.public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
    kid = hashlib.sha256(der).hexdigest()[:16]
    nums = pub.public_numbers()
    _cache.update(key=key, kid=kid, jwk={"kty": "RSA", "use": "sig", "alg": "RS256", "kid": kid,
                                         "n": _b64(nums.n), "e": _b64(nums.e)})
    return key


def jwks():
    return {"keys": [_cache["jwk"]]}


def mint(issuer, user, app, grant):
    now = utcnow().replace(tzinfo=dt.timezone.utc)
    claims = {
        "iss": issuer, "aud": app.slug, "sub": str(user.id),
        "email": user.email, "name": user.name,
        "portal_role": user.role, "app_role": (grant.app_role or ""),
        "department": user.department or "",
        "iat": now, "nbf": now, "exp": now + dt.timedelta(seconds=TOKEN_SECONDS),
        "jti": secrets.token_urlsafe(16),
    }
    return jwt.encode(claims, _cache["key"], algorithm="RS256", headers={"kid": _cache["kid"]})


def decode(token, issuer):
    pub = _cache["key"].public_key()
    return jwt.decode(token, pub, algorithms=["RS256"], issuer=issuer, options={"verify_aud": False})
