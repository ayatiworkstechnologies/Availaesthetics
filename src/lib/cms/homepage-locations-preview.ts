
export type HomepageLocation = {
  id: string;
  name: string;
  regionLabel: string;

  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;

  phone: string | null;
  phoneHref: string | null;

  mapsUrl: string;
  mapEmbedUrl: string;
};

export const homepageLocations: HomepageLocation[] = [
  {
    id: "katy",
    name: "Katy",
    regionLabel: "West Houston · I-10 corridor",

    addressLine1: "23659 Katy Fwy",
    addressLine2: "Suite 400",
    city: "Katy",
    state: "TX",
    postalCode: "77494",
    country: "USA",

    phone: "(713) 590-0680",
    phoneHref: "tel:+17135900680",

    mapsUrl:
      "https://maps.app.goo.gl/VYmxwuzympMXoKDKA",

    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3462.7679154084176!2d-95.7816304!3d29.7843517!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x864126e5e1faaaab%3A0x5386ca7831204254!2s23659%20Katy%20Fwy%20Ste%20400%2C%20Katy%2C%20TX%2077494%2C%20USA!5e0!3m2!1sen!2sin!4v1795519823691!5m2!1sen!2sin",
  },

  {
    id: "cypress",
    name: "Cypress",
    regionLabel: "Northwest Houston · US-290",

    addressLine1: "9740 Barker Cypress Rd",
    addressLine2: "Suite 111",
    city: "Cypress",
    state: "TX",
    postalCode: "77433",
    country: "USA",

    phone: "(713) 590-0680",
    phoneHref: "tel:+17135900680",

    mapsUrl:
      "https://maps.app.goo.gl/tbu784CqLPRdA9Fj6",

    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3458.0860361595287!2d-95.6855133!3d29.919425200000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8640d6f51ec46e89%3A0xcb3d6e27e58f8c93!2s9740%20Barker%20Cypress%20Rd%20Ste%20111%2C%20Cypress%2C%20TX%2077433%2C%20USA!5e0!3m2!1sen!2sin!4v1795519804177!5m2!1sen!2sin",
  },
];

export function getLocationMapQuery(
  location: HomepageLocation
): string {
  return [
    location.addressLine1,
    location.addressLine2,
    location.city,
    location.state,
    location.postalCode,
    location.country,
  ]
    .filter(Boolean)
    .join(", ");
}
