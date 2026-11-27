
import "server-only";

import type {
  HomepageHeroContent,
} from "./homepage-preview";

import type {
  HomepageLocation,
} from "./homepage-locations-preview";

import type {
  HomepageFaq,
} from "./homepage-faq-preview";

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
  heading: string;
  cards: HomepageCategoryCard[];
  allTreatmentsHref: string | null;
};

// =====================================
// PUBLIC SIGNATURE TYPES
// =====================================

export type HomepageSignatureCard = {
  id: string;
  title: string;
  imageSrc: string | null;
  imageAlt: string;
  href: string | null;
};

export type HomepageSignatureContent = {
  heading: string;
  cards: HomepageSignatureCard[];
};

// =====================================
// PUBLIC TESTIMONIALS TYPES
// =====================================

export type HomepageTestimonialItem = {
  id: string;
  quote: string;
  author: string;
};

export type HomepageTestimonialsContent = {
  heading: string;
  testimonials: HomepageTestimonialItem[];
};

// =====================================
// PUBLIC WHY AVAIL TYPES
// =====================================

export type HomepageWhyAvailFeature = {
  id: string;
  label: string;
  avail: boolean | null;
  others: boolean | null;
};

export type HomepageWhyAvailContent = {
  heading: string;
  imageSrc: string | null;
  imageAlt: string;
  logoSrc: string | null;
  logoAlt: string;
  othersHeading: string;
  consultationLabel: string;
  features: HomepageWhyAvailFeature[];
};

// =====================================
// PUBLIC LOCATIONS TYPE
// =====================================

export type PublishedHomepageLocations = {
  heading: string;
  description: string;
  locations: HomepageLocation[];
  defaultSelectedLocationId: string | null;
};

// =====================================
// PUBLIC FAQ TYPE
// =====================================

export type HomepageFaqContent = {
  heading: string;
  faqs: HomepageFaq[];
};

// =====================================
// COMPLETE HOMEPAGE CMS DATA
// =====================================

export type PublicHomepageData = {
  hero: HomepageHeroContent | null;
  categories: HomepageCategoriesContent | null;
  signature: HomepageSignatureContent | null;
  testimonials: HomepageTestimonialsContent | null;
  whyAvail: HomepageWhyAvailContent | null;
  locations: PublishedHomepageLocations | null;
  faq: HomepageFaqContent | null;
};

// =====================================
// SHARED RECORD VALIDATION
// =====================================

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

// =====================================
// HERO VALIDATION
// =====================================

function isValidHero(
  value: unknown
): value is HomepageHeroContent {
  if (!isRecord(value)) {
    return false;
  }

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
        typeof value[field] === "string" &&
        (value[field] as string).trim().length > 0
    ) &&
    (
      value.mobileImageSrc == null ||
      typeof value.mobileImageSrc === "string"
    ) &&
    (
      value.consultationUrl == null ||
      typeof value.consultationUrl === "string"
    )
  );
}

// =====================================
// SHARED CARD VALIDATION
// =====================================

function isValidImageCard(
  value: unknown
): value is HomepageCategoryCard {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    typeof value.title === "string" &&
    value.title.trim().length > 0 &&
    typeof value.imageAlt === "string" &&
    (
      value.imageSrc === null ||
      typeof value.imageSrc === "string"
    ) &&
    (
      value.href === null ||
      typeof value.href === "string"
    )
  );
}

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

  for (const item of value) {
    if (!isValidImageCard(item)) {
      return false;
    }

    if (ids.has(item.id)) {
      return false;
    }

    if (item.imageSrc && !item.imageAlt.trim()) {
      return false;
    }

    ids.add(item.id);
  }

  return true;
}

// =====================================
// CATEGORIES VALIDATION
// =====================================

function isValidCategories(
  value: unknown
): value is HomepageCategoriesContent {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.heading === "string" &&
    value.heading.trim().length > 0 &&
    value.heading.length <= 200 &&
    isValidCardsArray(value.cards) &&
    (
      value.allTreatmentsHref === null ||
      typeof value.allTreatmentsHref === "string"
    )
  );
}

// =====================================
// SIGNATURE VALIDATION
// =====================================

function isValidSignature(
  value: unknown
): value is HomepageSignatureContent {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.heading === "string" &&
    value.heading.trim().length > 0 &&
    value.heading.length <= 200 &&
    isValidCardsArray(value.cards)
  );
}

// =====================================
// LEGACY HEADING SUPPORT
// =====================================

function withLegacyHeading(
  value: unknown,
  defaultHeading: string
): unknown {
  if (
    !isRecord(value) ||
    Object.prototype.hasOwnProperty.call(
      value,
      "heading"
    )
  ) {
    return value;
  }

  return {
    ...value,
    heading: defaultHeading,
  };
}

// =====================================
// TESTIMONIALS VALIDATION
// =====================================

function isValidTestimonials(
  value: unknown
): value is HomepageTestimonialsContent {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.heading !== "string" ||
    !value.heading.trim() ||
    value.heading.length > 200 ||
    !Array.isArray(value.testimonials) ||
    value.testimonials.length > 30
  ) {
    return false;
  }

  const ids = new Set<string>();

  for (const item of value.testimonials) {
    if (!isRecord(item)) {
      return false;
    }

    if (
      typeof item.id !== "string" ||
      !item.id.trim() ||
      item.id.length > 100 ||
      typeof item.quote !== "string" ||
      !item.quote.trim() ||
      item.quote.length > 2000 ||
      typeof item.author !== "string" ||
      !item.author.trim() ||
      item.author.length > 150
    ) {
      return false;
    }

    if (ids.has(item.id)) {
      return false;
    }

    ids.add(item.id);
  }

  return true;
}

// =====================================
// WHY AVAIL IMAGE PATH VALIDATION
// =====================================

function isValidWhyAvailImagePath(
  value: unknown
): value is string | null {
  if (value === null) {
    return true;
  }

  if (
    typeof value !== "string" ||
    value.length > 500 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[%?#\\\s\u0000-\u001F\u007F]/.test(value)
  ) {
    return false;
  }

  return !value.split("/").some(
    (segment) =>
      segment === "." || segment === ".."
  );
}

// =====================================
// WHY AVAIL FEATURE VALIDATION
// =====================================

function isValidWhyAvailFeature(
  value: unknown
): value is HomepageWhyAvailFeature {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    value.id.length <= 100 &&
    typeof value.label === "string" &&
    value.label.trim().length > 0 &&
    value.label.length <= 200 &&
    (
      value.avail === true ||
      value.avail === false ||
      value.avail === null
    ) &&
    (
      value.others === true ||
      value.others === false ||
      value.others === null
    )
  );
}

// =====================================
// WHY AVAIL CONTENT VALIDATION
// =====================================

function isValidWhyAvail(
  value: unknown
): value is HomepageWhyAvailContent {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.heading !== "string" ||
    !value.heading.trim() ||
    value.heading.length > 200 ||

    !isValidWhyAvailImagePath(value.imageSrc) ||
    typeof value.imageAlt !== "string" ||
    value.imageAlt.length > 250 ||

    !isValidWhyAvailImagePath(value.logoSrc) ||
    typeof value.logoAlt !== "string" ||
    value.logoAlt.length > 250 ||

    typeof value.othersHeading !== "string" ||
    !value.othersHeading.trim() ||
    value.othersHeading.length > 100 ||

    typeof value.consultationLabel !== "string" ||
    !value.consultationLabel.trim() ||
    value.consultationLabel.length > 150 ||

    !Array.isArray(value.features) ||
    value.features.length < 1 ||
    value.features.length > 5
  ) {
    return false;
  }

  if (
    (
      value.imageSrc !== null &&
      !value.imageAlt.trim()
    ) ||
    (
      value.logoSrc !== null &&
      !value.logoAlt.trim()
    )
  ) {
    return false;
  }

  const ids = new Set<string>();

  for (const feature of value.features) {
    if (!isValidWhyAvailFeature(feature)) {
      return false;
    }

    if (ids.has(feature.id)) {
      return false;
    }

    ids.add(feature.id);
  }

  return true;
}

// =====================================
// GOOGLE MAPS URL VALIDATION
// =====================================

function validGoogleMapsUrl(
  value: string,
  embedOnly = false
): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    const isGoogleHost =
      hostname === "google.com" ||
      hostname.endsWith(".google.com");

    const isMapsShortLink =
      hostname === "maps.app.goo.gl";

    if (
      url.protocol !== "https:" ||
      (!isGoogleHost && !isMapsShortLink) ||
      (
        embedOnly &&
        (
          !isGoogleHost ||
          !url.pathname.startsWith("/maps/embed")
        )
      )
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

// =====================================
// HOMEPAGE LOCATION VALIDATION
// =====================================

function isHomepageLocation(
  value: unknown
): value is HomepageLocation {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    Boolean(value.id.trim()) &&
    typeof value.name === "string" &&
    Boolean(value.name.trim()) &&
    typeof value.regionLabel === "string" &&
    typeof value.addressLine1 === "string" &&
    Boolean(value.addressLine1.trim()) &&
    typeof value.addressLine2 === "string" &&
    typeof value.city === "string" &&
    Boolean(value.city.trim()) &&
    typeof value.state === "string" &&
    Boolean(value.state.trim()) &&
    typeof value.postalCode === "string" &&
    typeof value.country === "string" &&
    Boolean(value.country.trim()) &&
    (
      value.phone === null ||
      typeof value.phone === "string"
    ) &&
    (
      value.phoneHref === null ||
      (
        typeof value.phoneHref === "string" &&
        value.phoneHref.startsWith("tel:")
      )
    ) &&
    typeof value.mapsUrl === "string" &&
    validGoogleMapsUrl(value.mapsUrl) !== null &&
    typeof value.mapEmbedUrl === "string" &&
    validGoogleMapsUrl(
      value.mapEmbedUrl,
      true
    ) !== null
  );
}

// =====================================
// PUBLISHED LOCATIONS RESPONSE
// =====================================

type PublicHomepageLocationsResponse = {
  heading: string;
  description: string;
  defaultSelectedLocationId: string | null;
  locations: HomepageLocation[];
};

// =====================================
// VALIDATE PUBLISHED LOCATIONS RESPONSE
// =====================================

function normalizePublishedLocations(
  value: unknown
): PublishedHomepageLocations | null {
  if (value === null) {
    return null;
  }

  if (
    !isRecord(value) ||
    typeof value.heading !== "string" ||
    !value.heading.trim() ||
    typeof value.description !== "string" ||
    !value.description.trim() ||
    !Array.isArray(value.locations) ||
    value.locations.length > 100 ||
    !value.locations.every(isHomepageLocation) ||
    !(
      value.defaultSelectedLocationId === null ||
      (
        typeof value.defaultSelectedLocationId === "string" &&
        Boolean(
          value.defaultSelectedLocationId.trim()
        )
      )
    )
  ) {
    throw new Error(
      "Invalid published Homepage Locations response"
    );
  }

  const response =
    value as unknown as PublicHomepageLocationsResponse;

  const ids = new Set<string>();

  for (const location of response.locations) {
    if (ids.has(location.id)) {
      throw new Error(
        "Duplicate published Homepage Location ID"
      );
    }

    ids.add(location.id);
  }

  const preferred =
    response.defaultSelectedLocationId;

  return {
    heading: response.heading,
    description: response.description,
    locations: response.locations,
    defaultSelectedLocationId:
      preferred &&
      response.locations.some(
        (location) => location.id === preferred
      )
        ? preferred
        : (response.locations[0]?.id ?? null),
  };
}

// =====================================
// FAQ ITEM VALIDATION
// =====================================

function isValidFaqItem(
  value: unknown
): value is HomepageFaq {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.length >= 1 &&
    value.id.length <= 100 &&
    /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(
      value.id
    ) &&

    typeof value.question === "string" &&
    value.question.trim().length >= 1 &&
    value.question.length <= 500 &&

    (
      value.answer === null ||
      (
        typeof value.answer === "string" &&
        value.answer.length <= 5000
      )
    )
  );
}

// =====================================
// FAQ CONTENT VALIDATION
// =====================================

function isValidFaqContent(
  value: unknown
): value is HomepageFaqContent {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.heading !== "string" ||
    !value.heading.trim() ||
    value.heading.length > 200 ||
    !Array.isArray(value.faqs) ||
    value.faqs.length < 1 ||
    value.faqs.length > 30
  ) {
    return false;
  }

  const ids = new Set<string>();

  for (const faq of value.faqs) {
    if (!isValidFaqItem(faq)) {
      return false;
    }

    if (ids.has(faq.id)) {
      return false;
    }

    ids.add(faq.id);
  }

  return true;
}

// =====================================
// SHARED PUBLISHED CONTENT FETCH
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

  // 404 means the section has
  // not been published yet.
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Public CMS request failed: ${path} (HTTP ${response.status})`
    );
  }

  return response.json();
}

// =====================================
// GET COMPLETE PUBLISHED HOMEPAGE DATA
// =====================================

export async function getPublicHomepageData():
  Promise<PublicHomepageData> {
  const [
    heroData,
    categoriesData,
    signatureData,
    testimonialsData,
    whyAvailData,
    locationsData,
    faqData,
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
    fetchPublishedContent(
      "/api/v1/public/homepage/testimonials"
    ),
    fetchPublishedContent(
      "/api/v1/public/homepage/why-avail"
    ),
    fetchPublishedContent(
      "/api/v1/public/homepage/locations"
    ),
    fetchPublishedContent(
      "/api/v1/public/homepage/faq"
    ),
  ]);

  // ---------------------------------
  // NORMALIZE LEGACY SECTION HEADINGS
  // ---------------------------------

  const normalizedCategoriesData =
    withLegacyHeading(
      categoriesData,
      "Explore by Category"
    );

  const normalizedSignatureData =
    withLegacyHeading(
      signatureData,
      "Signature Aesthetics"
    );

  // ---------------------------------
  // VALIDATE HERO
  // ---------------------------------

  if (
    heroData !== null &&
    !isValidHero(heroData)
  ) {
    throw new Error(
      "Invalid published Hero content"
    );
  }

  // ---------------------------------
  // VALIDATE CATEGORIES
  // ---------------------------------

  if (
    normalizedCategoriesData !== null &&
    !isValidCategories(
      normalizedCategoriesData
    )
  ) {
    throw new Error(
      "Invalid published Categories content"
    );
  }

  // ---------------------------------
  // VALIDATE SIGNATURE
  // ---------------------------------

  if (
    normalizedSignatureData !== null &&
    !isValidSignature(
      normalizedSignatureData
    )
  ) {
    throw new Error(
      "Invalid published Signature content"
    );
  }

  // ---------------------------------
  // VALIDATE TESTIMONIALS
  // ---------------------------------

  if (
    testimonialsData !== null &&
    !isValidTestimonials(
      testimonialsData
    )
  ) {
    throw new Error(
      "Invalid published Testimonials content"
    );
  }

  // ---------------------------------
  // VALIDATE WHY AVAIL
  // ---------------------------------

  if (
    whyAvailData !== null &&
    !isValidWhyAvail(
      whyAvailData
    )
  ) {
    throw new Error(
      "Invalid published Why Avail content"
    );
  }

  // ---------------------------------
  // VALIDATE FAQ
  // ---------------------------------

  if (
    faqData !== null &&
    !isValidFaqContent(faqData)
  ) {
    throw new Error(
      "Invalid published Homepage FAQ content"
    );
  }

  // ---------------------------------
  // RETURN ALL HOMEPAGE CMS SECTIONS
  // ---------------------------------

  return {
    hero: heroData,
    categories: normalizedCategoriesData,
    signature: normalizedSignatureData,
    testimonials: testimonialsData,
    whyAvail: whyAvailData,
    locations: normalizePublishedLocations(
      locationsData
    ),
    faq: faqData,
  };
}
