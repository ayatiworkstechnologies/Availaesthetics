import unittest
from types import SimpleNamespace
from unittest.mock import patch

from pydantic import ValidationError

from app.api.public_homepage_locations import get_public_homepage_locations
from app.main import app
from app.schemas.homepage_locations_settings import HomepageLocationsContent
from app.services.homepage_locations_settings_service import (
    HomepageLocationsValidationError,
    validate_selected_locations,
)


def location(location_id="katy"):
    return {
        "id": location_id,
        "name": "Katy",
        "regionLabel": "West Houston",
        "addressLine1": "23659 Katy Fwy",
        "addressLine2": "Suite 400",
        "city": "Katy",
        "state": "TX",
        "postalCode": "77494",
        "country": "USA",
        "phone": "(713) 590-0680",
        "phoneHref": "tel:+17135900680",
        "mapsUrl": "https://maps.app.goo.gl/example",
        "mapEmbedUrl": "https://www.google.com/maps/embed?pb=example",
    }


def content(**overrides):
    value = {
        "heading": "Our Locations",
        "description": "Homepage locations.",
        "locations": [location()],
        "defaultSelectedLocationId": "katy",
    }
    value.update(overrides)
    return value


class HomepageLocationsTests(unittest.TestCase):
    def test_routes_are_registered(self):
        paths = app.openapi()["paths"]
        self.assertIn("get", paths["/api/v1/admin/homepage/locations"])
        self.assertIn("put", paths["/api/v1/admin/homepage/locations/draft"])
        self.assertIn("post", paths["/api/v1/admin/homepage/locations/publish"])
        self.assertIn("get", paths["/api/v1/public/homepage/locations"])

    def test_content_preserves_cards_order_and_default(self):
        value = content(
            locations=[location("katy"), location("cypress")]
        )
        parsed = HomepageLocationsContent.model_validate(value)
        self.assertEqual([item.id for item in parsed.locations], ["katy", "cypress"])
        self.assertEqual(parsed.defaultSelectedLocationId, "katy")

    def test_content_rejects_duplicate_or_unselected_default(self):
        invalid = (
            content(locations=[location(), location()]),
            content(defaultSelectedLocationId="cypress"),
        )
        for value in invalid:
            with self.subTest(value=value), self.assertRaises(ValidationError):
                HomepageLocationsContent.model_validate(value)

    def test_publish_requires_a_homepage_location(self):
        parsed = HomepageLocationsContent.model_validate(
            content(locations=[], defaultSelectedLocationId=None)
        )
        with self.assertRaises(HomepageLocationsValidationError):
            validate_selected_locations(content=parsed)

    @patch("app.api.public_homepage_locations.get_homepage_locations_settings")
    def test_public_response_returns_only_published_homepage_content(
        self,
        get_settings,
    ):
        get_settings.return_value = SimpleNamespace(
            published_content=content()
        )
        response = get_public_homepage_locations(db=SimpleNamespace())
        self.assertEqual(response.locations[0].id, "katy")
        self.assertEqual(response.defaultSelectedLocationId, "katy")


if __name__ == "__main__":
    unittest.main()
