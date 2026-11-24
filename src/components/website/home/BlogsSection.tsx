
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type TouchEvent,
  type TransitionEvent,
} from "react";

import Image from "next/image";
import Link from "next/link";

import {
  homepageBlogs,
  type HomepageBlog,
} from "@/lib/cms/homepage-blogs-preview";

type BlogEntry = HomepageBlog & {
  status?: "draft" | "published";
  featuredOrder?: number | null;
};

type BlogsSectionProps = {
  blogs?: BlogEntry[];
};

// -------------------------------------
// ARROW ICON
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
      strokeWidth="2.3"
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

// -------------------------------------
// BLOG CARD
// -------------------------------------

function BlogCard({
  blog,
  accessible = true,
}: {
  blog: BlogEntry;
  accessible?: boolean;
}) {
  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden bg-white shadow-[0_6px_25px_rgba(11,37,59,0.07)] transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(11,37,59,0.12)]">

      {/* BLOG IMAGE */}
      <div className="relative aspect-[1.95/1] w-full shrink-0 overflow-hidden bg-[#E8EDF2]">
        {blog.imageSrc ? (
          <Image
            src={blog.imageSrc}
            alt={blog.imageAlt}
            fill
            sizes="(max-width: 639px) 90vw, (max-width: 1023px) 50vw, 33vw"
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.045] motion-reduce:transition-none"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-[#0B253B]/50">
            Approved blog image pending
          </div>
        )}
      </div>

      {/* BLOG CONTENT */}
      <div className="flex flex-1 flex-col px-4 pb-5 pt-5 sm:px-5">

        {/* FEATURED BADGE */}
        {blog.featured && (
          <span className="w-fit rounded-md bg-[#D7E8FF] px-3 py-1 text-[11px] font-medium text-[#40566D]">
            Featured
          </span>
        )}

        {/* TITLE */}
        <h3 className="mt-3 line-clamp-3 text-[16px] font-semibold leading-[1.4] tracking-[-0.015em] text-[#272727] sm:text-[17px] lg:text-[clamp(0.875rem,1.2vw,1.25rem)]">
          {blog.title}
        </h3>

        {/* DESCRIPTION */}
        <p className="mt-3 line-clamp-4 text-[13px] leading-[1.7] text-[#606572] sm:text-[14px] lg:text-[clamp(0.8rem,1.02vw,1.05rem)]">
          {blog.excerpt}
        </p>

        {/* READ MORE */}
        <div className="mt-auto pt-7">
          {blog.href ? (
            <Link
              href={blog.href}
              tabIndex={accessible ? undefined : -1}
              aria-label={`Read ${blog.title}`}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full border border-[#0B253B] bg-white px-6 py-2 text-[13px] font-medium text-[#0B253B] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#0B253B] hover:text-white hover:shadow-[0_7px_16px_rgba(11,37,59,0.15)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#0B253B] motion-reduce:transform-none"
            >
              Read More
            </Link>
          ) : (
            <span
              title="Blog detail page not connected yet"
              className="inline-flex min-h-10 cursor-default items-center justify-center rounded-full border border-[#0B253B] bg-white px-6 py-2 text-[13px] font-medium text-[#0B253B]"
            >
              Read More
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

// -------------------------------------
// BLOGS SECTION
// -------------------------------------

export default function BlogsSection({
  blogs = homepageBlogs,
}: BlogsSectionProps) {

  // FEATURED BLOG FILTER
  const featuredBlogs = useMemo(() => {
    return blogs
      .filter(
        (blog) =>
          blog.featured === true &&
          (
            blog.status === undefined ||
            blog.status === "published"
          )
      )
      .sort((a, b) => {
        const orderA =
          a.featuredOrder ?? Number.MAX_SAFE_INTEGER;

        const orderB =
          b.featuredOrder ?? Number.MAX_SAFE_INTEGER;

        return orderA - orderB;
      });
  }, [blogs]);

  const total = featuredBlogs.length;
  const canLoop = total > 1;

  // CAROUSEL REFS
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const movingRef = useRef(false);

  const touchRef = useRef<{
    x: number;
    y: number;
  } | null>(null);

  // CAROUSEL STATE
  const [step, setStep] = useState(0);
  const [position, setPosition] = useState(
    canLoop ? total : 0
  );
  const [animate, setAnimate] = useState(false);
  const [visibleCount, setVisibleCount] = useState(1);

  // CREATE LOOPING SLIDES
  const slides = canLoop
    ? Array.from({ length: 3 }, (_, copyIndex) =>
        featuredBlogs.map((blog) => ({
          blog,
          copyIndex,
        }))
      ).flat()
    : featuredBlogs.map((blog) => ({
        blog,
        copyIndex: 1,
      }));

  // RESET WHEN BLOG DATA CHANGES
  useEffect(() => {
    movingRef.current = false;
    setAnimate(false);
    setPosition(canLoop ? total : 0);
  }, [total, canLoop, blogs]);

  // RESPONSIVE CARD COUNT
  useEffect(() => {
    function updateVisibleCount() {
      const width = window.innerWidth;

      setVisibleCount(
        width >= 1024 ? 3 : width >= 640 ? 2 : 1
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
  }, []);

  // MEASURE SLIDE WIDTH
  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!viewport || !track) return;

    function measure() {
      const firstCard =
        track?.querySelector<HTMLElement>(
          "[data-blog-slide]"
        );

      if (!firstCard || !track) return;

      const gap =
        parseFloat(
          window.getComputedStyle(track).columnGap
        ) || 0;

      const cardWidth =
        firstCard.getBoundingClientRect().width;

      setStep(cardWidth + gap);
    }

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(viewport);

    return () => observer.disconnect();
  }, [total]);

  // ENABLE ANIMATION AFTER INITIAL MEASUREMENT
  useEffect(() => {
    if (!step) return;

    let secondFrame = 0;

    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        setAnimate(true);
      });
    });

    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [step, total]);

  // MOVE CAROUSEL
  function move(direction: -1 | 1) {
    if (
      !canLoop ||
      !step ||
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

        if (next >= total * 2) {
          next -= total;
        }

        if (next < total) {
          next += total;
        }

        return next;
      });

      return;
    }

    movingRef.current = true;
    setAnimate(true);

    setPosition((current) => current + direction);
  }

  // SEAMLESS LOOP RESET
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

    if (
      position >= total * 2 ||
      position < total
    ) {
      setAnimate(false);

      setPosition((current) => {
        if (current >= total * 2) {
          return current - total;
        }

        if (current < total) {
          return current + total;
        }

        return current;
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
          movingRef.current = false;
        });
      });
    } else {
      movingRef.current = false;
    }
  }

  // MOBILE / TABLET TOUCH SWIPE
  function handleTouchStart(
    event: TouchEvent<HTMLDivElement>
  ) {
    const touch = event.touches[0];

    if (!touch) return;

    touchRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  function handleTouchEnd(
    event: TouchEvent<HTMLDivElement>
  ) {
    const start = touchRef.current;
    touchRef.current = null;

    const touch = event.changedTouches[0];

    if (!start || !touch) return;

    const deltaX = start.x - touch.clientX;
    const deltaY = start.y - touch.clientY;

    if (
      Math.abs(deltaX) > 40 &&
      Math.abs(deltaX) > Math.abs(deltaY)
    ) {
      move(deltaX > 0 ? 1 : -1);
    }
  }

  // KEYBOARD NAVIGATION
  function handleKeyDown(
    event: KeyboardEvent<HTMLDivElement>
  ) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }
  }

  if (total === 0) return null;

  return (
    <section
      id="blogs"
      aria-labelledby="blogs-heading"
      className="w-full overflow-hidden bg-white pb-14 pt-10 sm:pb-16 sm:pt-12 lg:pb-20 lg:pt-14"
    >
      <div className="mx-auto w-full max-w-[1700px] px-4 sm:px-6 lg:px-28">

        {/* BLOG HEADING */}
        <h2
          id="blogs-heading"
          className="mb-8 text-center font-serif text-[clamp(1.85rem,3vw,2.8rem)] font-normal leading-tight tracking-[-0.025em] text-[#0B253B] sm:mb-10"
        >
          Blogs
        </h2>

        {/* CAROUSEL */}
        <div className="relative">

          <div
            ref={viewportRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Featured blog articles"
            tabIndex={0}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onKeyDown={handleKeyDown}
            className="w-full overflow-hidden pb-6 outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#0B253B] [touch-action:pan-y]"
          >

            {/* SLIDING TRACK */}
            <div
              ref={trackRef}
              onTransitionEnd={handleTransitionEnd}
              className="flex items-stretch gap-2 will-change-transform lg:gap-[6px]"
              style={{
                transform: `translate3d(-${
                  position * step
                }px, 0, 0)`,

                transition: animate
                  ? "transform 520ms cubic-bezier(0.22, 1, 0.36, 1)"
                  : "none",

                visibility:
                  step > 0 ? "visible" : "hidden",
              }}
            >
              {slides.map(
                ({ blog, copyIndex }, index) => {
                  const accessible =
                    index >= position &&
                    index < position + visibleCount;

                  return (
                    <div
                      key={`${copyIndex}-${blog.id}`}
                      data-blog-slide
                      role="group"
                      aria-roledescription="slide"
                      aria-label={`Article ${
                        (index % total) + 1
                      } of ${total}`}
                      aria-hidden={!accessible}
                      className="min-w-0 shrink-0 basis-[88%] sm:basis-[calc((100%-8px)/2)] lg:basis-[calc((100%-12px)/3)]"
                    >
                      <BlogCard
                        blog={blog}
                        accessible={accessible}
                      />
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* NAVIGATION:
              MOBILE + TABLET ONLY
              HIDDEN AT LG AND ABOVE
          */}
          {canLoop && (
            <>
              {/* TABLET PREVIOUS */}
              <button
                type="button"
                aria-label="Previous featured blog"
                disabled={!step}
                onClick={() => move(-1)}
                className="absolute -left-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[#0B253B] text-white shadow-md transition-all duration-300 hover:scale-105 hover:bg-[#17405C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B253B] disabled:cursor-not-allowed disabled:opacity-40 sm:flex lg:hidden"
              >
                <ArrowIcon direction="left" />
              </button>

              {/* TABLET NEXT */}
              <button
                type="button"
                aria-label="Next featured blog"
                disabled={!step}
                onClick={() => move(1)}
                className="absolute -right-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[#0B253B] text-white shadow-md transition-all duration-300 hover:scale-105 hover:bg-[#17405C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B253B] disabled:cursor-not-allowed disabled:opacity-40 sm:flex lg:hidden"
              >
                <ArrowIcon direction="right" />
              </button>

              {/* MOBILE PREVIOUS / NEXT */}
              <div className="mt-2 flex items-center justify-center gap-3 sm:hidden">

                <button
                  type="button"
                  aria-label="Previous featured blog"
                  disabled={!step}
                  onClick={() => move(-1)}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#0B253B] text-white transition-colors hover:bg-[#17405C] disabled:opacity-40"
                >
                  <ArrowIcon direction="left" />
                </button>

                <button
                  type="button"
                  aria-label="Next featured blog"
                  disabled={!step}
                  onClick={() => move(1)}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#0B253B] text-white transition-colors hover:bg-[#17405C] disabled:opacity-40"
                >
                  <ArrowIcon direction="right" />
                </button>

              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
