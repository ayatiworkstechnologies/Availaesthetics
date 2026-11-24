
import hashlib
import os
from datetime import datetime, timezone

from fastapi import Cookie, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.admin_user import AdminUser
from app.models.admin_session import AdminSession


SESSION_COOKIE = "avail_admin_session"
SESSION_SECONDS = 8 * 60 * 60

SECURE_COOKIE = (
    os.getenv("APP_ENV", "development").lower()
    == "production"
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(
        tzinfo=None
    )


def hash_session_token(token: str) -> str:
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


def get_current_admin(
    session_cookie: str | None = Cookie(
        default=None,
        alias=SESSION_COOKIE,
    ),
    db: Session = Depends(get_db),
) -> AdminUser:

    unauthorized = HTTPException(
        status_code=401,
        detail="Authentication required",
    )

    if not session_cookie:
        raise unauthorized

    statement = (
        select(AdminUser)
        .join(
            AdminSession,
            AdminSession.admin_user_id == AdminUser.id,
        )
        .where(
            AdminSession.token_hash
            == hash_session_token(session_cookie),
            AdminSession.expires_at > utc_now(),
            AdminUser.is_active.is_(True),
        )
    )

    admin = db.scalar(statement)

    if admin is None:
        raise unauthorized

    return admin
