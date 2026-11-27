
from fastapi import FastAPI

from app.api.locations import router as locations_router
from app.api.auth import router as auth_router
from app.api.admin_dashboard import router as admin_dashboard_router
from app.api.admin_locations import router as admin_locations_router
from app.api.admin_location_configurations import (
    router as admin_location_configurations_router,
)
from app.api.admin_location_operating_hours import (
    router as admin_operating_hours_router,
)
from app.api.admin_publishing_readiness import (
    router as publishing_readiness_router,
)
from app.api.admin_publication_history import (
    router as publication_history_router,
)
from app.api.public_published_locations import (
    router as public_published_locations_router,
)
from app.api import public_homepage
from app.api import admin_homepage
from app.api import (
    admin_homepage_categories,
    public_homepage_categories,
)
from app.api import (
    admin_homepage_signature,
    public_homepage_signature,
)
from app.api import (
    admin_homepage_testimonials,
    public_homepage_testimonials,
)

app = FastAPI(
    title="Avail Aesthetics MD API",
    version="1.0.0",
)


@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "message": "Avail Aesthetics backend is running",
    }


# Register API routers
app.include_router(locations_router)
app.include_router(auth_router)
app.include_router(admin_dashboard_router)
app.include_router(admin_locations_router)
app.include_router(admin_location_configurations_router)
app.include_router(admin_operating_hours_router)
app.include_router(publishing_readiness_router)
app.include_router(publication_history_router)
app.include_router(public_published_locations_router)
app.include_router(public_homepage.router)
app.include_router(admin_homepage.router)
app.include_router(
    admin_homepage_categories.router,
    prefix="/api/v1",
)

app.include_router(
    public_homepage_categories.router,
    prefix="/api/v1",
)
# =====================================
# SIGNATURE AESTHETICS CMS
# =====================================

app.include_router(
    admin_homepage_signature.router,
    prefix="/api/v1",
)

app.include_router(
    public_homepage_signature.router,
    prefix="/api/v1",
)

# =====================================
# TESTIMONIALS CMS
# =====================================

app.include_router(
    admin_homepage_testimonials.router,
    prefix="/api/v1",
)

app.include_router(
    public_homepage_testimonials.router,
    prefix="/api/v1",
)