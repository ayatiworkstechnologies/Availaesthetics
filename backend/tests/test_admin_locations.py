import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError
from starlette.requests import Request

from app.api.admin_locations import update_admin_location
from app.core.auth import get_current_admin
from app.core.permissions import require_super_admin
from app.main import app
from app.schemas.admin_location import AdminLocationUpdate


def request_with_origin(origin: str = "http://localhost:3000") -> Request:
    return Request(
        {
            "type": "http",
            "method": "PUT",
            "path": "/api/v1/admin/locations/1",
            "headers": [(b"origin", origin.encode())],
        }
    )


class FakeDb:
    def __init__(self, location=None, commit_error=None):
        self.location = location
        self.commit_error = commit_error
        self.committed = False
        self.refreshed = False
        self.rolled_back = False

    def get(self, _model, _location_id):
        return self.location

    def commit(self):
        if self.commit_error:
            raise self.commit_error
        self.committed = True

    def refresh(self, _location):
        self.refreshed = True

    def rollback(self):
        self.rolled_back = True


class AdminLocationTests(unittest.TestCase):
    def test_routes_are_registered(self):
        paths = app.openapi()["paths"]

        self.assertIn("get", paths["/api/v1/admin/locations"])
        self.assertIn("post", paths["/api/v1/admin/locations"])
        self.assertIn("get", paths["/api/v1/admin/locations/{location_id}"])
        self.assertIn("put", paths["/api/v1/admin/locations/{location_id}"])

    def test_missing_session_is_unauthorized(self):
        with self.assertRaises(HTTPException) as raised:
            get_current_admin(session_cookie=None, db=SimpleNamespace())

        self.assertEqual(raised.exception.status_code, 401)

    def test_location_admin_is_forbidden(self):
        with self.assertRaises(HTTPException) as raised:
            require_super_admin(SimpleNamespace(role="location_admin"))

        self.assertEqual(raised.exception.status_code, 403)

    def test_update_schema_rejects_invalid_or_extra_input(self):
        invalid_payloads = [
            {"name": "A", "slug": "valid"},
            {"name": "Valid", "slug": "Not Valid"},
            {"name": "Valid", "slug": "valid", "is_active": False},
        ]

        for payload in invalid_payloads:
            with self.subTest(payload=payload), self.assertRaises(ValidationError):
                AdminLocationUpdate(**payload)

    @patch.dict("os.environ", {"ADMIN_ALLOWED_ORIGINS": "http://localhost:3000"})
    def test_update_changes_only_name_and_slug(self):
        location = SimpleNamespace(
            id=1,
            name="Old Name",
            slug="old-name",
            is_active=True,
            publication_status="draft",
            unrelated="unchanged",
        )
        db = FakeDb(location)

        result = update_admin_location(
            location_id=1,
            payload=AdminLocationUpdate(name="New Name", slug="new-name"),
            request=request_with_origin(),
            current_admin=SimpleNamespace(role="super_admin"),
            db=db,
        )

        self.assertIs(result, location)
        self.assertEqual((location.name, location.slug), ("New Name", "new-name"))
        self.assertTrue(location.is_active)
        self.assertEqual(location.publication_status, "draft")
        self.assertEqual(location.unrelated, "unchanged")
        self.assertTrue(db.committed)
        self.assertTrue(db.refreshed)

    @patch.dict("os.environ", {"ADMIN_ALLOWED_ORIGINS": "http://localhost:3000"})
    def test_update_rejects_missing_and_published_locations(self):
        cases = [
            (None, 404),
            (SimpleNamespace(publication_status="published"), 409),
        ]

        for location, expected_status in cases:
            with self.subTest(expected_status=expected_status), self.assertRaises(
                HTTPException
            ) as raised:
                update_admin_location(
                    location_id=1,
                    payload=AdminLocationUpdate(name="Valid", slug="valid"),
                    request=request_with_origin(),
                    current_admin=SimpleNamespace(role="super_admin"),
                    db=FakeDb(location),
                )

            self.assertEqual(raised.exception.status_code, expected_status)

    @patch.dict("os.environ", {"ADMIN_ALLOWED_ORIGINS": "http://localhost:3000"})
    def test_duplicate_slug_returns_conflict_and_rolls_back(self):
        location = SimpleNamespace(publication_status="draft")
        db = FakeDb(
            location,
            IntegrityError("UPDATE locations", {}, Exception("duplicate")),
        )

        with self.assertRaises(HTTPException) as raised:
            update_admin_location(
                location_id=1,
                payload=AdminLocationUpdate(name="Valid", slug="duplicate"),
                request=request_with_origin(),
                current_admin=SimpleNamespace(role="super_admin"),
                db=db,
            )

        self.assertEqual(raised.exception.status_code, 409)
        self.assertTrue(db.rolled_back)


if __name__ == "__main__":
    unittest.main()
