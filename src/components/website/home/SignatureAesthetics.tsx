
import Image from "next/image";
import Link from "next/link";

import CardCarousel from "./CardCarousel";

import type {
  HomepageSignatureCard,
  HomepageSignatureContent,
} from "@/lib/cms/public-homepage";

// -------------------------------------
// Reusable Signature Card
// -------------------------------------

function SignatureCard({
  card,
}: {
  card: HomepageSignatureCard;
}) {
  const cardContent = (
    <div className="group relative aspect-[9/10] w-full overflow-hidden bg-[#D7D9D9]">

      {/* IMAGE */}
      {card.imageSrc ? (
        <Image
          src={card.imageSrc}
          alt={card.imageAlt}
          fill
          sizes="(max-width: 639px) 84vw, (max-width: 1023px) 50vw, 25vw"
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.055] motion-reduce:transition-none"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#B3C1C8] via-[#D7DDDF] to-[#879AA3] p-4 text-center">
          <span className="text-xs text-[#0B253B]/60">
            Image pending
          </span>
        </div>
      )}

      {/* IMAGE OVERLAY */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/30 transition-colors duration-300 group-hover:bg-black/10" />

      {/* WHITE TREATMENT TITLE */}
      <div className="absolute inset-x-0 top-0 z-10 p-4 sm:p-4 lg:p-5">
        <h3 className="max-w-[90%] text-[clamp(1rem,1.7vw,1.3rem)] font-semibold leading-[1.22] tracking-[-0.02em] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]">
          {card.title}
        </h3>
      </div>

      {/* LEARN MORE BUTTON */}
      <div className="absolute bottom-4 left-4 z-10 lg:bottom-5 lg:left-5">
        <span
          className={`inline-flex min-h-[36px] items-center justify-center rounded-full bg-white/80 px-5 py-2 text-xs font-medium text-[#0B253B] backdrop-blur-sm transition-all duration-300 ease-out sm:min-h-[38px] sm:px-6 sm:text-[13px] ${
            card.href
              ? "cursor-pointer group-hover:-translate-y-0.5 group-hover:bg-white group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)]"
              : "cursor-default"
          }`}
        >
          Learn More
        </span>
      </div>

      {/* HOVER OUTLINE */}
      <div className="pointer-events-none absolute inset-0 border border-transparent transition-colors duration-300 group-hover:border-white/60" />
    </div>
  );

  if (card.href) {
    return (
      <Link
        href={card.href}
        aria-label={`Learn more about ${card.title}`}
        className="block cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B253B]"
      >
        {cardContent}
      </Link>
    );
  }

  return <div>{cardContent}</div>;
}

// -------------------------------------
// Signature Aesthetics Section
// -------------------------------------

export default function SignatureAesthetics({
  content,
}: {
  content: HomepageSignatureContent;
}) {
  const signatureCards = content.cards;

  if (signatureCards.length === 0) return null;

  const hasMoreThanFour = signatureCards.length > 4;

  const carouselItems = signatureCards.map((card) => ({
    id: card.id,
    content: <SignatureCard card={card} />,
  }));

  return (
    <section
      id="signature-aesthetics"
      aria-labelledby="signature-title"
      className="overflow-hidden bg-white pb-14 pt-5 sm:pb-16 sm:pt-6 lg:pb-20 lg:pt-8"
    >
      {/* SAME LG HORIZONTAL PADDING */}
      <div className="mx-auto w-full max-w-[1700px] px-4 sm:px-6 lg:px-28">

        {/* SECTION HEADING */}
        <h2
          id="signature-title"
          className="mb-7 text-center font-serif text-[clamp(1.85rem,3vw,2.8rem)] font-normal leading-tight tracking-[-0.025em] text-[#0B253B] sm:mb-8 lg:mb-10"
        >
          Signature Aesthetics
        </h2>

        {/*
          More than four cards:
          Carousel on all screen sizes.

          Four or fewer cards:
          Mobile/tablet carousel,
          desktop four-column grid.
        */}

        {hasMoreThanFour ? (
          <CardCarousel
            items={carouselItems}
            label="Signature Aesthetics treatments"
          />
        ) : (
          <>
            {/* MOBILE + TABLET CAROUSEL */}
            <div className="lg:hidden">
              <CardCarousel
                items={carouselItems}
                label="Signature Aesthetics treatments"
              />
            </div>

            {/* DESKTOP GRID */}
            <div className="hidden grid-cols-4 gap-1 lg:grid">
              {signatureCards.map((card) => (
                <SignatureCard
                  key={card.id}
                  card={card}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
