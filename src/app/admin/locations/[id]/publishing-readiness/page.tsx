
import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

type ReadinessCheck = {
  key: string;
  label: string;
  passed: boolean;
  message: string;
};

type PublishingReadiness = {
  location_id: number;
  location_name: string;
  publication_status: string;
  foundation_ready: boolean;
  can_publish: boolean;
  checks: ReadinessCheck[];
  pending_modules: string[];
};

async function ReadinessContent({
  params,
}: PageProps) {
  const { id } = await params;
  const locationId = Number(id);

  // Step 1: Validate clinic ID
  if (
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(locationId)
  ) {
    notFound();
  }

  // Step 2: Verify admin session
  const session = (await cookies()).get(
    "avail_admin_session"
  )?.value;

  if (!session) {
    redirect("/admin/login");
  }

  // Step 3: Backend API configuration
  const apiUrl =
    process.env.API_BASE_URL ??
    "http://127.0.0.1:8000";

  // Step 4: Fetch publishing readiness
  const response = await fetch(
    `${apiUrl}/api/v1/admin/locations/${locationId}/publishing-readiness`,
    {
      headers: {
        Cookie: `avail_admin_session=${session}`,
      },
      cache: "no-store",
    }
  );

  // Step 5: Handle authentication failure
  if (response.status === 401) {
    redirect("/admin/login");
  }

  if (response.status === 404) {
    notFound();
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

  // Step 6: Handle unexpected API failures
  if (!response.ok) {
    const errorBody = await response.text();

    console.error("Publishing Readiness API Error", {
      status: response.status,
      statusText: response.statusText,
      response: errorBody.slice(0, 500),
    });

    throw new Error(
      `Unable to load publishing readiness. HTTP ${response.status}`
    );
  }

  // Step 7: Parse successful response
  const readiness: PublishingReadiness =
    await response.json();

  const passedCount = readiness.checks.filter(
    (check) => check.passed
  ).length;

  const totalChecks = readiness.checks.length;

  const progressPercent =
    totalChecks > 0
      ? (passedCount / totalChecks) * 100
      : 0;

  return (
    <main className="min-h-screen bg-[#F7F5F1] px-5 py-10">
      <div className="mx-auto max-w-4xl">

        {/* Back Navigation */}
        <Link
          href="/admin/locations"
          className="text-sm text-stone-500 hover:text-stone-900"
        >
          ← Back to Locations
        </Link>

        {/* Page Header */}
        <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-stone-500">
              Avail Aesthetics MD / Administration
            </p>

            <h1 className="mt-3 text-3xl font-semibold text-stone-900">
              Publishing Readiness
            </h1>

            <p className="mt-2 text-sm text-stone-500">
              {readiness.location_name}
            </p>
          </div>

          <span className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-medium capitalize text-stone-700">
            {readiness.publication_status}
          </span>
        </div>

        {/* Foundation Readiness Summary */}
        <section className="mt-9 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-stone-900">
            Clinic Foundation Readiness
          </h2>

          <p className="mt-2 text-sm text-stone-500">
            Review the existing clinic configuration
            before preparing it for publication.
          </p>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-semibold text-stone-900">
                {passedCount} / {totalChecks}
              </p>

              <p className="mt-1 text-sm text-stone-500">
                Foundation checks passed
              </p>
            </div>

            <span className="rounded-full bg-stone-100 px-4 py-2 text-xs font-medium text-stone-800">
              {readiness.foundation_ready
                ? "Foundation Complete"
                : "Foundation Incomplete"}
            </span>
          </div>

          {/* Progress Bar */}
          <div
            className="mt-6 h-2.5 overflow-hidden rounded-full bg-stone-100"
            role="progressbar"
            aria-label="Foundation readiness"
            aria-valuemin={0}
            aria-valuemax={totalChecks}
            aria-valuenow={passedCount}
          >
            <div
              className="h-full rounded-full bg-stone-900 transition-all"
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>
        </section>

        {/* Configuration Checklist */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="border-b border-stone-200 p-6">
            <h2 className="font-semibold text-stone-900">
              Configuration Checklist
            </h2>
          </div>

          <div className="divide-y divide-stone-100">
            {readiness.checks.map((check) => (
              <div
                key={check.key}
                className="flex items-start gap-4 p-6"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    check.passed
                      ? "bg-stone-900 text-white"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {check.passed ? "✓" : "!"}
                </span>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-medium text-stone-900">
                      {check.label}
                    </h3>

                    <span className="text-xs font-medium text-stone-600">
                      {check.passed
                        ? "Passed"
                        : "Needs Attention"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-stone-500">
                    {check.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pending Publication Requirements */}
        <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-stone-900">
            Remaining Publication Requirements
          </h2>

          <p className="mt-2 text-sm text-stone-500">
            These requirements must be completed before
            the clinic can go live.
          </p>

          {readiness.pending_modules.length === 0 ? (
            <p className="mt-5 text-sm text-stone-600">
              No outstanding module requirements reported.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {readiness.pending_modules.map(
                (moduleName) => (
                  <li
                    key={moduleName}
                    className="flex items-start gap-3 text-sm text-stone-700"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-0.5 text-amber-700"
                    >
                      ○
                    </span>

                    <span>{moduleName}</span>
                  </li>
                )
              )}
            </ul>
          )}
        </section>

        {/* Publication Status */}
        <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="font-semibold text-stone-900">
            Publication Status
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-600">
            {readiness.can_publish
              ? "The readiness API reports that the clinic meets its current requirements. Publishing is handled separately."
              : "Publishing is not yet available. Complete the outstanding requirements before making this clinic public."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/admin/locations/${locationId}/configure`}
              className="rounded-lg border border-stone-300 px-5 py-3 text-sm font-medium text-stone-800 hover:bg-stone-50"
            >
              Clinic Configuration
            </Link>

            <Link
              href={`/admin/locations/${locationId}/operating-hours`}
              className="rounded-lg border border-stone-300 px-5 py-3 text-sm font-medium text-stone-800 hover:bg-stone-50"
            >
              Operating Hours
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}

export default function PublishingReadinessPage(
  props: PageProps
) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F7F5F1] p-10">
          Loading publishing readiness...
        </main>
      }
    >
      <ReadinessContent {...props} />
    </Suspense>
  );
}
