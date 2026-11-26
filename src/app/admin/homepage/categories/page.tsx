
import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import CategoriesEditor from "./categories-editor";

import {
  categoryCards,
  allTreatmentsHref,
} from "@/lib/cms/homepage-sections-preview";

type CategoryCard = {
  id: string;
  title: string;
  imageSrc: string | null;
  imageAlt: string;
  href: string | null;
};

type CategoriesContent = {
  cards: CategoryCard[];
  allTreatmentsHref: string | null;
};

type CategoriesAdminResponse = {
  scope: "global";
  draft_content: CategoriesContent | null;
  published_content: CategoriesContent | null;
  draft_version: number;
  published_version: number;
  updated_at: string | null;
  published_at: string | null;
};

// =====================================
// FETCH AUTHENTICATED CMS DATA
// =====================================

async function getCategoriesAdminData():
  Promise<CategoriesAdminResponse> {
  const session = (await cookies()).get(
    "avail_admin_session"
  )?.value;

  if (!session) {
    redirect("/admin/login");
  }

  const apiUrl = process.env.API_BASE_URL;

  if (!apiUrl) {
    throw new Error("API_BASE_URL is not configured");
  }

  const response = await fetch(
    `${apiUrl.replace(/\/+$/, "")}/api/v1/admin/homepage/categories`,
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
      `Unable to load categories: HTTP ${response.status}`
    );
  }

  return (await response.json()) as CategoriesAdminResponse;
}

// =====================================
// SERVER COMPONENT
// =====================================

async function CategoriesAdminContent() {
  const data = await getCategoriesAdminData();

  // Existing approved category content is
  // used only to initialize an empty editor.
  // It is NOT automatically published.
  const previewContent: CategoriesContent = {
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
          Explore by Category Management
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
          Manage homepage category cards, images,
          destination links and display order.
          Changes appear publicly only after publishing.
        </p>
      </div>

      <CategoriesEditor
        initialData={data}
        previewContent={previewContent}
      />
    </div>
  );
}

// =====================================
// ADMIN PAGE
// =====================================

export default function CategoriesAdminPage() {
  return (
    <main className="min-h-screen bg-[#F7F5F1]">
      <Suspense
        fallback={
          <div
            role="status"
            className="mx-auto max-w-6xl p-10 text-stone-600"
          >
            Loading Categories CMS...
          </div>
        }
      >
        <CategoriesAdminContent />
      </Suspense>
    </main>
  );
}
