
import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import LocationsEditor from "./locations-editor";
import {
  homepageLocations,
  type HomepageLocation,
} from "@/lib/cms/homepage-locations-preview";

type HomepageLocationsContent = {
  heading: string;
  description: string;
  locations: HomepageLocation[];
  defaultSelectedLocationId: string | null;
};

type HomepageLocationsAdminResponse = {
  scope: "global";
  draft_content: HomepageLocationsContent | null;
  published_content: HomepageLocationsContent | null;
  draft_version: number;
  published_version: number;
  updated_at: string | null;
  published_at: string | null;
};

type AdminProfile = {
  id: number;
  role: string;
};

async function HomepageLocationsContent() {
  // This authenticated CMS must render for each request.
  // It also prevents client-generated IDs from being
  // evaluated during Cache Components prerendering.
  await connection();

  // --------------------------------------
  // 1. Existing admin session
  // --------------------------------------

  const session = (await cookies()).get(
    "avail_admin_session"
  )?.value;

  if (!session) {
    redirect("/admin/login");
  }

  // --------------------------------------
  // 2. Backend URL
  // --------------------------------------

  const apiBaseUrl = process.env.API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error(
      "API_BASE_URL is not configured."
    );
  }

  const headers = {
    Cookie: `avail_admin_session=${session}`,
  };

  // --------------------------------------
  // 3. Load admin and CMS settings
  // --------------------------------------

  const [adminResponse, cmsResponse] =
    await Promise.all([
      fetch(
        `${apiBaseUrl}/api/v1/auth/me`,
        {
          headers,
          cache: "no-store",
        }
      ),
      fetch(
        `${apiBaseUrl}/api/v1/admin/homepage/locations`,
        {
          headers,
          cache: "no-store",
        }
      ),
    ]);

  // --------------------------------------
  // 4. Authentication
  // --------------------------------------

  if (
    adminResponse.status === 401 ||
    cmsResponse.status === 401
  ) {
    redirect("/admin/login");
  }

  if (
    adminResponse.status === 403 ||
    cmsResponse.status === 403
  ) {
    return (
      <main className="min-h-screen bg-[#F7F5F1] p-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-white p-8">
          <h1 className="text-xl font-semibold text-stone-900">
            Access denied
          </h1>
          <p className="mt-3 text-sm text-stone-600">
            Only Super Admin can manage global
            homepage locations.
          </p>
          <Link
            href="/admin/dashboard"
            className="mt-5 inline-block text-sm font-medium text-[#356B63]"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (!adminResponse.ok || !cmsResponse.ok) {
    throw new Error(
      "Unable to load Homepage Locations CMS."
    );
  }

  const admin =
    (await adminResponse.json()) as AdminProfile;

  if (admin.role !== "super_admin") {
    return (
      <main className="min-h-screen bg-[#F7F5F1] p-8">
        <p className="text-red-700">
          Super Admin access required.
        </p>
      </main>
    );
  }

  const cms =
    (await cmsResponse.json()) as HomepageLocationsAdminResponse;

  // --------------------------------------
  // 5. Render editor
  // --------------------------------------

  return (
    <main className="min-h-screen bg-[#F7F5F1] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <nav className="flex flex-wrap gap-2 text-sm text-stone-500">
          <Link
            href="/admin/dashboard"
            className="hover:text-stone-900"
          >
            Dashboard
          </Link>

          <span>/</span>
          <span>Homepage</span>
          <span>/</span>

          <span className="font-medium text-stone-900">
            Our Locations
          </span>
        </nav>

        <div className="mt-8">
          <p className="text-sm font-medium text-stone-500">
            Avail Aesthetics MD / Global CMS
          </p>

          <h1 className="mt-3 text-3xl font-semibold text-stone-900">
            Our Locations Management
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
            Manage the homepage section heading,
            description, clinic selection, card order
            and default Google Map location.
          </p>
        </div>

        <LocationsEditor
          initialContent={
            cms.draft_content ??
            cms.published_content ?? {
              heading: "Our Locations",
              description:
                "One Avail Aesthetics MD, two clinics across Greater Houston. Each clinic offers personalized aesthetic and wellness treatments with its own team, services, and booking options.",
              locations: homepageLocations,
              defaultSelectedLocationId: "katy",
            }
          }
          initialDraftVersion={
            cms.draft_version
          }
          initialPublishedVersion={
            cms.published_version
          }
          initialHasPublishedContent={
            cms.published_content !== null
          }
        />
      </div>
    </main>
  );
}

export default function HomepageLocationsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F7F5F1] p-8">
          <div
            role="status"
            className="mx-auto max-w-6xl text-sm text-stone-600"
          >
            Loading Our Locations CMS...
          </div>
        </main>
      }
    >
      <HomepageLocationsContent />
    </Suspense>
  );
}
