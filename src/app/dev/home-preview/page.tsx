
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

export default function HomePreviewPage() {
  // Development-only preview.
  // Prevent this route from being publicly accessible
  // in the production environment.
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main id="main-content">
        {/* 1. HOMEPAGE HERO */}
        <HeroSection content={homepageHero} />

        {/* 2. EXPLORE BY CATEGORY */}
        <ExploreByCategory />

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

      {/* 9. FOOTER - OUTSIDE MAIN */}
      <SiteFooter homeHref="/dev/home-preview" />
    </div>
  );
}
