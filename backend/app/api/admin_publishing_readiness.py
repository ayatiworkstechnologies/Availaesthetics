
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import require_super_admin
from app.database import get_db

from app.models.admin_user import AdminUser
from app.models.location import Location
from app.models.location_configuration import LocationConfiguration
from app.models.location_operating_hour import LocationOperatingHour

from app.schemas.publishing_readiness import (
    ReadinessCheck,
    PublishingReadinessResponse,
)


router = APIRouter(
    prefix="/api/v1/admin/locations",
    tags=["Admin Publishing Readiness"],
)


@router.get(
    "/{location_id}/publishing-readiness",
    response_model=PublishingReadinessResponse,
)
def get_publishing_readiness(
    location_id: int,
    current_admin: AdminUser = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    # Step 1: Verify the clinic exists
    location = db.get(Location, location_id)

    if location is None:
        raise HTTPException(
            status_code=404,
            detail="Clinic not found",
        )

    # Store results of individual readiness checks
    checks: list[ReadinessCheck] = []

    # IMPORTANT:
    # This helper must remain INSIDE get_publishing_readiness.
    def add_check(
        key: str,
        label: str,
        condition: object,
        failure_message: str,
    ) -> None:
        passed = bool(condition)

        checks.append(
            ReadinessCheck(
                key=key,
                label=label,
                passed=passed,
                message=(
                    "Requirement satisfied."
                    if passed
                    else failure_message
                ),
            )
        )

    # Step 2: Validate clinic identity
    identity_ready = bool(
        location.name
        and location.name.strip()
        and location.slug
        and location.slug.strip()
        and location.is_active
    )

    add_check(
        "identity",
        "Clinic Identity",
        identity_ready,
        "Clinic name, slug and active status must be valid.",
    )

    # Step 3: Load clinic configuration
    config = db.scalar(
        select(LocationConfiguration).where(
            LocationConfiguration.location_id == location_id
        )
    )

    # Step 4: Validate clinic address
    address_ready = bool(
        config
        and config.address_line1
        and config.address_line1.strip()
        and config.city
        and config.city.strip()
        and config.state
        and config.state.strip()
        and config.country
        and config.country.strip()
    )

    add_check(
        "address",
        "Clinic Address",
        address_ready,
        "Address line 1, city, state and country are required.",
    )

    # Step 5: Validate contact information
    contact_ready = bool(
        config
        and (
            (config.phone and config.phone.strip())
            or (config.email and config.email.strip())
        )
    )

    add_check(
        "contact",
        "Contact Information",
        contact_ready,
        "Provide at least one clinic phone number or email.",
    )

    # Step 6: Validate SEO settings
    seo_ready = bool(
        config
        and config.seo_title
        and config.seo_title.strip()
        and config.seo_description
        and config.seo_description.strip()
    )

    add_check(
        "seo",
        "SEO Settings",
        seo_ready,
        "SEO title and description are required.",
    )

    # Step 7: Load weekly operating hours
    hours = db.scalars(
        select(LocationOperatingHour).where(
            LocationOperatingHour.location_id == location_id
        )
    ).all()

    # Step 8: Validate all seven days
    hours_ready = (
        len(hours) == 7
        and {hour.day_of_week for hour in hours}
        == set(range(7))
        and all(
            (
                hour.is_closed
                and hour.opening_time is None
                and hour.closing_time is None
            )
            or
            (
                not hour.is_closed
                and hour.opening_time is not None
                and hour.closing_time is not None
                and hour.opening_time < hour.closing_time
            )
            for hour in hours
        )
    )

    add_check(
        "operating_hours",
        "Operating Hours",
        hours_ready,
        "All seven weekdays must have valid schedules.",
    )

    # Step 9: Calculate foundation readiness
    foundation_ready = all(
        check.passed for check in checks
    )

    # Step 10: Track outstanding publishing requirements
    pending_modules = [
        "Approved location homepage content",
        "Location-specific treatments and EMR booking URLs",
        "Publication history and audit controls",
    ]

    # Step 11: Return the complete readiness response
    return PublishingReadinessResponse(
        location_id=location.id,
        location_name=location.name,
        publication_status=location.publication_status,
        foundation_ready=foundation_ready,
        can_publish=False,
        checks=checks,
        pending_modules=pending_modules,
    )
