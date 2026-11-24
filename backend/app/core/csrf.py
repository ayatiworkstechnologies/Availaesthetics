
import os

from dotenv import load_dotenv
from fastapi import HTTPException, Request, status

load_dotenv()


def verify_admin_request_origin(request: Request) -> None:
    origin = request.headers.get("origin")

    allowed_origins = {
        value.strip()
        for value in os.getenv(
            "ADMIN_ALLOWED_ORIGINS", ""
        ).split(",")
        if value.strip()
    }

    if not origin or origin not in allowed_origins:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Untrusted request origin",
        )
