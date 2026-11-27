import unittest

from pydantic import ValidationError

from app.schemas.homepage_categories import HomepageCategoriesContent
from app.schemas.homepage_signature import HomepageSignatureContent


class HomepageSectionHeadingSchemaTests(unittest.TestCase):
    content_types = (
        (HomepageCategoriesContent, "Explore by Category"),
        (HomepageSignatureContent, "Signature Aesthetics"),
    )

    def test_legacy_content_uses_default_heading(self):
        for content_type, default_heading in self.content_types:
            with self.subTest(content_type=content_type.__name__):
                content = content_type.model_validate({"cards": []})

                self.assertEqual(content.heading, default_heading)

    def test_custom_heading_is_preserved_and_trimmed(self):
        for content_type, _ in self.content_types:
            with self.subTest(content_type=content_type.__name__):
                content = content_type.model_validate(
                    {"heading": "  Custom Section  ", "cards": []}
                )

                self.assertEqual(content.heading, "Custom Section")

    def test_invalid_heading_is_rejected(self):
        for content_type, _ in self.content_types:
            for heading in ("", "   ", "x" * 201):
                with self.subTest(
                    content_type=content_type.__name__,
                    heading=heading,
                ):
                    with self.assertRaises(ValidationError):
                        content_type.model_validate(
                            {"heading": heading, "cards": []}
                        )


if __name__ == "__main__":
    unittest.main()
