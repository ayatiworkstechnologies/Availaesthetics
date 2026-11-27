
"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type TouchEvent,
  type TransitionEvent,
} from "react";

import type {
  HomepageTestimonialsContent,
} from "@/lib/cms/public-homepage";

// -------------------------------------
// SVG Icons
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
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 ${
        direction === "left" ? "rotate-180" : ""
      }`}
    >
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      fill="currentColor"
      className="h-10 w-6 text-white"
    >
      <path d="M20.5 9C12.5 13.5 8 20.5 8 31v8h14V23H15c.6-3.7 3-6.7 7-9.6L20.5 9Zm19 0C31.5 13.5 27 20.5 27 31v8h14V23h-7c.6-3.7 3-6.7 7-9.6L39.5 9Z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-6 w-6 shrink-0 text-[#111111]"
    >
      <circle cx="12" cy="6.5" r="4.2" />
      <path d="M7 12.5c1.3-1.1 3-1.7 5-1.7s3.7.6 5 1.7l1.3 7.5H5.7L7 12.5Z" />
    </svg>
  );
}

// -------------------------------------
// Carousel Arrow Button
// -------------------------------------

function CarouselArrow({
  direction,
  onClick,
  disabled,
  label,
  className = "",
}: {
  direction: "left" | "right";
  onClick: () => void;
  disabled: boolean;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`
        flex h-11 w-11 shrink-0
        cursor-pointer items-center justify-center
        rounded-full
        bg-[#0B253B] text-white
        shadow-[0_3px_10px_rgba(11,37,59,0.12)]
        transition-all duration-300 ease-out
        hover:scale-105 hover:bg-[#18435F]
        hover:shadow-[0_8px_20px_rgba(11,37,59,0.22)]
        active:scale-95
        focus-visible:outline-2
        focus-visible:outline-offset-4
        focus-visible:outline-[#0B253B]
        disabled:cursor-not-allowed
        disabled:opacity-35
        motion-reduce:transform-none
        ${className}
      `}
    >
      <ArrowIcon direction={direction} />
    </button>
  );
}

// -------------------------------------
// Testimonials Section
// -------------------------------------

export default function TestimonialsSection({
  content,
}: {
  content: HomepageTestimonialsContent;
}) {
  // Get published testimonials from CMS.
  const homepageTestimonials = content.testimonials;

  const totalTestimonials =
    homepageTestimonials.length;

  const canNavigate = totalTestimonials > 1;

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const movingRef = useRef(false);

  const touchStartRef = useRef<{
    x: number;
    y: number;
  } | null>(null);

  // Begin in the middle copy of the testimonials.
  // Copies on each side allow seamless looping.
  const [position, setPosition] = useState(
    canNavigate ? totalTestimonials : 0
  );

  const [slideStep, setSlideStep] = useState(0);
  const [animate, setAnimate] = useState(true);

  // -------------------------------------
  // Create carousel copies for looping
  // -------------------------------------

  const carouselItems = canNavigate
    ? Array.from({ length: 3 }, (_, copyIndex) =>
        homepageTestimonials.map((testimonial) => ({
          testimonial,
          copyIndex,
        }))
      ).flat()
    : homepageTestimonials.map((testimonial) => ({
        testimonial,
        copyIndex: 1,
      }));

  // -------------------------------------
  // Measure responsive card width + gap
  // -------------------------------------

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!viewport || !track) return;

    function measure() {
      if (!track) return;

      const firstCard =
        track.querySelector<HTMLElement>(
          "[data-avail-testimonial]"
        );

      if (!firstCard) return;

      const gap =
        parseFloat(
          window.getComputedStyle(track).columnGap
        ) || 0;

      const width =
        firstCard.getBoundingClientRect().width;

      setSlideStep(width + gap);
    }

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [totalTestimonials]);

  // -------------------------------------
  // Move carousel by one real card
  // -------------------------------------

  function changeSlide(direction: -1 | 1) {
    if (
      !canNavigate ||
      !slideStep ||
      movingRef.current
    ) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      setAnimate(false);

      setPosition((current) => {
        let next = current + direction;

        if (next >= totalTestimonials * 2) {
          next -= totalTestimonials;
        }

        if (next < totalTestimonials) {
          next += totalTestimonials;
        }

        return next;
      });

      return;
    }

    movingRef.current = true;
    setAnimate(true);

    setPosition(
      (current) => current + direction
    );
  }

  // -------------------------------------
  // Seamless infinite loop
  // -------------------------------------

  function handleTransitionEnd(
    event: TransitionEvent<HTMLDivElement>
  ) {
    if (
      event.target !== trackRef.current ||
      event.propertyName !== "transform" ||
      !movingRef.current
    ) {
      return;
    }

    // When entering a copied group, instantly
    // reset to its identical original position.
    if (
      position >= totalTestimonials * 2 ||
      position < totalTestimonials
    ) {
      setAnimate(false);

      setPosition((current) => {
        if (current >= totalTestimonials * 2) {
          return current - totalTestimonials;
        }

        if (current < totalTestimonials) {
          return current + totalTestimonials;
        }

        return current;
      });

      // Re-enable transitions after the reset
      // is painted, avoiding a visible jump.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
          movingRef.current = false;
        });
      });

      return;
    }

    movingRef.current = false;
  }

  // -------------------------------------
  // Touch swipe on mobile and tablet
  // -------------------------------------

  function handleTouchStart(
    event: TouchEvent<HTMLDivElement>
  ) {
    const touch = event.touches[0];

    if (!touch) return;

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  function handleTouchEnd(
    event: TouchEvent<HTMLDivElement>
  ) {
    const start = touchStartRef.current;

    touchStartRef.current = null;

    const touch = event.changedTouches[0];

    if (!start || !touch) return;

    const deltaX = start.x - touch.clientX;
    const deltaY = start.y - touch.clientY;

    // Ignore vertical page scrolling.
    if (
      Math.abs(deltaX) > 45 &&
      Math.abs(deltaX) > Math.abs(deltaY)
    ) {
      changeSlide(deltaX > 0 ? 1 : -1);
    }
  }

  // -------------------------------------
  // Keyboard accessibility
  // -------------------------------------

  function handleKeyDown(
    event: KeyboardEvent<HTMLDivElement>
  ) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      changeSlide(1);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      changeSlide(-1);
    }
  }

  // Hide section if there are no testimonials.
  if (totalTestimonials === 0) {
    return null;
  }

  const currentTestimonialIndex =
    canNavigate
      ? (
          (position - totalTestimonials) %
            totalTestimonials +
          totalTestimonials
        ) % totalTestimonials
      : 0;

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="w-full bg-white px-5 pb-14 pt-10 sm:pb-16 sm:pt-12 lg:px-12 lg:pb-20 lg:pt-14"
    >
      <div className="mx-auto w-full max-w-[1700px] px-4 sm:px-6 lg:px-12">

        {/* DYNAMIC SECTION HEADING */}
        <h2
          id="testimonials-heading"
          className="
            mx-auto max-w-[1100px]
            text-center font-serif
            text-[clamp(1.85rem,3vw,3rem)]
            font-normal leading-[1.12]
            tracking-[-0.025em]
            text-[#0B253B]
          "
        >
          {content.heading}
        </h2>

        {/* CAROUSEL WRAPPER */}
        <div className="relative mt-16 sm:mt-20 lg:mt-24">

          {/* SLIDER VIEWPORT */}
          <div
            ref={viewportRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Client testimonials"
            tabIndex={0}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onKeyDown={handleKeyDown}
            className="
              w-full overflow-hidden
              pb-5 pt-11
              outline-offset-4
              focus-visible:outline-2
              focus-visible:outline-[#0B253B]
              [touch-action:pan-y]
            "
          >

            {/* ACTUAL MOVING CAROUSEL TRACK */}
            <div
              ref={trackRef}
              onTransitionEnd={handleTransitionEnd}
              className="
                flex w-full gap-5
                will-change-transform
                lg:gap-6
              "
              style={{
                transform: `translate3d(-${
                  position * slideStep
                }px, 0, 0)`,

                transition: animate
                  ? "transform 520ms cubic-bezier(0.22, 1, 0.36, 1)"
                  : "none",

                visibility:
                  slideStep > 0 ? "visible" : "hidden",
              }}
            >

              {carouselItems.map(
                ({ testimonial, copyIndex }) => (
                  <article
                    key={`${copyIndex}-${testimonial.id}`}
                    data-avail-testimonial
                    role="group"
                    aria-roledescription="slide"
                    aria-hidden={
                      canNavigate && copyIndex !== 1
                    }
                    className="
                      relative flex min-w-0
                      shrink-0 basis-full
                      min-h-[340px]
                      flex-col
                      bg-[#FDF9F7]
                      px-6 pb-7 pt-[66px]
                      shadow-[0_3px_12px_rgba(11,37,59,0.08)]
                      sm:min-h-[365px]
                      sm:basis-[calc((100%-20px)/2)]
                      sm:px-7 sm:pb-8
                      lg:min-h-[390px]
                      lg:basis-[calc((100%-48px)/3)]
                      lg:px-8
                    "
                  >

                    {/* NAVY QUOTATION CIRCLE */}
                    <div
                      aria-hidden="true"
                      className="
                        absolute -top-10 left-7
                        flex h-[50px] w-[50px]
                        items-center justify-center
                        rounded-full bg-[#0B253B]
                        sm:left-9
                      "
                    >
                      <QuoteIcon />
                    </div>

                    {/* TESTIMONIAL QUOTE */}
                    <blockquote className="flex-1">
                      <p
                        className="
                          text-[15px]
                          leading-[1.65]
                          tracking-[-0.012em]
                          text-[#878787]
                          sm:text-[17px]
                          lg:text-[clamp(1rem,1.1vw,1.25rem)]
                        "
                      >
                        {testimonial.quote
                          ? `"${testimonial.quote}"`
                          : "Approved client testimonial content will appear here."}
                      </p>
                    </blockquote>

                    {/* TESTIMONIAL AUTHOR */}
                    <div className="mt-8 flex items-center gap-3">
                      <PersonIcon />

                      <span
                        className="
                          text-[14px] font-semibold
                          text-[#292529]
                          sm:text-[16px]
                        "
                      >
                        —{" "}
                        {testimonial.author ??
                          "Client attribution pending"}
                      </span>
                    </div>

                  </article>
                )
              )}

            </div>
          </div>

          {/* SCREEN READER ANNOUNCEMENT */}
          <p
            className="sr-only"
            aria-live="polite"
            aria-atomic="true"
          >
            Testimonial {currentTestimonialIndex + 1}
            {" of "}
            {totalTestimonials}
          </p>

          {/* DESKTOP / TABLET LEFT ARROW */}
          <CarouselArrow
            direction="left"
            label="Previous testimonial"
            disabled={!canNavigate || slideStep === 0}
            onClick={() => changeSlide(-1)}
            className="
              absolute -left-5 top-1/2
              z-20 hidden -translate-y-1/2
              sm:flex lg:-left-6
            "
          />

          {/* DESKTOP / TABLET RIGHT ARROW */}
          <CarouselArrow
            direction="right"
            label="Next testimonial"
            disabled={!canNavigate || slideStep === 0}
            onClick={() => changeSlide(1)}
            className="
              absolute -right-5 top-1/2
              z-20 hidden -translate-y-1/2
              sm:flex lg:-right-6
            "
          />

          {/* MOBILE NAVIGATION */}
          <div className="mt-6 flex items-center justify-center gap-4 sm:hidden">
            <CarouselArrow
              direction="left"
              label="Previous testimonial"
              disabled={!canNavigate || slideStep === 0}
              onClick={() => changeSlide(-1)}
            />

            <CarouselArrow
              direction="right"
              label="Next testimonial"
              disabled={!canNavigate || slideStep === 0}
              onClick={() => changeSlide(1)}
            />
          </div>

        </div>
      </div>
    </section>
  );
}
