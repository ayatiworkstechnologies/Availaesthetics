
import { Suspense } from "react";

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
  getPublicHomepageData,
} from "@/lib/cms/public-homepage";

// =====================================
// PUBLISHED HOMEPAGE CMS SECTIONS
// =====================================

async function PublishedHomepageSections() {
  const {
    hero,
    categories,
    signature,
    testimonials,
  } = await getPublicHomepageData();

  return (
    <>
      {/* 1. PUBLISHED HERO */}
      {hero && (
        <HeroSection content={hero} />
      )}

      {/* 2. PUBLISHED EXPLORE BY CATEGORY */}
      {categories && (
        <ExploreByCategory content={categories} />
      )}

      {/* 3. PUBLISHED SIGNATURE AESTHETICS */}
      {signature && (
        <SignatureAesthetics content={signature} />
      )}

      {/* 4. PUBLISHED TESTIMONIALS */}
      {testimonials && (
        <TestimonialsSection
          key={JSON.stringify(testimonials)}
          content={testimonials}
        />
      )}
    </>
  );
}

// =====================================
// LOADING FALLBACK
// =====================================

function HomepageLoadingFallback() {
  return (
    <section
      role="status"
      aria-label="Loading homepage sections"
      className="min-h-[50vh] animate-pulse bg-[#0B253B]/5"
    >
      <span className="sr-only">
        Loading homepage...
      </span>
    </section>
  );
}

// =====================================
// PUBLIC HOMEPAGE
// =====================================

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main id="main-content">

        {/* 1-4. DYNAMIC PUBLISHED CMS SECTIONS */}
        <Suspense fallback={<HomepageLoadingFallback />}>
          <PublishedHomepageSections />
        </Suspense>

        {/* 5. WHY AVAIL AESTHETICS MD */}
        <WhyAvailSection />

        {/* 6. OUR LOCATIONS */}
        <OurLocationsSection />

        {/* 7. FAQ */}
        <FaqSection />

        {/* 8. BLOGS */}
        <BlogsSection />

      </main>

      <SiteFooter homeHref="/" />
    </div>
  );
}
