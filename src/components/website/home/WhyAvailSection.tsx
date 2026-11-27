
import Image from "next/image";

import type {
  HomepageWhyAvailContent,
} from "@/lib/cms/public-homepage";

import {
  whyAvailArtworkSrc,
  whyAvailFeatures,
} from "@/lib/cms/homepage-trust-preview";

import {
  homepageHero,
} from "@/lib/cms/homepage-preview";

// -----------------------------------
// COMPONENT PROPS
// -----------------------------------

type WhyAvailSectionProps = {
  content?: HomepageWhyAvailContent;
  consultationUrl?: string | null;
};

// -----------------------------------
// SVG Icons
// -----------------------------------

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.6 2.6 5.4-5.4" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6m0-6-6 6" />
    </svg>
  );
}

// -----------------------------------
// Comparison Cell Status
// -----------------------------------

function FeatureStatus({
  value,
  featureLabel,
}: {
  value: boolean | null;
  featureLabel: string;
}) {
  if (value === null) {
    return (
      <span
        role="img"
        aria-label={`${featureLabel}: Not verified`}
        title="Not verified"
        className="text-lg text-[#8293A4]"
      >
        —
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={`${featureLabel}: ${
        value ? "Available" : "Not available"
      }`}
      className={
        value
          ? "text-[#0B253B]"
          : "text-[#85909A]"
      }
    >
      {value ? <CheckIcon /> : <CrossIcon />}
    </span>
  );
}

// -----------------------------------
// Why Avail Aesthetics MD
// -----------------------------------

export default function WhyAvailSection({
  content,
  consultationUrl,
}: WhyAvailSectionProps) {

  // =================================
  // CONTENT SOURCE
  // =================================

  // When CMS content is provided,
  // use published CMS values.
  //
  // When no props are provided,
  // retain the original approved
  // static development preview.

  const isCmsMode = content !== undefined;

  // ---------------------------------
  // SECTION HEADING
  // ---------------------------------

  const heading =
    content?.heading ??
    "Why Avail Aesthetics MD";

  // ---------------------------------
  // PROFILE IMAGE
  // ---------------------------------

  const imageSrc = isCmsMode
    ? content.imageSrc
    : whyAvailArtworkSrc;

  const imageAlt =
    content?.imageAlt ??
    "Aesthetic skincare portrait";

  // ---------------------------------
  // AVAIL LOGO
  // ---------------------------------

  const logoSrc = isCmsMode
    ? content.logoSrc
    : "/avail/brand/logo.svg";

  const logoAlt =
    content?.logoAlt ??
    "Avail Aesthetics MD";

  // ---------------------------------
  // OTHERS HEADING
  // ---------------------------------

  const othersHeading =
    content?.othersHeading ??
    "Others";

  // ---------------------------------
  // CONSULTATION BUTTON LABEL
  // ---------------------------------

  const consultationLabel =
    content?.consultationLabel ??
    "Book Your Consultation";

  // ---------------------------------
  // COMPARISON FEATURES
  // ---------------------------------

  const features = isCmsMode
    ? content.features
    : whyAvailFeatures;

  // =================================
  // CONSULTATION URL
  // =================================

  // Public homepage:
  // Published Hero CMS URL.
  //
  // Static development preview:
  // Original approved Hero URL.

  const rawBookingUrl = (
    isCmsMode
      ? consultationUrl
      : homepageHero.consultationUrl
  )?.trim();

  const bookingUrl =
    rawBookingUrl &&
    /^https:\/\//i.test(rawBookingUrl)
      ? rawBookingUrl
      : null;

  return (
    <section
      id="why-avail"
      aria-labelledby="why-avail-heading"
      className="w-full overflow-hidden bg-[#E2EBF7]"
    >
      {/* LAPTOP / DESKTOP: TWO COLUMNS */}
      <div className="mx-auto grid w-full max-w-[1800px] lg:min-h-[650px] lg:grid-cols-[38%_62%]">

        {/* ==================================
            LEFT PROFILE IMAGE

            Only shown at laptop/desktop
            1024px and above.
        ================================== */}

        <div className="relative hidden min-h-[650px] overflow-hidden lg:block">

          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="(min-width: 1800px) 684px, 38vw"
              className="object-cover object-center"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#D4DFED] px-8 text-center">
              <p className="text-sm text-[#0B253B]/50">
                Approved profile image pending
              </p>
            </div>
          )}

        </div>

        {/* ==================================
            RIGHT CONTENT

            Full width on mobile and tablet.
        ================================== */}

        <div className="flex min-w-0 flex-col justify-center px-4 pb-12 pt-10 sm:px-8 sm:pb-14 sm:pt-12 lg:px-8 lg:py-12 xl:px-14">

          {/* SECTION TITLE */}
          <h2
            id="why-avail-heading"
            className="text-center font-serif text-[clamp(1.8rem,3vw,3rem)] font-normal leading-tight tracking-[-0.025em] text-[#0B253B]"
          >
            {heading}
          </h2>

          {/* COMPARISON GRID */}
          <div className="mx-auto mt-9 grid w-full max-w-[900px] grid-cols-[minmax(0,1.65fr)_minmax(78px,0.75fr)_minmax(65px,0.55fr)] gap-x-2 sm:mt-11 sm:gap-x-4 lg:mt-12">

            {/* LEFT FEATURE LABELS */}
            <div className="min-w-0">

              {/* Header spacer */}
              <div className="h-[90px] sm:h-[100px]" />

              {features.map((feature) => (
                <div
                  key={feature.id}
                  className="flex h-[66px] items-center border-b border-[#0B253B]/15 pr-1 last:border-b-0 sm:h-[72px]"
                >
                  <span className="font-serif text-[12px] leading-snug text-[#0B253B] min-[400px]:text-[14px] sm:text-[18px] lg:text-[22px]">
                    {feature.label}
                  </span>
                </div>
              ))}

            </div>

            {/* AVAIL HIGHLIGHTED COLUMN */}
            <div className="overflow-hidden rounded-[18px] border border-[#52738B] bg-[#C9D8E8]">

              {/* DYNAMIC AVAIL LOGO */}
              <div className="flex h-[90px] items-center justify-center px-2 sm:h-[100px] sm:px-3">

                {logoSrc ? (
                  <Image
                    src={logoSrc}
                    alt={logoAlt}
                    width={120}
                    height={60}
                    className="h-auto w-full max-w-[110px] object-contain"
                  />
                ) : null}

              </div>

              {/* AVAIL CHECKS */}
              {features.map((feature) => (
                <div
                  key={feature.id}
                  className="mx-2 flex h-[66px] items-center justify-center border-b border-[#0B253B]/15 last:border-b-0 sm:mx-3 sm:h-[72px]"
                >
                  <FeatureStatus
                    value={feature.avail}
                    featureLabel={feature.label}
                  />
                </div>
              ))}

            </div>

            {/* OTHERS COLUMN */}
            <div className="min-w-0">

              <div className="flex h-[90px] items-center justify-center sm:h-[100px]">
                <h3 className="font-serif text-[12px] font-semibold uppercase tracking-wide text-[#0B253B] sm:text-[16px] lg:text-lg">
                  {othersHeading}
                </h3>
              </div>

              {features.map((feature) => (
                <div
                  key={feature.id}
                  className="flex h-[66px] items-center justify-center border-b border-[#0B253B]/15 last:border-b-0 sm:h-[72px]"
                >
                  <FeatureStatus
                    value={feature.others}
                    featureLabel={feature.label}
                  />
                </div>
              ))}

            </div>
          </div>

          {/* BOOK CONSULTATION CTA */}
          <div className="mt-10 flex justify-center sm:mt-12">

            {bookingUrl ? (
              <a
                href={bookingUrl}
                className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-full bg-[#0B253B] px-6 py-3 text-center text-[13px] font-medium text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#17405C] hover:shadow-[0_10px_24px_rgba(11,37,59,0.2)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0B253B] sm:min-h-[48px] sm:px-8 sm:text-sm"
              >
                {consultationLabel}
              </a>
            ) : (
              <span
                title="Booking URL will be configured through the CMS"
                className="inline-flex min-h-[44px] cursor-default items-center justify-center rounded-full bg-[#0B253B] px-6 py-3 text-center text-[13px] font-medium text-white sm:min-h-[48px] sm:px-8 sm:text-sm"
              >
                {consultationLabel}
              </span>
            )}

          </div>

        </div>
      </div>
    </section>
  );
}
