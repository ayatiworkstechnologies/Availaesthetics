
import "server-only";

import type {
  HomepageHeroContent,
} from "./homepage-preview";

// =====================================
// PUBLIC CATEGORY TYPES
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

export type PublicHomepageData = {
  hero: HomepageHeroContent | null;
  categories: HomepageCategoriesContent | null;
};

// =====================================
// HERO VALIDATION
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

  return (
    requiredFields.every(
      (field) =>
        typeof data[field] === "string" &&
        (data[field] as string).trim().length > 0
    ) &&
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
// CATEGORIES VALIDATION
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

  if (!Array.isArray(data.cards)) {
    return false;
  }

  if (
    data.allTreatmentsHref !== null &&
    typeof data.allTreatmentsHref !== "string"
  ) {
    return false;
  }

  const ids = new Set<string>();

  for (const item of data.cards) {
    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item)
    ) {
      return false;
    }

    const card = item as Record<string, unknown>;

    if (
      typeof card.id !== "string" ||
      !card.id.trim() ||
      typeof card.title !== "string" ||
      !card.title.trim() ||
      typeof card.imageAlt !== "string" ||
      !(
        card.imageSrc === null ||
        typeof card.imageSrc === "string"
      ) ||
      !(
        card.href === null ||
        typeof card.href === "string"
      )
    ) {
      return false;
    }

    if (ids.has(card.id)) {
      return false;
    }

    ids.add(card.id);
  }

  return true;
}

// =====================================
// SHARED PUBLISHED API FETCH
// =====================================

async function fetchPublishedContent(
  path: string
): Promise<unknown | null> {
  const apiUrl = process.env.API_BASE_URL;

  if (!apiUrl) {
    throw new Error("API_BASE_URL is not configured");
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

  // Not yet published.
  if (response.status === 404) {
    return null;
  }

  // Backend failures must not be mistaken
  // for unpublished content.
  if (!response.ok) {
    throw new Error(
      `Public CMS request failed: ${path} (${response.status})`
    );
  }

  return response.json();
}

// =====================================
// GET PUBLISHED HOMEPAGE DATA
// =====================================

export async function getPublicHomepageData():
  Promise<PublicHomepageData> {

  const [heroData, categoriesData] = await Promise.all([
    fetchPublishedContent(
      "/api/v1/public/homepage/hero"
    ),
    fetchPublishedContent(
      "/api/v1/public/homepage/categories"
    ),
  ]);

  if (heroData !== null && !isValidHero(heroData)) {
    throw new Error("Invalid published Hero content");
  }

  if (
    categoriesData !== null &&
    !isValidCategories(categoriesData)
  ) {
    throw new Error("Invalid published Categories content");
  }

  return {
    hero: heroData,
    categories: categoriesData,
  };
}
