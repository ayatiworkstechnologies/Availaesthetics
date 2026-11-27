
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  whyAvailArtworkSrc,
  whyAvailFeatures,
} from "@/lib/cms/homepage-trust-preview";

import WhyAvailEditor, {
  type WhyAvailAdminResponse,
  type WhyAvailContent,
} from "./why-avail-editor";

const API_BASE_URL = process.env.API_BASE_URL;

function getDefaultContent(): WhyAvailContent {
  return {
    heading: "Why Avail Aesthetics MD",
    imageSrc: whyAvailArtworkSrc || null,
    imageAlt: "Aesthetic skincare portrait",

    logoSrc: "/avail/brand/logo.svg",
    logoAlt: "Avail Aesthetics MD",

    othersHeading: "Others",
    consultationLabel: "Book Your Consultation",

    features: whyAvailFeatures.map((feature) => ({
      id: String(feature.id),
      label: feature.label,
      avail: feature.avail,
      others: feature.others,
    })),
  };
}

async function WhyAvailEditorContent() {
  const cookieStore = await cookies();

  const session = cookieStore.get(
    "avail_admin_session"
  )?.value;

  if (!session) {
    redirect("/admin/login");
  }

  if (!API_BASE_URL) {
    throw new Error(
      "API_BASE_URL is not configured."
    );
  }

  const response = await fetch(
    `${API_BASE_URL.replace(/\/+$/, "")}/api/v1/admin/homepage/why-avail`,
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
    redirect("/admin/dashboard");
  }

  if (!response.ok) {
    throw new Error(
      `Unable to load Why Avail CMS (HTTP ${response.status}).`
    );
  }

  const data =
    (await response.json()) as WhyAvailAdminResponse;

  const initialContent =
    data.draft_content ??
    data.published_content ??
    getDefaultContent();

  return (
    <WhyAvailEditor
      initialContent={initialContent}
      initialDraftVersion={data.draft_version}
      initialPublishedVersion={
        data.published_version
      }
    />
  );
}

export default function WhyAvailAdminPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          Loading Why Avail CMS...
        </main>
      }
    >
      <WhyAvailEditorContent />
    </Suspense>
  );
}
