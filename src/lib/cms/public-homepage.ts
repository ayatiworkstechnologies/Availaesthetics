import "server-only";

import type {
  HomepageHeroContent,
} from "./homepage-preview";

import type {
  HomepageLocation,
} from "./homepage-locations-preview";

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
// COMPLETE HOMEPAGE CMS DATA
// =====================================

export type PublicHomepageData = {
  hero: HomepageHeroContent | null;
  categories: HomepageCategoriesContent | null;
  signature: HomepageSignatureContent | null;
  testimonials: HomepageTestimonialsContent | null;
  whyAvail: HomepageWhyAvailContent | null;
  locations: PublishedHomepageLocations | null;
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
// SHARED CARD VALIDATION
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
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.heading === "string" &&
    data.heading.trim().length > 0 &&
    data.heading.length <= 200 &&
    isValidCardsArray(data.cards) &&
    (
      data.allTreatmentsHref === null ||
      typeof data.allTreatmentsHref === "string"
    )
  );
}

// =====================================
// SIGNATURE VALIDATION
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

  return (
    typeof data.heading === "string" &&
    data.heading.trim().length > 0 &&
    data.heading.length <= 200 &&
    isValidCardsArray(data.cards)
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
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.prototype.hasOwnProperty.call(
      value,
      "heading"
    )
  ) {
    return value;
  }

  return {
    ...(value as Record<string, unknown>),
    heading: defaultHeading,
  };
}

// =====================================
// TESTIMONIALS VALIDATION
// =====================================

function isValidTestimonials(
  value: unknown
): value is HomepageTestimonialsContent {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const data = value as Record<string, unknown>;

  if (
    typeof data.heading !== "string" ||
    !data.heading.trim() ||
    data.heading.length > 200 ||
    !Array.isArray(data.testimonials) ||
    data.testimonials.length > 30
  ) {
    return false;
  }

  const ids = new Set<string>();

  for (const item of data.testimonials) {
    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item)
    ) {
      return false;
    }

    const testimonial =
      item as Record<string, unknown>;

    if (
      typeof testimonial.id !== "string" ||
      !testimonial.id.trim() ||
      testimonial.id.length > 100 ||
      typeof testimonial.quote !== "string" ||
      !testimonial.quote.trim() ||
      testimonial.quote.length > 2000 ||
      typeof testimonial.author !== "string" ||
      !testimonial.author.trim() ||
      testimonial.author.length > 150
    ) {
      return false;
    }

    if (ids.has(testimonial.id)) {
      return false;
    }

    ids.add(testimonial.id);
  }

  return true;
}

// =====================================
// WHY AVAIL IMAGE VALIDATION
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
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    item.id.trim().length > 0 &&
    item.id.length <= 100 &&
    typeof item.label === "string" &&
    item.label.trim().length > 0 &&
    item.label.length <= 200 &&
    (
      item.avail === true ||
      item.avail === false ||
      item.avail === null
    ) &&
    (
      item.others === true ||
      item.others === false ||
      item.others === null
    )
  );
}

// =====================================
// WHY AVAIL CONTENT VALIDATION
// =====================================

function isValidWhyAvail(
  value: unknown
): value is HomepageWhyAvailContent {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const data = value as Record<string, unknown>;

  if (
    typeof data.heading !== "string" ||
    !data.heading.trim() ||
    data.heading.length > 200 ||

    !isValidWhyAvailImagePath(data.imageSrc) ||
    typeof data.imageAlt !== "string" ||
    data.imageAlt.length > 250 ||

    !isValidWhyAvailImagePath(data.logoSrc) ||
    typeof data.logoAlt !== "string" ||
    data.logoAlt.length > 250 ||

    typeof data.othersHeading !== "string" ||
    !data.othersHeading.trim() ||
    data.othersHeading.length > 100 ||

    typeof data.consultationLabel !== "string" ||
    !data.consultationLabel.trim() ||
    data.consultationLabel.length > 150 ||

    !Array.isArray(data.features) ||
    data.features.length < 1 ||
    data.features.length > 5
  ) {
    return false;
  }

  if (
    (
      data.imageSrc !== null &&
      !data.imageAlt.trim()
    ) ||
    (
      data.logoSrc !== null &&
      !data.logoAlt.trim()
    )
  ) {
    return false;
  }

  const ids = new Set<string>();

  for (const feature of data.features) {
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
// PUBLISHED HOMEPAGE LOCATION VALIDATION
// =====================================

type PublicHomepageLocationsResponse = {
  heading: string;
  description: string;
  defaultSelectedLocationId: string | null;
  locations: HomepageLocation[];
};

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function validGoogleMapsUrl(
  value: string,
  embedOnly = false
): string | null {
  if (!value) return null;

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
      (embedOnly &&
        (!isGoogleHost ||
          !url.pathname.startsWith("/maps/embed")))
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

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
    (value.phone === null || typeof value.phone === "string") &&
    (value.phoneHref === null ||
      (typeof value.phoneHref === "string" &&
        value.phoneHref.startsWith("tel:"))) &&
    typeof value.mapsUrl === "string" &&
    validGoogleMapsUrl(value.mapsUrl) !== null &&
    typeof value.mapEmbedUrl === "string" &&
    validGoogleMapsUrl(value.mapEmbedUrl, true) !== null
  );
}

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
        Boolean(value.defaultSelectedLocationId.trim())
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
      throw new Error("Duplicate published Homepage Location ID");
    }
    ids.add(location.id);
  }

  const preferred = response.defaultSelectedLocationId;

  return {
    heading: response.heading,
    description: response.description,
    locations: response.locations,
    defaultSelectedLocationId:
      preferred &&
      response.locations.some(
        (clinic) => clinic.id === preferred
      )
        ? preferred
        : (response.locations[0]?.id ?? null),
  };
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

  // A 404 means the section is
  // not published yet.
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
  ]);

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
    !isValidCategories(normalizedCategoriesData)
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
    !isValidSignature(normalizedSignatureData)
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
    !isValidTestimonials(testimonialsData)
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
    !isValidWhyAvail(whyAvailData)
  ) {
    throw new Error(
      "Invalid published Why Avail content"
    );
  }

  // ---------------------------------
  // RETURN COMPLETE HOMEPAGE
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
  };
}
