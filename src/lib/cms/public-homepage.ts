
import "server-only";

import type {
  HomepageHeroContent,
} from "./homepage-preview";

// =====================================
// PUBLIC HOMEPAGE DATA TYPES
// =====================================

export type PublicHomepageData = {
  hero: HomepageHeroContent | null;

  // Future published CMS sections:
  // categories
  // signatureTreatments
  // locations
  // testimonials
  // faqs
  // blogs
};

// =====================================
// HERO RESPONSE VALIDATION
// =====================================

function isValidHero(
  value: unknown
): value is HomepageHeroContent {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const data = value as Record<string, unknown>;

  const requiredFields = [
    "heading",
    "description",
    "imageSrc",
    "imageAlt",
    "consultationLabel",
    "eligibilityText",
  ];

  const hasRequiredFields = requiredFields.every(
    (field) =>
      typeof data[field] === "string" &&
      (data[field] as string).trim().length > 0
  );

  return (
    hasRequiredFields &&
    (
      data.mobileImageSrc == null ||
      typeof data.mobileImageSrc === "string"
    ) &&
    (
      data.consultationUrl == null ||
      typeof data.consultationUrl === "string"
    )
  );
}

// =====================================
// GET PUBLISHED HOMEPAGE CONTENT
// =====================================

export async function getPublicHomepageData():
  Promise<PublicHomepageData> {

  // 1. Read FastAPI URL from .env.local.
  const apiUrl = process.env.API_BASE_URL;

  if (!apiUrl) {
    throw new Error(
      "API_BASE_URL is not configured"
    );
  }

  // 2. Request published Hero content.
  const response = await fetch(
    `${apiUrl.replace(/\/+$/, "")}/api/v1/public/homepage/hero`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    }
  );

  // 3. Hero has not been published.
  if (response.status === 404) {
    return {
      hero: null,
    };
  }

  // 4. Handle backend errors.
  if (!response.ok) {
    throw new Error(
      `Homepage API failed: ${response.status}`
    );
  }

  // 5. Read and validate published content.
  const heroData: unknown = await response.json();

  if (!isValidHero(heroData)) {
    throw new Error(
      "Invalid published Homepage Hero data"
    );
  }

  // 6. Return published homepage data.
  return {
    hero: {
      ...heroData,
      mobileImageSrc:
        heroData.mobileImageSrc ?? undefined,
    },
  };
}
