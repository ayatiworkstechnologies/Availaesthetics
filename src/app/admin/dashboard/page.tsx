
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./logout-button";

// Admin user information
type Admin = {
  id: number;
  full_name: string;
  email: string;
  role: string;
};

// Dashboard statistics
type Summary = {
  total_locations: number;
  published_locations: number;
  draft_locations: number;
  total_location_admins: number;
};

async function DashboardContent() {
  // Step 1: Read the admin session cookie
  const session = (await cookies()).get(
    "avail_admin_session"
  )?.value;

  // Redirect unauthenticated users to login
  if (!session) {
    redirect("/admin/login");
  }

  // Step 2: Backend API configuration
  const apiUrl =
    process.env.API_BASE_URL ?? "http://127.0.0.1:8000";

  const headers = {
    Cookie: `avail_admin_session=${session}`,
  };

  // Step 3: Fetch admin profile and dashboard statistics
  const [adminResponse, summaryResponse] = await Promise.all([
    fetch(`${apiUrl}/api/v1/auth/me`, {
      headers,
      cache: "no-store",
    }),

    fetch(`${apiUrl}/api/v1/admin/dashboard/summary`, {
      headers,
      cache: "no-store",
    }),
  ]);

  // Step 4: Verify authentication
  if (
    adminResponse.status === 401 ||
    summaryResponse.status === 401
  ) {
    redirect("/admin/login");
  }

  // Step 5: Verify Super Admin permission
  if (
    adminResponse.status === 403 ||
    summaryResponse.status === 403
  ) {
    return (
      <main className="p-10">
        Access denied. Super Admin permission required.
      </main>
    );
  }

  if (!adminResponse.ok || !summaryResponse.ok) {
    throw new Error("Unable to load admin dashboard");
  }

  const admin: Admin = await adminResponse.json();
  const summary: Summary = await summaryResponse.json();

  if (admin.role !== "super_admin") {
    return (
      <main className="p-10">
        Access denied. Super Admin permission required.
      </main>
    );
  }

  // Step 6: Dashboard statistic cards
  const cards = [
    {
      title: "Total Locations",
      value: summary.total_locations,
    },
    {
      title: "Published",
      value: summary.published_locations,
    },
    {
      title: "Drafts",
      value: summary.draft_locations,
    },
    {
      title: "Location Admins",
      value: summary.total_location_admins,
    },
  ];

  return (
    <main className="min-h-screen bg-[#F7F5F1] px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Dashboard Header */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm text-stone-500">
              Avail Aesthetics MD / Administration
            </p>

            <h1 className="mt-3 text-3xl font-semibold text-stone-900">
              Welcome, {admin.full_name}
            </h1>

            <p className="mt-2 text-stone-500">
              Super Admin Dashboard
            </p>
          </div>

          {/* Logout Button */}
          <LogoutButton />
        </div>

        {/* Dashboard Statistics */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-stone-200 bg-white p-6"
            >
              <p className="text-sm text-stone-500">
                {card.title}
              </p>

              <p className="mt-4 text-3xl font-semibold text-stone-900">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Clinic Location Management */}
        <section className="mt-10 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-stone-900">
                Clinic Location Management
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                View and manage clinic locations, including their
                publication status and availability.
              </p>
            </div>

            <Link
              href="/admin/locations"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
            >
              Manage Locations
              <span aria-hidden="true" className="ml-2">
                →
              </span>
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="p-10">
          Loading dashboard...
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
