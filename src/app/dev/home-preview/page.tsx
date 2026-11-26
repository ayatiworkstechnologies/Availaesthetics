
import { Suspense } from "react";

import SiteHeader from "@/components/website/layout/SiteHeader";
import SiteFooter from "@/components/website/layout/SiteFooter";

// =====================================
// EXISTING WEBSITE COMPONENTS
// =====================================

import HeroSection from "@/components/website/home/HeroSection";

import ExploreByCategory from "@/components/website/home/ExploreByCategory";

import SignatureAesthetics from "@/components/website/home/SignatureAesthetics";

import TestimonialsSection from "@/components/website/home/TestimonialsSection";

import WhyAvailSection from "@/components/website/home/WhyAvailSection";

import OurLocationsSection from "@/components/website/home/OurLocationsSection";

import FaqSection from "@/components/website/home/FaqSection";

import BlogsSection from "@/components/website/home/BlogsSection";

// =====================================
// SHARED PUBLIC CMS SERVICE
// =====================================

import {
  getPublicHomepageData,
} from "@/lib/cms/public-homepage";

// =====================================
// 1. PUBLISHED HOMEPAGE SECTIONS
// =====================================

async function PublishedHomepageSections() {
  // Retrieve published content from FastAPI.
  const {
    hero,
    categories,
    signature,
  } = await getPublicHomepageData();

  return (
    <>
      {/* ---------------------------------
          HOMEPAGE HERO
          Dynamic CMS Content
      --------------------------------- */}

      {hero && (
        <HeroSection content={hero} />
      )}

      {/* ---------------------------------
          EXPLORE BY CATEGORY
          Dynamic CMS Content
      --------------------------------- */}

      {categories && (
        <ExploreByCategory
          content={categories}
        />
      )}

      {/* ---------------------------------
          SIGNATURE AESTHETICS
          Dynamic CMS Content
      --------------------------------- */}

      {signature && (
        <SignatureAesthetics
          content={signature}
        />
      )}
    </>
  );
}

// =====================================
// 2. CMS LOADING FALLBACK
// =====================================

function HomepageLoadingFallback() {
  return (
    <section
      role="status"
      aria-label="Loading homepage"
      className="min-h-[50vh] animate-pulse bg-[#0B253B]/5"
    >
      <span className="sr-only">
        Loading homepage content...
      </span>
    </section>
  );
}

// =====================================
// 3. PUBLIC HOMEPAGE
// =====================================

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* =================================
          WEBSITE HEADER
      ================================= */}

      <SiteHeader />

      {/* =================================
          MAIN WEBSITE CONTENT
      ================================= */}

      <main id="main-content">

        {/* ---------------------------------
            DYNAMIC CMS SECTIONS
            1. Homepage Hero
            2. Explore by Category
            3. Signature Aesthetics
        --------------------------------- */}

        <Suspense
          fallback={<HomepageLoadingFallback />}
        >
          <PublishedHomepageSections />
        </Suspense>

        {/* ---------------------------------
            4. TESTIMONIALS
            Existing Website Component
        --------------------------------- */}

        <TestimonialsSection />

        {/* ---------------------------------
            5. WHY AVAIL AESTHETICS MD
            Existing Website Component
        --------------------------------- */}

        <WhyAvailSection />

        {/* ---------------------------------
            6. OUR LOCATIONS
            Existing Website Component
        --------------------------------- */}

        <OurLocationsSection />

        {/* ---------------------------------
            7. FAQ
            Existing Website Component
        --------------------------------- */}

        <FaqSection />

        {/* ---------------------------------
            8. BLOGS
            Existing Website Component
        --------------------------------- */}

        <BlogsSection />

      </main>

      {/* =================================
          WEBSITE FOOTER
      ================================= */}

      <SiteFooter homeHref="/" />

    </div>
  );
}
