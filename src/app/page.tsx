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
    whyAvail,
    locations,
  } = await getPublicHomepageData();

  return (
    <>
      {/* 1. PUBLISHED HERO */}
      {hero && <HeroSection content={hero} />}

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

      {/* 5. PUBLISHED WHY AVAIL */}
      {whyAvail && (
        <WhyAvailSection
          content={whyAvail}
          consultationUrl={hero?.consultationUrl ?? null}
        />
      )}

      {/* 6. PUBLISHED OUR LOCATIONS */}
      {locations && locations.locations.length > 0 && (
        <OurLocationsSection
          heading={locations.heading}
          description={locations.description}
          locations={locations.locations}
          defaultSelectedLocationId={
            locations.defaultSelectedLocationId
          }
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
        {/* 1–6. PUBLISHED CMS SECTIONS */}
        <Suspense fallback={<HomepageLoadingFallback />}>
          <PublishedHomepageSections />
        </Suspense>

        {/* 7. FAQ */}
        <FaqSection />

        {/* 8. BLOGS */}
        <BlogsSection />
      </main>

      <SiteFooter homeHref="/" />
    </div>
  );
}