
import Image from "next/image";

import {
  homepageHero,
  type HomepageHeroContent,
} from "@/lib/cms/homepage-preview";

type HeroSectionProps = {
  content?: HomepageHeroContent;
};

// -------------------------------------
// SVG Icons
// -------------------------------------

function ArrowUpRightIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
    >
      <path d="M5 19 19 5" />
      <path d="M8 5h11v11" />
    </svg>
  );
}

function EligibilityIcon({
  mobile = false,
}: {
  mobile?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={
        mobile
          ? "h-7 w-7 shrink-0"
          : "h-5 w-5 shrink-0"
      }
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m7.5 12.5 3 3 6-7" />
    </svg>
  );
}

// -------------------------------------
// Desktop Consultation Button Content
// -------------------------------------

function ConsultationContent({
  label,
}: {
  label: string;
}) {
  return (
    <>
      <span>{label}</span>

      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors duration-300 group-hover:bg-[#0B253B] group-hover:text-white">
        <ArrowUpRightIcon />
      </span>
    </>
  );
}

// -------------------------------------
// Hero Section
// -------------------------------------

export default function HeroSection({
  content = homepageHero,
}: HeroSectionProps) {
  // Separate desktop and mobile banner images
  const mobileImageSrc =
    content.mobileImageSrc || content.imageSrc;

  // Only use configured HTTPS booking URLs
  const consultationUrl =
    content.consultationUrl &&
    /^https:\/\//i.test(content.consultationUrl.trim())
      ? content.consultationUrl.trim()
      : null;

  // Desktop CTA styling - unchanged
  const consultationStyles =
    "group inline-flex min-h-12 items-center justify-between gap-5 rounded-full border border-white/30 bg-[#0B253B] py-1.5 pl-5 pr-1.5 text-sm font-medium text-white shadow-md transition-[background-color,color,transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:bg-white hover:text-[#0B253B] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transform-none motion-reduce:transition-none";

  // Compact mobile CTA styling
  const mobileButtonStyles =
    "inline-flex min-h-[46px] min-w-[174px] w-fit items-center justify-center rounded-full bg-white px-[22px] py-2 text-center text-[14px] leading-5 font-medium text-[#0B253B] shadow-sm transition-[background-color,transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#EAF8FA] hover:shadow-lg active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transform-none motion-reduce:transition-none";

  return (
    <section
      aria-label="Avail Aesthetics MD homepage introduction"
      className="bg-white sm:px-5 sm:pt-3 lg:px-7"
    >
      {/* =====================================
          MOBILE HERO
          Below 640px
      ===================================== */}

      <div className="w-full overflow-hidden bg-[#0B253B] sm:hidden">

        {/* MOBILE BANNER - SLIGHTLY TALLER */}
        <div className="relative aspect-[1.65/1] w-full overflow-hidden bg-[#0B253B]">
          <Image
            src={mobileImageSrc}
            alt={content.imageAlt}
            fill
            priority
            sizes="(max-width: 639px) 100vw, 1px"
            className="object-cover object-center"
          />
        </div>

        {/* MOBILE CONTENT BELOW IMAGE */}
        <div className="relative bg-[#0B253B] px-6 pb-10 pt-7 min-[400px]:px-8 min-[500px]:px-10">

          {/* Heading */}
          <h1
            id="avail-mobile-hero-heading"
            className="max-w-[520px] whitespace-pre-line font-serif text-[clamp(2rem,7.4vw,3.1rem)] font-semibold uppercase leading-[1.08] tracking-[-0.025em] text-white"
          >
            {content.heading}
          </h1>

          {/* Description */}
          <p className="mt-5 max-w-[500px] text-[clamp(1.05rem,4vw,1.4rem)] leading-[1.45] text-white">
            {content.description}
          </p>

          {/* Mobile Consultation Button */}
          <div className="mt-6 flex items-center">
            {consultationUrl ? (
              <a
                href={consultationUrl}
                className={`${mobileButtonStyles} cursor-pointer`}
              >
                {content.consultationLabel}
              </a>
            ) : (
              <span
                title="Consultation URL will be configured through the CMS"
                className={`${mobileButtonStyles} cursor-default`}
              >
                {content.consultationLabel}
              </span>
            )}
          </div>

          {/* HSA/FSA Eligibility */}
          <div className="mt-6 flex items-center gap-2.5 text-[#9AEFF0]">
            <EligibilityIcon mobile />

            <span className="text-[clamp(1rem,3.7vw,1.3rem)] font-semibold leading-tight">
              {content.eligibilityText}
            </span>
          </div>
        </div>
      </div>

      {/* =====================================
          TABLET / LAPTOP / DESKTOP HERO
          640px and above
          UNCHANGED
      ===================================== */}

      <div className="relative isolate mx-auto hidden min-h-[500px] w-full max-w-[1600px] items-center overflow-hidden rounded-md bg-[#0B253B] sm:flex lg:min-h-[560px]">

        {/* Desktop Image */}
        <Image
          src={content.imageSrc}
          alt=""
          fill
          priority
          sizes="(min-width: 1600px) 1600px, 100vw"
          className="object-cover object-[58%_center] sm:object-center"
        />

        {/* Desktop Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10 sm:bg-gradient-to-r sm:from-black/65 sm:via-black/30 sm:to-black/10" />

        {/* Desktop Content */}
        <div className="relative z-10 w-full px-6 pb-12 pt-28 sm:px-12 sm:py-16 lg:px-16">
          <div className="max-w-[580px]">

            {/* Heading */}
            <h1
              id="avail-desktop-hero-heading"
              className="whitespace-pre-line font-serif text-[clamp(1.55rem,4vw,2.45rem)] font-semibold uppercase leading-[1.04] tracking-[-0.025em] text-white"
            >
              {content.heading}
            </h1>

            {/* Description */}
            <p className="mt-6 max-w-[360px] text-sm leading-relaxed text-white/95 sm:text-base">
              {content.description}
            </p>

            {/* Desktop Actions */}
            <div className="mt-7 flex flex-wrap items-center gap-4">

              {/* Consultation */}
              {consultationUrl ? (
                <a
                  href={consultationUrl}
                  className={`${consultationStyles} cursor-pointer`}
                >
                  <ConsultationContent
                    label={content.consultationLabel}
                  />
                </a>
              ) : (
                <span
                  title="Consultation booking URL will be configured through the CMS"
                  className={`${consultationStyles} cursor-default`}
                >
                  <ConsultationContent
                    label={content.consultationLabel}
                  />
                </span>
              )}

              {/* Eligibility */}
              <div className="inline-flex items-center gap-2 text-xs font-medium text-white sm:text-sm">
                <span className="text-[#72D8DE]">
                  <EligibilityIcon />
                </span>

                <span>{content.eligibilityText}</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
