
"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type CarouselItem = {
  id: string;
  content: ReactNode;
};

type CardCarouselProps = {
  items: CarouselItem[];
  label: string;
};

// -------------------------------------
// SVG Navigation Icon
// -------------------------------------

function ArrowIcon({
  direction,
}: {
  direction: "left" | "right";
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 ${
        direction === "left" ? "rotate-180" : ""
      }`}
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

// -------------------------------------
// Reusable Carousel
// -------------------------------------

export default function CardCarousel({
  items,
  label,
}: CardCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(1);

  // -----------------------------------
  // Responsive card count
  // -----------------------------------

  useEffect(() => {
    function updateVisibleCount() {
      const width = window.innerWidth;

      const count =
        width >= 1024
          ? 4
          : width >= 640
          ? 2
          : 1;

      setVisibleCount(count);

      setActiveIndex((current) =>
        Math.min(
          current,
          Math.max(0, items.length - count)
        )
      );
    }

    updateVisibleCount();

    window.addEventListener(
      "resize",
      updateVisibleCount
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateVisibleCount
      );
    };
  }, [items.length]);

  const maxIndex = Math.max(
    0,
    items.length - visibleCount
  );

  const currentIndex = Math.min(
    activeIndex,
    maxIndex
  );

  const totalPositions = maxIndex + 1;

  // -----------------------------------
  // Get slide elements
  // -----------------------------------

  function getSlides(): HTMLElement[] {
    if (!trackRef.current) return [];

    return Array.from(
      trackRef.current.querySelectorAll<HTMLElement>(
        "[data-avail-slide]"
      )
    );
  }

  // -----------------------------------
  // Calculate scroll position
  // -----------------------------------

  function getSlidePosition(index: number): number {
    const track = trackRef.current;

    if (!track) return 0;

    const slides = getSlides();

    const firstSlide = slides[0];
    const targetSlide = slides[index];

    if (!firstSlide || !targetSlide) return 0;

    const targetLeft =
      targetSlide.offsetLeft - firstSlide.offsetLeft;

    // IMPORTANT:
    // Never scroll beyond the end of the cards.
    // This removes the empty trailing space.
    const maximumScroll = Math.max(
      0,
      track.scrollWidth - track.clientWidth
    );

    return Math.max(
      0,
      Math.min(targetLeft, maximumScroll)
    );
  }

  // -----------------------------------
  // Navigate to a slide
  // -----------------------------------

  function goToSlide(index: number) {
    const track = trackRef.current;

    if (!track) return;

    const targetIndex = Math.max(
      0,
      Math.min(index, maxIndex)
    );

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    track.scrollTo({
      left: getSlidePosition(targetIndex),
      behavior: reducedMotion ? "auto" : "smooth",
    });

    setActiveIndex(targetIndex);
  }

  // -----------------------------------
  // Update active position on swipe
  // -----------------------------------

  function handleScroll() {
    const track = trackRef.current;

    if (!track) return;

    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let index = 0; index <= maxIndex; index++) {
      const position = getSlidePosition(index);

      const distance = Math.abs(
        track.scrollLeft - position
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }

    setActiveIndex(nearestIndex);
  }

  if (items.length === 0) return null;

  return (
    <div className="w-full min-w-0">

      {/* ==================================
          CAROUSEL TRACK
      ================================== */}

      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
        onScroll={handleScroll}
        className="
          flex
          w-full
          snap-x
          snap-mandatory
          gap-3
          overflow-x-auto
          overscroll-x-contain
          pb-1
          outline-offset-4
          focus-visible:outline-2
          focus-visible:outline-[#0B253B]
          [scrollbar-width:none]
          [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden
          sm:gap-2
          lg:gap-1
        "
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <div
              key={item.id}
              data-avail-slide
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${items.length}`}
              className={`
                min-w-0
                shrink-0
                basis-[84%]
                sm:basis-[calc((100%-8px)/2)]
                lg:basis-[calc((100%-12px)/4)]
                ${
                  isLast
                    ? "snap-end"
                    : "snap-start"
                }
              `}
            >
              {item.content}
            </div>
          );
        })}
      </div>

      {/* ==================================
          PAGINATION AND NAVIGATION
      ================================== */}

      {totalPositions > 1 && (
        <div className="mt-5 flex items-center justify-between gap-4 sm:mt-6">

          {/* PAGINATION DOTS */}
          <div
            className="flex items-center gap-2"
            aria-label="Carousel pagination"
          >
            {totalPositions <= 8 ? (
              Array.from(
                { length: totalPositions },
                (_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Go to carousel position ${index + 1}`}
                    aria-current={
                      currentIndex === index
                        ? "true"
                        : undefined
                    }
                    onClick={() => goToSlide(index)}
                    className={`
                      h-2
                      cursor-pointer
                      rounded-full
                      transition-all
                      duration-300
                      ${
                        currentIndex === index
                          ? "w-6 bg-[#0B253B]"
                          : "w-2 bg-[#0B253B]/20 hover:bg-[#0B253B]/50"
                      }
                    `}
                  />
                )
              )
            ) : (
              <span
                aria-live="polite"
                className="text-xs font-medium text-[#0B253B]"
              >
                {String(currentIndex + 1).padStart(2, "0")}
                {" / "}
                {String(totalPositions).padStart(2, "0")}
              </span>
            )}
          </div>

          {/* PREVIOUS AND NEXT BUTTONS */}
          <div className="flex items-center gap-2">

            <button
              type="button"
              aria-label={`Previous ${label}`}
              disabled={currentIndex === 0}
              onClick={() =>
                goToSlide(currentIndex - 1)
              }
              className="
                flex h-10 w-10
                cursor-pointer
                items-center justify-center
                rounded-full
                border border-[#0B253B]/20
                text-[#0B253B]
                transition-all duration-300
                hover:border-[#0B253B]
                hover:bg-[#0B253B]
                hover:text-white
                focus-visible:outline-2
                focus-visible:outline-offset-2
                focus-visible:outline-[#0B253B]
                disabled:cursor-not-allowed
                disabled:opacity-30
                disabled:hover:bg-transparent
                disabled:hover:text-[#0B253B]
              "
            >
              <ArrowIcon direction="left" />
            </button>

            <button
              type="button"
              aria-label={`Next ${label}`}
              disabled={currentIndex === maxIndex}
              onClick={() =>
                goToSlide(currentIndex + 1)
              }
              className="
                flex h-10 w-10
                cursor-pointer
                items-center justify-center
                rounded-full
                border border-[#0B253B]/20
                text-[#0B253B]
                transition-all duration-300
                hover:border-[#0B253B]
                hover:bg-[#0B253B]
                hover:text-white
                focus-visible:outline-2
                focus-visible:outline-offset-2
                focus-visible:outline-[#0B253B]
                disabled:cursor-not-allowed
                disabled:opacity-30
                disabled:hover:bg-transparent
                disabled:hover:text-[#0B253B]
              "
            >
              <ArrowIcon direction="right" />
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
