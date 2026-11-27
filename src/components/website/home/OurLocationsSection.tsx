"use client";

import { useEffect, useState } from "react";

import {
  homepageLocations,
  type HomepageLocation,
} from "@/lib/cms/homepage-locations-preview";

// =====================================
// CAROUSEL CONFIGURATION
// =====================================

const CARDS_PER_SLIDE = 2;
const AUTO_SLIDE_INTERVAL = 5000;

// =====================================
// DEFAULT STATIC PREVIEW CONTENT
// =====================================

const DEFAULT_HEADING = "Our Locations";

const DEFAULT_DESCRIPTION =
  "One Avail Aesthetics MD, two clinics across Greater Houston. " +
  "Each clinic offers personalized aesthetic and wellness " +
  "treatments with its own team, services, and booking options.";

// =====================================
// DYNAMIC SECTION PROPS
// =====================================

export type OurLocationsSectionProps = {
  locations?: HomepageLocation[];
  heading?: string;
  description?: string;
  defaultSelectedLocationId?: string | null;
};

// =====================================
// SVG ICONS
// =====================================

function ExternalArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
    >
      <path d="M14 5h5v5" />
      <path d="M10 14 19 5" />
      <path d="M19 13v6H5V5h6" />
    </svg>
  );
}

function LocationPinIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.8" />
    </svg>
  );
}

// =====================================
// CLINIC LOCATION CARD
// =====================================

type LocationCardProps = {
  location: HomepageLocation;
  index: number;
  selected: boolean;
  onSelect: () => void;
};

function LocationCard({
  location,
  index,
  selected,
  onSelect,
}: LocationCardProps) {
  const cityStatePostal = [
    location.city,
    [
      location.state,
      location.postalCode,
    ]
      .filter(Boolean)
      .join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  const formattedAddress = [
    location.addressLine1,
    location.addressLine2,
    cityStatePostal,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className={`
        group relative flex min-h-[154px]
        items-center gap-3
        rounded-2xl border bg-white
        px-4 py-5
        transition-[border-color,box-shadow,transform]
        duration-300 ease-out
        sm:min-h-[166px] sm:px-5
        ${
          selected
            ? "border-[#0B253B] shadow-[0_5px_16px_rgba(11,37,59,0.05)]"
            : "border-[#DEDCD9] hover:border-[#0B253B]/50 hover:shadow-[0_8px_22px_rgba(11,37,59,0.07)]"
        }
      `}
    >
      {/* SELECT LOCATION */}
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Show ${location.name} clinic on the map`}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B253B] sm:gap-4"
      >
        {/* LOCATION NUMBER */}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B253B] text-xs font-semibold text-white sm:h-9 sm:w-9">
          {index + 1}
        </span>

        {/* LOCATION DETAILS */}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-serif text-[22px] leading-tight text-[#0B253B] sm:text-[26px]">
              {location.name}
            </span>

            {location.regionLabel && (
              <span className="text-[11px] font-medium text-[#65758A] sm:text-xs">
                {location.regionLabel}
              </span>
            )}

            {selected && (
              <span className="rounded bg-[#E2ECFF] px-2 py-1 text-[10px] font-medium text-[#0B253B]">
                Selected location
              </span>
            )}
          </span>

          {/* ADDRESS */}
          <span className="mt-3 block text-[12px] leading-[1.7] text-[#0B253B] sm:text-[13px]">
            {formattedAddress}
          </span>

          {/* PHONE */}
          {location.phone && (
            <span className="mt-1.5 block text-[12px] font-medium text-[#0B253B] sm:text-[13px]">
              {location.phone}
            </span>
          )}
        </span>
      </button>

      {/* CALL CTA */}
      {location.phoneHref && (
        <a
          href={location.phoneHref}
          aria-label={`Call ${location.name} clinic`}
          className="
            inline-flex min-h-10 shrink-0
            cursor-pointer items-center justify-center
            rounded-full bg-[#0B253B]
            px-4 text-[12px] font-medium text-white
            transition-all duration-300 ease-out
            hover:-translate-y-0.5
            hover:bg-[#19435E]
            hover:shadow-[0_8px_18px_rgba(11,37,59,0.18)]
            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-[#0B253B]
            motion-reduce:transform-none
          "
        >
          Call
        </a>
      )}
    </div>
  );
}

// =====================================
// OUR LOCATIONS MAIN SECTION
// =====================================

export default function OurLocationsSection({
  locations = homepageLocations,
  heading = DEFAULT_HEADING,
  description = DEFAULT_DESCRIPTION,
  defaultSelectedLocationId,
}: OurLocationsSectionProps) {
  // ---------------------------------
  // INITIAL SELECTED LOCATION
  // ---------------------------------

  const initialSelectedId =
    defaultSelectedLocationId &&
    locations.some(
      (location) =>
        location.id === defaultSelectedLocationId
    )
      ? defaultSelectedLocationId
      : locations.some(
          (location) => location.id === "cypress"
        )
        ? "cypress"
        : (locations[0]?.id ?? "");

  const [selectedId, setSelectedId] =
    useState(initialSelectedId);

  // ---------------------------------
  // CAROUSEL STATE
  // ---------------------------------

  const [activeSlide, setActiveSlide] =
    useState(0);

  const [isPaused, setIsPaused] =
    useState(false);

  const [
    prefersReducedMotion,
    setPrefersReducedMotion,
  ] = useState(false);

  // ---------------------------------
  // CONDITIONAL CAROUSEL
  // ---------------------------------

  const isCarousel =
    locations.length > CARDS_PER_SLIDE;

  const slides: HomepageLocation[][] = [];

  for (
    let index = 0;
    index < locations.length;
    index += CARDS_PER_SLIDE
  ) {
    slides.push(
      locations.slice(
        index,
        index + CARDS_PER_SLIDE
      )
    );
  }

  const totalSlides = slides.length;

  const visibleSlide =
    totalSlides > 0
      ? activeSlide % totalSlides
      : 0;

  // ---------------------------------
  // CURRENTLY SELECTED MAP LOCATION
  // ---------------------------------

  const selectedLocation =
    locations.find(
      (location) =>
        location.id === selectedId
    ) ??
    locations.find(
      (location) =>
        location.id === initialSelectedId
    ) ??
    locations[0];

  // ---------------------------------
  // REDUCED MOTION
  // ---------------------------------

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const updatePreference = () => {
      setPrefersReducedMotion(
        mediaQuery.matches
      );
    };

    updatePreference();

    mediaQuery.addEventListener(
      "change",
      updatePreference
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        updatePreference
      );
    };
  }, []);

  // ---------------------------------
  // AUTOMATIC CAROUSEL
  // ---------------------------------

  useEffect(() => {
    if (
      !isCarousel ||
      totalSlides <= 1 ||
      isPaused ||
      prefersReducedMotion
    ) {
      return;
    }

    const interval = window.setInterval(
      () => {
        setActiveSlide(
          (current) =>
            (current + 1) % totalSlides
        );
      },
      AUTO_SLIDE_INTERVAL
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [
    isCarousel,
    totalSlides,
    isPaused,
    prefersReducedMotion,
  ]);

  // ---------------------------------
  // NO LOCATIONS
  // ---------------------------------

  if (!selectedLocation) {
    return null;
  }

  // ---------------------------------
  // RENDER LOCATION CARDS
  // ---------------------------------

  function renderLocationCards(
    items: HomepageLocation[]
  ) {
    return items.map((location) => {
      const index = locations.findIndex(
        (item) =>
          item.id === location.id
      );

      return (
        <LocationCard
          key={location.id}
          location={location}
          index={index}
          selected={
            selectedLocation.id === location.id
          }
          onSelect={() => {
            setSelectedId(location.id);
          }}
        />
      );
    });
  }

  return (
    <section
      id="our-locations"
      aria-labelledby="our-locations-title"
      className="w-full bg-[#FAF9F7] py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[1700px] px-4 sm:px-6 lg:px-28">

        {/* TWO-COLUMN DESKTOP LAYOUT */}
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:gap-12">

          {/* LEFT COLUMN */}
          <div className="min-w-0">

            {/* HEADING */}
            <h2
              id="our-locations-title"
              className="
                font-serif
                text-[clamp(1.9rem,3vw,2.8rem)]
                font-normal leading-tight
                tracking-[-0.025em]
                text-[#0B253B]
              "
            >
              {heading}
            </h2>

            {/* DESCRIPTION */}
            <p className="mt-4 max-w-[570px] text-[13px] leading-[1.9] text-[#64748B] sm:text-[15px]">
              {description}
            </p>

            {/* LOCATION CARDS */}
            <div className="mt-9 sm:mt-12 lg:mt-16">
              {!isCarousel ? (
                // 1–2 NORMAL LOCATION CARDS
                <div className="space-y-3">
                  {renderLocationCards(locations)}
                </div>
              ) : (
                // 3+ LOCATIONS: CAROUSEL
                <div
                  aria-label="Clinic locations carousel"
                  role="region"
                  aria-roledescription="carousel"
                  onMouseEnter={() =>
                    setIsPaused(true)
                  }
                  onMouseLeave={() =>
                    setIsPaused(false)
                  }
                  onFocusCapture={() =>
                    setIsPaused(true)
                  }
                  onBlurCapture={(event) => {
                    if (
                      !event.currentTarget.contains(
                        event.relatedTarget
                      )
                    ) {
                      setIsPaused(false);
                    }
                  }}
                >
                  {/* SLIDING CARDS */}
                  <div className="overflow-hidden">
                    <div
                      className="flex transition-transform duration-500 ease-in-out motion-reduce:transition-none"
                      style={{
                        transform:
                          `translateX(-${visibleSlide * 100}%)`,
                      }}
                    >
                      {slides.map(
                        (slide, slideIndex) => (
                          <div
                            key={
                              slide[0]?.id ??
                              slideIndex
                            }
                            className="w-full shrink-0 space-y-3"
                            aria-hidden={
                              visibleSlide !== slideIndex
                            }
                            inert={
                              visibleSlide !== slideIndex
                            }
                          >
                            {renderLocationCards(slide)}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* SLIDE INDICATORS */}
                  <div
                    className="mt-5 flex items-center justify-center gap-2.5"
                    aria-label="Location carousel pages"
                  >
                    {slides.map(
                      (slide, index) => (
                        <button
                          key={
                            slide[0]?.id ??
                            index
                          }
                          type="button"
                          onClick={() =>
                            setActiveSlide(index)
                          }
                          aria-label={
                            `Show location slide ${index + 1} of ${totalSlides}`
                          }
                          aria-current={
                            visibleSlide === index
                              ? "true"
                              : undefined
                          }
                          className="flex min-h-9 min-w-9 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B253B]"
                        >
                          <span
                            className={`
                              block h-[7px]
                              rounded-full
                              transition-all
                              duration-300
                              ${
                                visibleSlide === index
                                  ? "w-6 bg-[#0B253B]"
                                  : "w-[7px] bg-[#B8C4D0]"
                              }
                            `}
                          />
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: GOOGLE MAPS */}
          <div className="min-w-0">
            <div
              className="
                relative h-[350px] w-full
                overflow-hidden rounded-2xl
                border border-[#E1E5E9]
                bg-[#E9EEF2]
                sm:h-[480px]
                lg:h-[640px]
              "
            >
              {/* DYNAMIC GOOGLE MAPS */}
              <iframe
                key={selectedLocation.id}
                src={selectedLocation.mapEmbedUrl}
                title={`${selectedLocation.name} clinic location on Google Maps`}
                width="100%"
                height="100%"
                loading="lazy"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 h-full w-full border-0"
              />

              {/* OPEN DIRECTIONS */}
              <a
                href={selectedLocation.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open directions to ${selectedLocation.name} clinic in Google Maps`}
                className="
                  group absolute bottom-4 left-4 z-10
                  inline-flex min-h-10 cursor-pointer
                  items-center gap-2.5
                  rounded-xl border border-stone-200
                  bg-white/95 px-4 py-2
                  text-[12px] font-semibold
                  text-[#0B253B]
                  shadow-[0_5px_20px_rgba(11,37,59,0.12)]
                  backdrop-blur-sm
                  transition-all duration-300
                  hover:-translate-y-0.5
                  hover:bg-white
                  hover:shadow-[0_10px_24px_rgba(11,37,59,0.18)]
                  focus-visible:outline-2
                  focus-visible:outline-offset-2
                  focus-visible:outline-[#0B253B]
                  motion-reduce:transform-none
                  sm:bottom-5 sm:left-5
                "
              >
                <span className="text-[#0B253B]">
                  <LocationPinIcon />
                </span>

                <span>
                  {selectedLocation.name}
                  {selectedLocation.state
                    ? `, ${selectedLocation.state}`
                    : ""}
                </span>

                <ExternalArrowIcon />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}