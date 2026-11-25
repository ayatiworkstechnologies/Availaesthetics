
import { Suspense } from "react";

import SiteHeader from "@/components/website/layout/SiteHeader";
import SiteFooter from "@/components/website/layout/SiteFooter";

import HeroSection from "@/components/website/home/HeroSection";

import {
  getPublicHomepageData,
} from "@/lib/cms/public-homepage";


// =====================================
// 1. DYNAMIC HOMEPAGE HERO
// =====================================

async function PublishedHomepageHero() {
  // Fetch only published CMS content.
  const { hero } = await getPublicHomepageData();

  // Never expose draft or preview content
  // when the Hero has not been published.
  if (!hero) {
    return null;
  }

  // Reuse the existing approved Hero design.
  return <HeroSection content={hero} />;
}


// =====================================
// 2. HERO LOADING FALLBACK
// =====================================

function HeroLoadingFallback() {
  return (
    <section
      role="status"
      aria-label="Loading homepage banner"
      className="min-h-[50vh] animate-pulse bg-[#0B253B]/5"
    >
      <span className="sr-only">
        Loading homepage banner...
      </span>
    </section>
  );
}


// =====================================
// 3. AVAIL AESTHETICS MD HOMEPAGE
// =====================================

export default function HomePage() {
  return (
    <>
      {/* Existing website header */}
      <SiteHeader />

      <main id="main-content">

        {/* Dynamic published Homepage Hero */}
        <Suspense fallback={<HeroLoadingFallback />}>
          <PublishedHomepageHero />
        </Suspense>

        {/*
          Other approved homepage sections
          will be restored here using the
          existing design components.
        */}

      </main>

      {/* Existing website footer */}
      <SiteFooter homeHref="/" />
    </>
  );
}
