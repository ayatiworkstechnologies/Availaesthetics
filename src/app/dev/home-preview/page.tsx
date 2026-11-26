
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

import { homepageHero } from "@/lib/cms/homepage-preview";

import {
  categoryCards,
  allTreatmentsHref,
} from "@/lib/cms/homepage-sections-preview";

import type {
  HomepageCategoriesContent,
} from "@/lib/cms/public-homepage";

export default function HomePreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  // Static design-preview content only.
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

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main id="main-content">
        {/* 1. STATIC PREVIEW HERO */}
        <HeroSection content={homepageHero} />

        {/* 2. STATIC PREVIEW CATEGORIES */}
        <ExploreByCategory content={previewCategories} />

        {/* 3. SIGNATURE AESTHETICS */}
        <SignatureAesthetics />

        {/* 4. TESTIMONIALS */}
        <TestimonialsSection />

        {/* 5. WHY AVAIL AESTHETICS MD */}
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
