
import Image from "next/image";
import Link from "next/link";

import CardCarousel from "./CardCarousel";

import type {
  HomepageCategoryCard,
  HomepageCategoriesContent,
} from "@/lib/cms/public-homepage";

// -------------------------------------
// Reusable Category Card
// -------------------------------------

function CategoryCard({
  card,
}: {
  card: HomepageCategoryCard;
}) {
  const cardContent = (
    <div className="group relative aspect-[2/3] w-full overflow-hidden bg-[#E7E1DB]">

      {/* CATEGORY IMAGE */}
      {card.imageSrc ? (
        <Image
          src={card.imageSrc}
          alt={card.imageAlt}
          fill
          sizes="(max-width: 639px) 84vw, (max-width: 1023px) 50vw, 25vw"
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.055] motion-reduce:transition-none"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#EAE4DF] to-[#B8B5B2] p-4 text-center">
          <span className="text-xs text-[#0B253B]/60">
            Image pending
          </span>
        </div>
      )}

      {/* SUBTLE OVERLAY */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/20 via-transparent to-transparent transition-colors duration-300 group-hover:bg-black/10" />

      {/* VERTICAL CATEGORY TITLE */}
      <div className="pointer-events-none absolute right-2 top-4 z-10 sm:right-4 sm:top-5 lg:right-5">
        <h3
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
          }}
          className="max-h-full font-sans text-[clamp(0.75rem,1.8vw,1.65rem)] font-semibold uppercase leading-none tracking-[0.035em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
        >
          {card.title}
        </h3>
      </div>

      {/* HOVER BORDER */}
      <div className="pointer-events-none absolute inset-0 border border-transparent transition-colors duration-300 group-hover:border-white/60" />

      {/* ARROW SHOWN WHEN CARD HAS A LINK */}
      {card.href && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-4 right-4 z-20 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-[#0B253B]/80 text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </span>
      )}

    </div>
  );

  if (card.href) {
    return (
      <Link
        href={card.href}
        aria-label={`Explore ${card.title}`}
        className="block cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B253B]"
      >
        {cardContent}
      </Link>
    );
  }

  return <div>{cardContent}</div>;
}

// -------------------------------------
// Explore by Category Section
// -------------------------------------

export default function ExploreByCategory({
  content,
}: {
  content: HomepageCategoriesContent;
}) {
  const categoryCards = content.cards;
  const allTreatmentsHref = content.allTreatmentsHref;

  if (categoryCards.length === 0) return null;

  const hasMoreThanFour = categoryCards.length > 4;

  const carouselItems = categoryCards.map((card) => ({
    id: card.id,
    content: <CategoryCard card={card} />,
  }));

  // Compact button styles
  const buttonStyles =
    "inline-flex min-h-[42px] items-center justify-center rounded-full bg-[#0B253B] px-6 py-2.5 text-center text-[13px] font-medium text-white transition-all duration-300 ease-out sm:min-h-[46px] sm:px-7 sm:text-sm";

  return (
    <section
      id="explore-categories"
      aria-labelledby="explore-category-title"
      className="bg-white pb-10 pt-10 sm:pb-14 sm:pt-12 lg:pb-16 lg:pt-14"
    >
      <div className="mx-auto w-full max-w-[1700px] px-4 sm:px-6 lg:px-28">

        {/* SECTION HEADING */}
        <h2
          id="explore-category-title"
          className="mb-7 text-center font-serif text-[clamp(1.85rem,3vw,2.8rem)] font-normal leading-tight tracking-[-0.025em] text-[#0B253B] sm:mb-8 lg:mb-10"
        >
          {content.heading}
        </h2>

        {/* CATEGORIES */}
        {hasMoreThanFour ? (
          <CardCarousel
            items={carouselItems}
            label="Explore treatment categories"
          />
        ) : (
          <div className="grid grid-cols-2 gap-[3px] sm:gap-1 lg:grid-cols-4">
            {categoryCards.map((card) => (
              <CategoryCard
                key={card.id}
                card={card}
              />
            ))}
          </div>
        )}

        {/* EXPLORE ALL TREATMENTS CTA */}
        <div className="mt-8 flex justify-center sm:mt-9 lg:mt-10">
          {allTreatmentsHref ? (
            <Link
              href={allTreatmentsHref}
              className={`${buttonStyles} cursor-pointer hover:-translate-y-0.5 hover:bg-[#173D57] hover:shadow-[0_8px_22px_rgba(11,37,59,0.18)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0B253B] motion-reduce:transform-none`}
            >
              Explore All Treatments
            </Link>
          ) : (
            <span
              title="Treatment listing page is not connected yet"
              className={`${buttonStyles} cursor-default`}
            >
              Explore All Treatments
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
