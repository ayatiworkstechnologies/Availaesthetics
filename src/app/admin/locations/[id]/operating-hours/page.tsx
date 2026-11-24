
import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import OperatingHoursForm from "./operating-hours-form";
import type { OperatingHoursResponse } from "./operating-hours-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

type Location = {
  id: number;
  name: string;
  slug: string;
  publication_status: string;
  is_active: boolean;
};

async function OperatingHoursContent({
  params,
}: PageProps) {
  const { id } = await params;
  const locationId = Number(id);

  if (
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(locationId)
  ) {
    notFound();
  }

  const session = (await cookies()).get(
    "avail_admin_session"
  )?.value;

  if (!session) {
    redirect("/admin/login");
  }

  const apiUrl =
    process.env.API_BASE_URL ??
    "http://127.0.0.1:8000";

  const headers = {
    Cookie: `avail_admin_session=${session}`,
  };

  const [locationResponse, hoursResponse] =
    await Promise.all([
      fetch(
        `${apiUrl}/api/v1/admin/locations/${locationId}`,
        {
          headers,
          cache: "no-store",
        }
      ),
      fetch(
        `${apiUrl}/api/v1/admin/locations/${locationId}/operating-hours`,
        {
          headers,
          cache: "no-store",
        }
      ),
    ]);

  if (
    locationResponse.status === 401 ||
    hoursResponse.status === 401
  ) {
    redirect("/admin/login");
  }

  if (
    locationResponse.status === 403 ||
    hoursResponse.status === 403
  ) {
    return (
      <main className="p-10">
        Access denied. Super Admin permission required.
      </main>
    );
  }

  if (
    locationResponse.status === 404 ||
    hoursResponse.status === 404
  ) {
    notFound();
  }

  if (
    !locationResponse.ok ||
    !hoursResponse.ok
  ) {
    throw new Error("Unable to load operating hours");
  }

  const location: Location =
    await locationResponse.json();

  const hours: OperatingHoursResponse =
    await hoursResponse.json();

  const isDraft =
    location.publication_status === "draft";

  return (
    <main className="min-h-screen bg-[#F7F5F1] px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/locations"
          className="text-sm text-stone-500 hover:text-stone-900"
        >
          ← Back to Locations
        </Link>

        <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-stone-500">
              Avail Aesthetics MD / Administration
            </p>

            <h1 className="mt-3 text-3xl font-semibold text-stone-900">
              Operating Hours
            </h1>

            <p className="mt-2 text-sm text-stone-500">
              {location.name} — Weekly clinic schedule
            </p>
          </div>

          <span className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-medium capitalize text-stone-700">
            {location.publication_status}
          </span>
        </div>

        {!isDraft && (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Published clinic schedules are read-only
            until version-controlled editing is available.
          </div>
        )}

        <OperatingHoursForm
          locationId={location.id}
          initialHours={hours}
          readOnly={!isDraft}
        />
      </div>
    </main>
  );
}

export default function OperatingHoursPage(
  props: PageProps
) {
  return (
    <Suspense
      fallback={
        <main className="p-10">
          Loading operating hours...
        </main>
      }
    >
      <OperatingHoursContent {...props} />
    </Suspense>
  );
}
