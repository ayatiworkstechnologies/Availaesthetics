
import { notFound } from "next/navigation";

import SiteHeader from "@/components/website/layout/SiteHeader";
import SiteFooter from "@/components/website/layout/SiteFooter";

import HeroSection from "@/components/website/home/HeroSection";
import ExploreByCategory from "@/components/website/home/ExploreByCategory";
import SignatureAesthetics from "@/components/website/home/SignatureAesthetics";
import TestimonialsSection from "@/components/website/home/TestimonialsSection";
import WhyAvailSection from "@/components/website/home/WhyAvailSection";
import OurLocationsSection from "@/components/website/home/OurLocationsSection";
import FaqSection from "@/components/website/home/FaqSection";
import BlogsSection from "@/components/website/home/BlogsSection";

import {
  homepageHero,
} from "@/lib/cms/homepage-preview";

import {
  categoryCards,
  allTreatmentsHref,
  signatureCards,
} from "@/lib/cms/homepage-sections-preview";

import {
  homepageTestimonials,
} from "@/lib/cms/homepage-trust-preview";

import type {
  HomepageCategoriesContent,
  HomepageSignatureContent,
  HomepageTestimonialsContent,
} from "@/lib/cms/public-homepage";

// =====================================
// PREVIEW CATEGORY CONTENT
// =====================================

const previewCategories: HomepageCategoriesContent = {
  cards: categoryCards.map((card) => ({
    id: String(card.id),
    title: card.title,
    imageSrc: card.imageSrc ?? null,
    imageAlt: card.imageAlt ?? "",
    href: card.href ?? null,
  })),

  allTreatmentsHref: allTreatmentsHref ?? null,
};

// =====================================
// PREVIEW SIGNATURE CONTENT
// =====================================

const previewSignature: HomepageSignatureContent = {
  cards: signatureCards.map((card) => ({
    id: String(card.id),
    title: card.title,
    imageSrc: card.imageSrc ?? null,
    imageAlt: card.imageAlt ?? "",
    href: card.href ?? null,
  })),
};

// =====================================
// PREVIEW TESTIMONIALS CONTENT
// =====================================

const previewTestimonials: HomepageTestimonialsContent = {
  heading: "Real Stories. Remarkable Results.",

  testimonials: homepageTestimonials.map((item) => ({
    id: String(item.id),
    quote: item.quote ?? "",
    author: item.author ?? "",
  })),
};

// =====================================
// DEVELOPMENT PREVIEW PAGE
// =====================================

export default function HomePreviewPage() {
  // Never expose this preview in production.
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main id="main-content">

        {/* 1. STATIC HOMEPAGE HERO */}
        <HeroSection content={homepageHero} />

        {/* 2. STATIC EXPLORE BY CATEGORY */}
        <ExploreByCategory
          content={previewCategories}
        />

        {/* 3. STATIC SIGNATURE AESTHETICS */}
        <SignatureAesthetics
          content={previewSignature}
        />

        {/* 4. STATIC TESTIMONIALS */}
        <TestimonialsSection
          content={previewTestimonials}
        />

        {/* 5. WHY AVAIL */}
        <WhyAvailSection />

        {/* 6. OUR LOCATIONS */}
        <OurLocationsSection />

        {/* 7. FAQ */}
        <FaqSection />

        {/* 8. BLOGS */}
        <BlogsSection />

      </main>

      <SiteFooter homeHref="/dev/home-preview" />
    </div>
  );
}
