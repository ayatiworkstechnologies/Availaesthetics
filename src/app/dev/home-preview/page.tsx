
import { notFound } from "next/navigation";

import SiteHeader from "@/components/website/layout/SiteHeader";
import HeroSection from "@/components/website/home/HeroSection";
import ExploreByCategory from "@/components/website/home/ExploreByCategory";
import SignatureAesthetics from "@/components/website/home/SignatureAesthetics";
import TestimonialsSection from "@/components/website/home/TestimonialsSection";
import WhyAvailSection from "@/components/website/home/WhyAvailSection";

import {
  homepageHero,
} from "@/lib/cms/homepage-preview";
import OurLocationsSection from "@/components/website/home/OurLocationsSection";
import FaqSection from "@/components/website/home/FaqSection";
import BlogsSection from "@/components/website/home/BlogsSection";
import SiteFooter from "@/components/website/layout/SiteFooter";

export default function HomePreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main>
        {/* 1. Homepage Hero */}
        <HeroSection content={homepageHero} />

        {/* 2. Explore by Category */}
        <ExploreByCategory />

        {/* 3. Signature Aesthetics */}
        <SignatureAesthetics />

        {/* 4. Client Testimonials */}
        <TestimonialsSection />

        {/* 5. Why Avail Aesthetics MD */}
        <WhyAvailSection />
        {/* {6 Our Location} */}
        <OurLocationsSection />
        {/* {7 Faq section} */}
        <FaqSection />
        {/* { 8 Blog Section} */}
        <BlogsSection />
        {/* {9 footer section} */}
        <SiteFooter />
      </main>
    </div>
  );
}
