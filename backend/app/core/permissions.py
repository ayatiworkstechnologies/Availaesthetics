
from fastapi import Depends, HTTPException, status

from app.core.auth import get_current_admin
from app.models.admin_user import AdminUser


def require_super_admin(
    current_admin: AdminUser = Depends(get_current_admin),
) -> AdminUser:
    if current_admin.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin access required",
        )

    return current_admin
