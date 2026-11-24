
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.permissions import require_super_admin
from app.database import get_db
from app.models.admin_user import AdminUser
from app.models.location import Location
from app.schemas.admin_dashboard import AdminDashboardSummary


router = APIRouter(
    prefix="/api/v1/admin/dashboard",
    tags=["Admin Dashboard"],
)


@router.get(
    "/summary",
    response_model=AdminDashboardSummary,
)
def get_dashboard_summary(
    current_admin: AdminUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    total_locations = db.scalar(
        select(func.count(Location.id))
    ) or 0

    published_locations = db.scalar(
        select(func.count(Location.id)).where(
            Location.publication_status == "published",
            Location.is_active.is_(True),
        )
    ) or 0

    draft_locations = db.scalar(
        select(func.count(Location.id)).where(
            Location.publication_status == "draft",
        )
    ) or 0

    total_location_admins = db.scalar(
        select(func.count(AdminUser.id)).where(
            AdminUser.role == "location_admin",
        )
    ) or 0

    return AdminDashboardSummary(
        total_locations=total_locations,
        published_locations=published_locations,
        draft_locations=draft_locations,
        total_location_admins=total_location_admins,
    )
