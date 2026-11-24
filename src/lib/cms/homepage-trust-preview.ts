
export type HomepageTestimonial = {
  id: string;
  quote: string | null;
  author: string | null;
};

export type ComparisonFeature = {
  id: string;
  label: string;
  avail: boolean | null;
  others: boolean | null;
};

// Preview content based on the supplied design.
// Verify testimonial authenticity and approval
// before deploying the public website.
export const homepageTestimonials: HomepageTestimonial[] = [
  {
    id: "testimonial-1",
    quote:
      "From the moment I walked into Avail Aesthetics MD, I felt completely at ease. The team took the time to understand my concerns and created a treatment plan that suited my goals. The results exceeded my expectations, and I couldn't be happier.",
    author: "Emily R.",
  },
  {
    id: "testimonial-2",
    quote:
      "I've visited several aesthetic clinics over the years, and the level of care at Avail Aesthetics MD is exceptional. Everyone is welcoming, knowledgeable, and genuinely focused on helping you achieve natural-looking results.",
    author: "Michael T.",
  },
  {
    id: "testimonial-3",
    quote:
      "I appreciated how honest and informative my consultation was. There was never any pressure—just expert advice and a personalised treatment plan. My skin has never looked healthier, and I've received so many compliments.",
    author: "Sophia L.",
  },
];

// Claims shown in the approved design.
// Verify them before public launch.
// For "others", null means not verified.
export const whyAvailFeatures: ComparisonFeature[] = [
  {
    id: "consultation",
    label: "Complimentary Consultation",
    avail: true,
    others: null,
  },
  {
    id: "pricing",
    label: "Transparent Pricing",
    avail: true,
    others: null,
  },
  {
    id: "membership",
    label: "Membership & Packages",
    avail: true,
    others: null,
  },
  {
    id: "staff",
    label: "Experienced Staff",
    avail: true,
    others: null,
  },
  {
    id: "aftercare",
    label: "Aftercare Support",
    avail: true,
    others: null,
  },
];

// Set to the approved photo after placing
// that image in your public folder.
export const whyAvailArtworkSrc: string | null =
  "/avail/home/why-avail-profile.png";
