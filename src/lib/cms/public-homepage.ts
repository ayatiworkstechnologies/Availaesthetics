
import "server-only";

import type {
  HomepageHeroContent,
} from "./homepage-preview";

// =====================================
// 1. PUBLIC CATEGORY TYPES
// =====================================

export type HomepageCategoryCard = {
  id: string;
  title: string;
  imageSrc: string | null;
  imageAlt: string;
  href: string | null;
};

export type HomepageCategoriesContent = {
  cards: HomepageCategoryCard[];
  allTreatmentsHref: string | null;
};

// =====================================
// 2. PUBLIC SIGNATURE TYPES
// =====================================

export type HomepageSignatureCard = {
  id: string;
  title: string;
  imageSrc: string | null;
  imageAlt: string;
  href: string | null;
};

export type HomepageSignatureContent = {
  cards: HomepageSignatureCard[];
};

// =====================================
// 3. COMPLETE HOMEPAGE DATA TYPE
// =====================================

export type PublicHomepageData = {
  hero: HomepageHeroContent | null;
  categories: HomepageCategoriesContent | null;
  signature: HomepageSignatureContent | null;
};

// =====================================
// 4. HERO VALIDATION
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

  const validRequiredFields = requiredFields.every(
    (field) =>
      typeof data[field] === "string" &&
      (data[field] as string).trim().length > 0
  );

  const validMobileImage =
    data.mobileImageSrc == null ||
    typeof data.mobileImageSrc === "string";

  const validConsultationUrl =
    data.consultationUrl == null ||
    typeof data.consultationUrl === "string";

  return (
    validRequiredFields &&
    validMobileImage &&
    validConsultationUrl
  );
}

// =====================================
// 5. SHARED IMAGE CARD VALIDATION
// =====================================

function isValidImageCard(
  value: unknown
): value is HomepageCategoryCard {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const card = value as Record<string, unknown>;

  return (
    typeof card.id === "string" &&
    card.id.trim().length > 0 &&
    typeof card.title === "string" &&
    card.title.trim().length > 0 &&
    typeof card.imageAlt === "string" &&
    (
      card.imageSrc === null ||
      typeof card.imageSrc === "string"
    ) &&
    (
      card.href === null ||
      typeof card.href === "string"
    )
  );
}

// =====================================
// 6. SHARED CARD ARRAY VALIDATION
// =====================================

function isValidCardsArray(
  value: unknown
): value is HomepageCategoryCard[] {
  if (
    !Array.isArray(value) ||
    value.length > 20
  ) {
    return false;
  }

  const ids = new Set<string>();

  for (const card of value) {
    if (!isValidImageCard(card)) {
      return false;
    }

    // Prevent duplicate IDs.
    if (ids.has(card.id)) {
      return false;
    }

    // Image alt text is required when
    // an image is configured.
    if (
      card.imageSrc &&
      !card.imageAlt.trim()
    ) {
      return false;
    }

    ids.add(card.id);
  }

  return true;
}

// =====================================
// 7. CATEGORIES VALIDATION
// =====================================

function isValidCategories(
  value: unknown
): value is HomepageCategoriesContent {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    isValidCardsArray(data.cards) &&
    (
      data.allTreatmentsHref === null ||
      typeof data.allTreatmentsHref === "string"
    )
  );
}

// =====================================
// 8. SIGNATURE VALIDATION
// =====================================

function isValidSignature(
  value: unknown
): value is HomepageSignatureContent {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return isValidCardsArray(data.cards);
}

// =====================================
// 9. SHARED PUBLISHED API FETCH
// =====================================

async function fetchPublishedContent(
  path: string
): Promise<unknown | null> {
  const apiUrl = process.env.API_BASE_URL;

  if (!apiUrl) {
    throw new Error(
      "API_BASE_URL is not configured"
    );
  }

  const response = await fetch(
    `${apiUrl.replace(/\/+$/, "")}${path}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    }
  );

  // The section has not been published.
  // Do not display draft or preview data.
  if (response.status === 404) {
    return null;
  }

  // Backend errors must remain visible.
  if (!response.ok) {
    throw new Error(
      `Public CMS request failed: ${path} (HTTP ${response.status})`
    );
  }

  return response.json();
}

// =====================================
// 10. GET COMPLETE PUBLISHED HOMEPAGE
// =====================================

export async function getPublicHomepageData():
  Promise<PublicHomepageData> {

  // Fetch all published CMS sections
  // concurrently for better performance.
  const [
    heroData,
    categoriesData,
    signatureData,
  ] = await Promise.all([
    fetchPublishedContent(
      "/api/v1/public/homepage/hero"
    ),
    fetchPublishedContent(
      "/api/v1/public/homepage/categories"
    ),
    fetchPublishedContent(
      "/api/v1/public/homepage/signature"
    ),
  ]);

  // ---------------------------------
  // Validate Homepage Hero
  // ---------------------------------

  if (
    heroData !== null &&
    !isValidHero(heroData)
  ) {
    throw new Error(
      "Invalid published Homepage Hero content"
    );
  }

  // ---------------------------------
  // Validate Explore by Category
  // ---------------------------------

  if (
    categoriesData !== null &&
    !isValidCategories(categoriesData)
  ) {
    throw new Error(
      "Invalid published Categories content"
    );
  }

  // ---------------------------------
  // Validate Signature Aesthetics
  // ---------------------------------

  if (
    signatureData !== null &&
    !isValidSignature(signatureData)
  ) {
    throw new Error(
      "Invalid published Signature Aesthetics content"
    );
  }

  // ---------------------------------
  // Return published content only
  // ---------------------------------

  return {
    hero: heroData,
    categories: categoriesData,
    signature: signatureData,
  };
}
