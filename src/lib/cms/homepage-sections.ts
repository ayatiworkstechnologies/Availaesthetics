
/**
 * Avail Aesthetics MD
 * Global Homepage Section Registry
 *
 * Fixed, design-approved sections.
 * CMS can update content, but does not
 * rearrange the page layout.
 */

export const HOMEPAGE_SECTIONS = [
  {
    key: "hero",
    label: "Hero",
  },
  {
    key: "explore_categories",
    label: "Explore by Category",
  },
  {
    key: "signature_aesthetics",
    label: "Signature Aesthetics",
  },
  {
    key: "real_stories",
    label: "Real Stories",
  },
  {
    key: "why_avail",
    label: "Why Avail Aesthetics MD",
  },
  {
    key: "locations",
    label: "Our Locations",
  },
  {
    key: "faq",
    label: "Frequently Asked Questions",
  },
  {
    key: "features",
    label: "Features",
  },
] as const;

export type HomepageSectionKey =
  (typeof HOMEPAGE_SECTIONS)[number]["key"];
