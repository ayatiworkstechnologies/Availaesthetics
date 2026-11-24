
export type HomepageImageCard = {
  id: string;
  title: string;
  imageSrc: string;
  imageAlt: string;
  href: string | null;
};

// --------------------------------------
// Explore by Category
// --------------------------------------

export const categoryCards: HomepageImageCard[] = [
  {
    id: "face",
    title: "FACE",
    imageSrc: "/avail/home/categories/face.png",
    imageAlt: "Face aesthetic treatments",
    href: null,
  },
  {
    id: "body",
    title: "BODY",
    imageSrc: "/avail/home/categories/body.png",
    imageAlt: "Body aesthetic treatments",
    href: null,
  },
  {
    id: "injectables",
    title: "INJECTABLES",
    imageSrc: "/avail/home/categories/injectables.png",
    imageAlt: "Injectable aesthetic treatments",
    href: null,
  },
  {
    id: "skin-rejuvenation",
    title: "SKIN REJUVENATION",
    imageSrc: "/avail/home/categories/skin-rejuvenation.png",
    imageAlt: "Skin rejuvenation treatments",
    href: null,
  },
];

// --------------------------------------
// Signature Aesthetics
// --------------------------------------

export const signatureCards: HomepageImageCard[] = [
  {
    id: "vitamin-injections",
    title: "Vitamin Injections",
    imageSrc: "/avail/home/signature/vitamin-injections.png",
    imageAlt: "Vitamin injection treatment",
    href: null,
  },
  {
    id: "medical-weight-loss",
    title: "Medical Weight Loss",
    imageSrc: "/avail/home/signature/medical-weight-loss.png",
    imageAlt: "Medical weight loss service",
    href: null,
  },
  {
    id: "hair-rejuvenation",
    title: "Hair Rejuvenation",
    imageSrc: "/avail/home/signature/hair-rejuvenation.png",
    imageAlt: "Hair rejuvenation treatment",
    href: null,
  },
  {
    id: "laser-hair-removal",
    title: "Laser Hair Removal",
    imageSrc: "/avail/home/signature/laser-hair-removal.png",
    imageAlt: "Laser hair removal treatment",
    href: null,
  },
];

// Will be connected to the public treatment listing.
export const allTreatmentsHref: string | null = null;
