
import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import EditLocationForm from "./edit-form";
import type { LocationRecord } from "./edit-form";


type PageProps = {
  params: Promise<{ id: string }>;
};


async function EditLocationContent({
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

  // Check authentication cookie
  const session = (await cookies()).get(
    "avail_admin_session"
  )?.value;

  if (!session) {
    redirect("/admin/login");
  }

  const apiUrl =
    process.env.API_BASE_URL ??
    "http://127.0.0.1:8000";

  // Get the clinic details from FastAPI
  const response = await fetch(
    `${apiUrl}/api/v1/admin/locations/${locationId}`,
    {
      headers: {
        Cookie: `avail_admin_session=${session}`,
      },
      cache: "no-store",
    }
  );

  if (response.status === 401) {
    redirect("/admin/login");
  }

  if (response.status === 403) {
    return (
      <main className="p-10">
        Access denied. Super Admin permission required.
      </main>
    );
  }

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error("Unable to load clinic details");
  }

  const location: LocationRecord =
    await response.json();

  return (
    <main className="min-h-screen bg-[#F7F5F1] px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/admin/locations"
          className="text-sm text-stone-500 hover:text-stone-900"
        >
          ← Back to Locations
        </Link>

        <div className="mt-8">
          <p className="text-sm text-stone-500">
            Avail Aesthetics MD / Administration
          </p>

          <h1 className="mt-3 text-3xl font-semibold text-stone-900">
            Edit Clinic
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            Update the details of {location.name}.
          </p>
        </div>

        {location.publication_status !== "draft" ? (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-medium text-amber-900">
              This clinic is not a draft.
            </p>

            <p className="mt-2 text-sm text-amber-800">
              Editing published locations will be available
              after we implement content versioning.
            </p>
          </div>
        ) : (
          <EditLocationForm location={location} />
        )}
      </div>
    </main>
  );
}


export default function EditLocationPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="p-10">
          Loading clinic details...
        </main>
      }
    >
      <EditLocationContent {...props} />
    </Suspense>
  );
}
