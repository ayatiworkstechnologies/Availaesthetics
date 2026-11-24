
export type FooterLink = {
  label: string;
  href: string | null;
};

export type FooterGroup = {
  title: string;
  links: FooterLink[];
};

export type FooterSocialLink = {
  platform: "facebook" | "instagram";
  href: string | null;
};

// --------------------------------------
// FOOTER BRAND
// --------------------------------------

export const footerBrandDescription =
  "Physician developed concierge aesthetics and wellness with long-term health and vitality.";

// --------------------------------------
// LOCATIONS
// --------------------------------------

// Links will eventually come from the
// published clinic locations API.
// Corpus Christi is shown in the approved
// footer design but its page is not yet linked.

export const footerLocationLinks: FooterLink[] = [
  {
    label: "Katy",
    href: "#our-locations",
  },
  {
    label: "Cypress",
    href: "#our-locations",
  },
  {
    label: "Corpus Christi",
    href: null,
  },
];

// --------------------------------------
// FOOTER NAVIGATION
// --------------------------------------

export const footerGroups: FooterGroup[] = [
  {
    title: "COMPANY",
    links: [
      {
        label: "About Us",
        href: null,
      },
      {
        label: "Contact Us",
        href: null,
      },
      {
        label: "Staff Login",
        href: "/admin/login",
      },
    ],
  },
  {
    title: "FIND",
    links: [
      {
        label: "Aesthetics",
        href: "#explore-categories",
      },
      {
        label: "Wellness",
        href: null,
      },
      {
        label: "Concerns",
        href: null,
      },
      {
        label: "Membership",
        href: null,
      },
      {
        label: "Aesthetic Insights",
        href: null,
      },
      {
        label: "Blogs",
        href: "#blogs",
      },
    ],
  },
  {
    title: "OTHER INFORMATION",
    links: [
      {
        label: "Help Us Enhance Your Experience",
        href: null,
      },
      {
        label: "View our COVID-19 safety measures",
        href: null,
      },
      {
        label: "Privacy Policy",
        href: null,
      },
      {
        label: "Shipping Policy",
        href: null,
      },
    ],
  },
];

// --------------------------------------
// SOCIAL MEDIA
// --------------------------------------

export const footerSocialLinks: FooterSocialLink[] = [
  {
    platform: "facebook",
    href: null,
  },
  {
    platform: "instagram",
    href: null,
  },
];
