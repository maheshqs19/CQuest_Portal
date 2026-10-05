"""Data model. Portable SQL only (SQLite locally, PostgreSQL on Railway / Azure Database for PostgreSQL)."""
import datetime as dt
from sqlalchemy import (create_engine, Column, Integer, String, Text, Boolean, DateTime, ForeignKey,
                        UniqueConstraint, Index)
from sqlalchemy.orm import declarative_base, relationship, scoped_session, sessionmaker

Base = declarative_base()
db = scoped_session(sessionmaker(expire_on_commit=False))

ROLES = ("admin", "superuser", "user")          # Admin > Super user > General user
ROLE_LABEL = {"admin": "Admin", "superuser": "Super user", "user": "General user"}


def utcnow():
    return dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String(254), unique=True, nullable=False, index=True)
    name = Column(String(120), nullable=False)
    department = Column(String(120), default="")
    job_title = Column(String(120), default="")
    role = Column(String(16), nullable=False, default="user")
    status = Column(String(16), nullable=False, default="active")      # active | disabled
    password_hash = Column(String(255))
    must_change_pw = Column(Boolean, default=False)
    failed_count = Column(Integer, default=0)
    locked_until = Column(DateTime)
    entra_oid = Column(String(64), unique=True)
    created_at = Column(DateTime, default=utcnow)
    created_by = Column(Integer)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    last_login_at = Column(DateTime)
    pw_changed_at = Column(DateTime)
    grants = relationship("Grant", cascade="all, delete-orphan", back_populates="user")


class App(Base):
    __tablename__ = "apps"
    id = Column(Integer, primary_key=True)
    slug = Column(String(48), unique=True, nullable=False)
    name = Column(String(80), nullable=False)
    description = Column(String(200), default="")
    url = Column(String(500), nullable=False)
    icon = Column(String(32), default="grid")
    status = Column(String(16), default="live")        # live | maintenance | hidden
    sso = Column(Boolean, default=True)                # pass a signed launch token to the app
    app_roles = Column(String(300), default="")        # comma list, e.g. "Administrator,Reviewer"
    sort = Column(Integer, default=100)
    created_at = Column(DateTime, default=utcnow)
    grants = relationship("Grant", cascade="all, delete-orphan", back_populates="app")


class Grant(Base):
    __tablename__ = "grants"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    app_id = Column(Integer, ForeignKey("apps.id", ondelete="CASCADE"), nullable=False)
    app_role = Column(String(60), default="")
    granted_by = Column(Integer)
    granted_at = Column(DateTime, default=utcnow)
    user = relationship("User", back_populates="grants")
    app = relationship("App", back_populates="grants")
    __table_args__ = (UniqueConstraint("user_id", "app_id"),)


class Session(Base):
    __tablename__ = "sessions"
    id = Column(String(64), primary_key=True)          # sha256 of the cookie value
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    csrf = Column(String(64), nullable=False)
    method = Column(String(16), default="password")
    created_at = Column(DateTime, default=utcnow)
    last_seen = Column(DateTime, default=utcnow)
    expires_at = Column(DateTime, nullable=False)
    ip = Column(String(64), default="")
    agent = Column(String(200), default="")


class OneTimeToken(Base):
    __tablename__ = "one_time_tokens"
    id = Column(String(64), primary_key=True)          # sha256 of the token
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    purpose = Column(String(24), nullable=False)       # set_password
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime)


class UsedLaunch(Base):
    __tablename__ = "used_launches"
    jti = Column(String(64), primary_key=True)
    expires_at = Column(DateTime, nullable=False)


class Event(Base):
    """Usage statistics. Minimal personal data: user id + truncated IP; purged after the retention period."""
    __tablename__ = "events"
    id = Column(Integer, primary_key=True)
    ts = Column(DateTime, default=utcnow, nullable=False)
    kind = Column(String(32), nullable=False)
    user_id = Column(Integer)
    app_id = Column(Integer)
    ip = Column(String(64), default="")
    detail = Column(String(200), default="")
    __table_args__ = (Index("ix_events_ts_kind", "ts", "kind"),)


class Audit(Base):
    __tablename__ = "audit"
    id = Column(Integer, primary_key=True)
    ts = Column(DateTime, default=utcnow, nullable=False, index=True)
    actor_id = Column(Integer)
    actor = Column(String(160), default="")
    action = Column(String(48), nullable=False)
    target = Column(String(200), default="")
    detail = Column(Text, default="")


class Setting(Base):
    __tablename__ = "settings"
    key = Column(String(64), primary_key=True)
    value = Column(Text, nullable=False)


def init_engine(url):
    kw = {"pool_pre_ping": True}
    if url.startswith("sqlite"):
        kw["connect_args"] = {"check_same_thread": False}
    else:
        kw.update(pool_size=5, max_overflow=5, pool_recycle=1800)
    engine = create_engine(url, **kw)
    db.configure(bind=engine)
    Base.metadata.create_all(engine)
    return engine
