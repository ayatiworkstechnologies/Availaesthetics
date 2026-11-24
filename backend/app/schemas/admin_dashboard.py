
from pydantic import BaseModel


class AdminDashboardSummary(BaseModel):
    total_locations: int
    published_locations: int
    draft_locations: int
    total_location_admins: int
