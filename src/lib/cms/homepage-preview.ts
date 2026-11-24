
export type HomepageHeroContent = {
  heading: string;
  description: string;

  // Desktop / laptop banner
  imageSrc: string;

  // Separate mobile banner
  mobileImageSrc?: string;

  imageAlt: string;

  consultationUrl?: string | null;
  consultationLabel: string;
  eligibilityText: string;
};

export type TreatmentMenuCategory = {
  label: string;
  treatments: string[];
};

export const homepageHero: HomepageHeroContent = {
  heading: "CONFIDENCE,\nREIMAGINED",

  description:
    "Our treatments focus on advanced aesthetics, and rejuvenating therapies to make you look effortlessly radiant.",

  // Desktop banner
  imageSrc: "/avail/home/hero.png",

  // Mobile banner
  mobileImageSrc: "/avail/home/hero-mobile.png",

  imageAlt: "Avail Aesthetics MD homepage banner",

  consultationUrl: null,

  consultationLabel: "Free Consultation",

  eligibilityText: "HSA/FSA Eligible",
};

export const clinicNames = [
  "Katy",
  "Cypress",
  "Corpus Christi",
];

export const aestheticsMenu: TreatmentMenuCategory[] = [
  {
    label: "SKIN REJUVENATION",
    treatments: [
      "RF Microneedling",
      "Skin Rejuvenation",
      "Aquafacial",
      "XERF",
      "Exosome Therapy",
      "Skin Tightening",
    ],
  },
  {
    label: "LASER TREATMENTS",
    treatments: [
      "Thulium",
      "MICROFOCUS-RF",
      "Laser Hair Removal",
    ],
  },
  {
    label: "BODY CONTOURING",
    treatments: [
      "Non Surgical Body Contouring",
      "Medical Weight Loss",
    ],
  },
  {
    label: "HAIR RESTORATION",
    treatments: [
      "Hair Rejuvenation",
    ],
  },
  {
    label: "INJECTABLES",
    treatments: [
      "Botox®",
      "Dermal Fillers",
      "Sculptra",
      "Radiesse",
      "Kybella Fat Dissolving Injections",
      "PRP Therapy",
    ],
  },
];
