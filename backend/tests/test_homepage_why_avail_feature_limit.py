import unittest

from pydantic import ValidationError

from app.schemas.homepage_why_avail import HomepageWhyAvailContent


def make_content(feature_count: int) -> dict:
    return {
        "heading": "Why Avail Aesthetics MD",
        "othersHeading": "Others",
        "consultationLabel": "Book Your Consultation",
        "features": [
            {
                "id": f"feature-{index}",
                "label": f"Feature {index}",
                "avail": index % 2 == 0,
                "others": None,
            }
            for index in range(feature_count)
        ],
    }


class HomepageWhyAvailFeatureLimitTests(unittest.TestCase):
    def test_one_three_and_five_features_are_accepted(self):
        for feature_count in (1, 3, 5):
            with self.subTest(feature_count=feature_count):
                content = HomepageWhyAvailContent.model_validate(
                    make_content(feature_count)
                )

                self.assertEqual(len(content.features), feature_count)
                self.assertIs(content.features[0].avail, True)
                self.assertIsNone(content.features[0].others)

    def test_zero_and_six_features_are_rejected(self):
        for feature_count in (0, 6):
            with self.subTest(feature_count=feature_count):
                with self.assertRaises(ValidationError):
                    HomepageWhyAvailContent.model_validate(
                        make_content(feature_count)
                    )


if __name__ == "__main__":
    unittest.main()
