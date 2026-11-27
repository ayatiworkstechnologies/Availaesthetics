
import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import SignatureEditor from "./signature-editor";

import {
  signatureCards,
} from "@/lib/cms/homepage-sections-preview";

type SignatureCard = {
  id: string;
  title: string;
  imageSrc: string | null;
  imageAlt: string;
  href: string | null;
};

type SignatureContent = {
  heading: string;
  cards: SignatureCard[];
};

type SignatureAdminResponse = {
  scope: "global";
  draft_content: SignatureContent | null;
  published_content: SignatureContent | null;
  draft_version: number;
  published_version: number;
  updated_at: string | null;
  published_at: string | null;
};

// =====================================
// READ SUPER ADMIN CMS DATA
// =====================================

async function getSignatureData():
  Promise<SignatureAdminResponse> {

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
    `${apiUrl.replace(/\/+$/, "")}/api/v1/admin/homepage/signature`,
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
      `Unable to load Signature CMS: ${response.status}`
    );
  }

  return (await response.json()) as SignatureAdminResponse;
}

// =====================================
// AUTHENTICATED SIGNATURE CMS
// =====================================

async function SignatureAdminContent() {
  const data = await getSignatureData();

  // Existing design data is used only to
  // initialize a brand-new CMS editor.
  // It is NOT published automatically.
  const previewContent: SignatureContent = {
    heading: "Signature Aesthetics",
    cards: signatureCards.map((card) => ({
      id: String(card.id),
      title: card.title,
      imageSrc: card.imageSrc ?? null,
      imageAlt: card.imageAlt ?? "",
      href: card.href ?? null,
    })),
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
          Signature Aesthetics Management
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
          Manage Signature Aesthetics treatment
          cards, images, destination links and
          display order. Changes appear on the
          public homepage only after publishing.
        </p>
      </div>

      <SignatureEditor
        initialData={data}
        previewContent={previewContent}
      />
    </div>
  );
}

// =====================================
// PAGE
// =====================================

export default function SignatureAdminPage() {
  return (
    <main className="min-h-screen bg-[#F7F5F1]">
      <Suspense
        fallback={
          <div
            role="status"
            className="mx-auto max-w-6xl p-10 text-stone-600"
          >
            Loading Signature Aesthetics CMS...
          </div>
        }
      >
        <SignatureAdminContent />
      </Suspense>
    </main>
  );
}
