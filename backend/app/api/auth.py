
import secrets
from datetime import timedelta

from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    HTTPException,
    Response,
)
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.auth import (
    SECURE_COOKIE,
    SESSION_COOKIE,
    SESSION_SECONDS,
    get_current_admin,
    hash_session_token,
    utc_now,
)
from app.core.security import verify_password
from app.database import get_db
from app.models.admin_user import AdminUser
from app.models.admin_session import AdminSession
from app.schemas.auth import LoginRequest, AdminResponse


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)


@router.post("/login", response_model=AdminResponse)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    email = payload.email.strip().lower()

    admin = db.scalar(
        select(AdminUser).where(
            AdminUser.email == email
        )
    )

    if (
        admin is None
        or not admin.is_active
        or not verify_password(
            payload.password,
            admin.password_hash,
        )
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    token = secrets.token_urlsafe(32)

    session = AdminSession(
        admin_user_id=admin.id,
        token_hash=hash_session_token(token),
        expires_at=utc_now()
        + timedelta(seconds=SESSION_SECONDS),
    )

    db.add(session)
    db.commit()

    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        httponly=True,
        secure=SECURE_COOKIE,
        samesite="lax",
        max_age=SESSION_SECONDS,
        path="/",
    )

    response.headers["Cache-Control"] = "no-store"

    return admin


@router.get("/me", response_model=AdminResponse)
def get_my_profile(
    response: Response,
    admin: AdminUser = Depends(get_current_admin),
):
    response.headers["Cache-Control"] = "no-store"
    return admin


@router.post("/logout")
def logout(
    response: Response,
    session_cookie: str | None = Cookie(
        default=None,
        alias=SESSION_COOKIE,
    ),
    db: Session = Depends(get_db),
):
    if session_cookie:
        db.execute(
            delete(AdminSession).where(
                AdminSession.token_hash
                == hash_session_token(session_cookie)
            )
        )
        db.commit()

    response.delete_cookie(
        key=SESSION_COOKIE,
        path="/",
    )

    response.headers["Cache-Control"] = "no-store"

    return {"message": "Logged out successfully"}
