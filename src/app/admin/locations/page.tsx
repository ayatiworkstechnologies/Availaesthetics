
import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type Location = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  publication_status: string;
  created_at: string;
};

async function LocationsContent() {
  // 1. Verify administrator session
  const session = (await cookies()).get(
    "avail_admin_session"
  )?.value;

  if (!session) {
    redirect("/admin/login");
  }

  // 2. FastAPI configuration
  const apiUrl =
    process.env.API_BASE_URL ??
    "http://127.0.0.1:8000";

  // 3. Retrieve clinic locations
  const response = await fetch(
    `${apiUrl}/api/v1/admin/locations`,
    {
      headers: {
        Cookie: `avail_admin_session=${session}`,
      },
      cache: "no-store",
    }
  );

  // 4. Handle authentication and permissions
  if (response.status === 401) {
    redirect("/admin/login");
  }

  if (response.status === 403) {
    return (
      <main className="min-h-screen bg-[#F7F5F1] p-10">
        <p className="text-sm text-red-700">
          Access denied. Super Admin permission required.
        </p>
      </main>
    );
  }

  if (!response.ok) {
    throw new Error("Unable to load clinic locations");
  }

  const locations: Location[] = await response.json();

  return (
    <main className="min-h-screen bg-[#F7F5F1] px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Back Navigation */}
        <Link
          href="/admin/dashboard"
          className="text-sm text-stone-500 transition hover:text-stone-900"
        >
          ← Back to Dashboard
        </Link>

        {/* Page Header */}
        <header className="mt-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm text-stone-500">
              Avail Aesthetics MD / Administration
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">
              Clinic Locations
            </h1>

            <p className="mt-2 text-sm text-stone-500">
              Manage clinic details, configuration,
              operating hours and publishing readiness.
            </p>
          </div>

          <Link
            href="/admin/locations/new"
            className="inline-flex items-center justify-center rounded-lg bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            + Add Clinic
          </Link>
        </header>

        {/* Locations Listing */}
        <section className="mt-10 overflow-hidden rounded-2xl border border-stone-200 bg-white">

          <div className="border-b border-stone-200 p-6">
            <h2 className="font-semibold text-stone-900">
              All Locations ({locations.length})
            </h2>
          </div>

          {locations.length === 0 ? (
            // Empty State
            <div className="px-6 py-16 text-center">
              <h3 className="text-lg font-semibold text-stone-900">
                No clinic locations yet
              </h3>

              <p className="mt-2 text-sm text-stone-500">
                Locations created by the Super Admin
                will appear here.
              </p>

              <Link
                href="/admin/locations/new"
                className="mt-5 inline-flex rounded-lg bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
              >
                + Add Your First Clinic
              </Link>
            </div>
          ) : (
            // Locations Table
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">

                <thead className="bg-stone-50 text-stone-500">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-medium">
                      Clinic
                    </th>

                    <th scope="col" className="px-6 py-4 font-medium">
                      Slug
                    </th>

                    <th scope="col" className="px-6 py-4 font-medium">
                      Publication
                    </th>

                    <th scope="col" className="px-6 py-4 font-medium">
                      Active
                    </th>

                    <th scope="col" className="px-6 py-4 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100">
                  {locations.map((location) => {
                    const isDraft =
                      location.publication_status === "draft";

                    return (
                      <tr
                        key={location.id}
                        className="transition hover:bg-stone-50/70"
                      >

                        {/* Clinic Name */}
                        <td className="px-6 py-4 font-medium text-stone-900">
                          {location.name}
                        </td>

                        {/* Slug */}
                        <td className="px-6 py-4 text-stone-500">
                          {location.slug}
                        </td>

                        {/* Publication Status */}
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-medium capitalize text-stone-700">
                            {location.publication_status}
                          </span>
                        </td>

                        {/* Active Status */}
                        <td className="px-6 py-4 text-stone-600">
                          {location.is_active ? "Yes" : "No"}
                        </td>

                        {/* Management Actions */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-2">

                            {/* Edit Basic Clinic Details */}
                            {isDraft ? (
                              <Link
                                href={`/admin/locations/${location.id}/edit`}
                                className="inline-flex items-center justify-center rounded-lg border border-stone-300 px-4 py-2 text-xs font-medium text-stone-800 transition hover:bg-stone-100"
                              >
                                Edit
                              </Link>
                            ) : (
                              <span className="text-xs text-stone-400">
                                Editing unavailable
                              </span>
                            )}

                            {/* Address, Contact and SEO */}
                            <Link
                              href={`/admin/locations/${location.id}/configure`}
                              className="inline-flex items-center justify-center rounded-lg border border-stone-300 px-4 py-2 text-xs font-medium text-stone-800 transition hover:bg-stone-100"
                            >
                              {isDraft
                                ? "Configure"
                                : "View Configuration"}
                            </Link>

                            {/* Weekly Operating Hours */}
                            <Link
                              href={`/admin/locations/${location.id}/operating-hours`}
                              className="inline-flex items-center justify-center rounded-lg border border-stone-300 px-4 py-2 text-xs font-medium text-stone-800 transition hover:bg-stone-100"
                            >
                              {isDraft
                                ? "Operating Hours"
                                : "View Hours"}
                            </Link>

                            {/* Publishing Readiness */}
                            <Link
                              href={`/admin/locations/${location.id}/publishing-readiness`}
                              className="inline-flex items-center justify-center rounded-lg bg-stone-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-stone-700"
                            >
                              Review Readiness
                            </Link>

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}

export default function AdminLocationsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F7F5F1] p-10">
          Loading clinic locations...
        </main>
      }
    >
      <LocationsContent />
    </Suspense>
  );
}
