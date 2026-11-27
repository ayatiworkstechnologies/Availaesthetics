
import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import TestimonialsEditor from "./testimonials-editor";

import {
  homepageTestimonials,
} from "@/lib/cms/homepage-trust-preview";

// =====================================
// TYPES
// =====================================

type TestimonialItem = {
  id: string;
  quote: string;
  author: string;
};

type TestimonialsContent = {
  heading: string;
  testimonials: TestimonialItem[];
};

type TestimonialsAdminResponse = {
  scope: "global";
  draft_content: TestimonialsContent | null;
  published_content: TestimonialsContent | null;
  draft_version: number;
  published_version: number;
  updated_at: string | null;
  published_at: string | null;
};

// =====================================
// FETCH AUTHENTICATED CMS DATA
// =====================================

async function getTestimonialsData():
  Promise<TestimonialsAdminResponse> {

  const session = (await cookies()).get(
    "avail_admin_session"
  )?.value;

  if (!session) {
    redirect("/admin/login");
  }

  const apiUrl = process.env.API_BASE_URL;

  if (!apiUrl) {
    throw new Error(
      "API_BASE_URL is not configured"
    );
  }

  const response = await fetch(
    `${apiUrl.replace(/\/+$/, "")}/api/v1/admin/homepage/testimonials`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Cookie: `avail_admin_session=${session}`,
      },
    }
  );

  if (response.status === 401) {
    redirect("/admin/login");
  }

  if (response.status === 403) {
    notFound();
  }

  if (!response.ok) {
    throw new Error(
      `Unable to load Testimonials CMS: ${response.status}`
    );
  }

  return (
    await response.json()
  ) as TestimonialsAdminResponse;
}

// =====================================
// TESTIMONIALS CMS CONTENT
// =====================================

async function TestimonialsAdminContent() {
  const data = await getTestimonialsData();

  // Preview content is only an initial editor seed.
  // It is never published automatically.
  const previewContent: TestimonialsContent = {
    heading: "Real Stories. Remarkable Results.",
    testimonials: homepageTestimonials.map(
      (testimonial) => ({
        id: String(testimonial.id),
        quote: testimonial.quote ?? "",
        author: testimonial.author ?? "",
      })
    ),
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <Link
        href="/admin/dashboard"
        className="text-sm font-medium text-[#0B253B] underline"
      >
        Back to Dashboard
      </Link>

      <div className="mt-8">
        <p className="text-sm text-stone-500">
          Avail Aesthetics MD / Global CMS
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-[#0B253B]">
          Testimonials Management
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
          Manage the Testimonials section heading,
          client reviews, author names and display
          order. Changes appear on the public website
          only after publishing.
        </p>
      </div>

      <TestimonialsEditor
        initialData={data}
        previewContent={previewContent}
      />
    </div>
  );
}

// =====================================
// PAGE
// =====================================

export default function TestimonialsAdminPage() {
  return (
    <main className="min-h-screen bg-[#F7F5F1]">
      <Suspense
        fallback={
          <div
            role="status"
            className="mx-auto max-w-6xl p-10 text-stone-600"
          >
            Loading Testimonials CMS...
          </div>
        }
      >
        <TestimonialsAdminContent />
      </Suspense>
    </main>
  );
}
