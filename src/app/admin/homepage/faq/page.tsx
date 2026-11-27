
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import FaqEditor, {
  type FaqCmsResponse,
} from "./faq-editor";

const SESSION_COOKIE = "avail_admin_session";

// =====================================
// BACKEND FETCH HELPER
// =====================================

async function fetchAdminApi(
  path: string,
  session: string
): Promise<Response> {
  const apiBaseUrl = process.env.API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error(
      "API_BASE_URL is not configured."
    );
  }

  return fetch(
    `${apiBaseUrl.replace(/\/+$/, "")}${path}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Cookie: `${SESSION_COOKIE}=${session}`,
      },
    }
  );
}

// =====================================
// FAQ CMS SUPER ADMIN PAGE
// =====================================

async function AdminHomepageFaqContent() {
  await connection();

  // ---------------------------------
  // 1. Read existing HttpOnly session
  // ---------------------------------

  const cookieStore = await cookies();

  const session = cookieStore.get(
    SESSION_COOKIE
  )?.value;

  if (!session) {
    redirect("/admin/login");
  }

  // ---------------------------------
  // 2. Authenticate administrator
  // ---------------------------------

  const authResponse = await fetchAdminApi(
    "/api/v1/auth/me",
    session
  );

  if (
    authResponse.status === 401 ||
    authResponse.status === 403
  ) {
    redirect("/admin/login");
  }

  if (!authResponse.ok) {
    throw new Error(
      `Unable to verify administrator: HTTP ${authResponse.status}`
    );
  }

  const admin: unknown = await authResponse.json();

  if (
    !admin ||
    typeof admin !== "object" ||
    Array.isArray(admin)
  ) {
    throw new Error(
      "Invalid administrator response."
    );
  }

  const adminData = admin as Record<
    string,
    unknown
  >;

  // Must match existing backend role naming.
  if (adminData.role !== "super_admin") {
    redirect("/admin/dashboard");
  }

  // ---------------------------------
  // 3. Retrieve saved FAQ CMS content
  // ---------------------------------

  const faqResponse = await fetchAdminApi(
    "/api/v1/admin/homepage/faq",
    session
  );

  if (faqResponse.status === 401) {
    redirect("/admin/login");
  }

  if (faqResponse.status === 403) {
    redirect("/admin/dashboard");
  }

  if (!faqResponse.ok) {
    throw new Error(
      `Unable to load Homepage FAQ CMS: HTTP ${faqResponse.status}`
    );
  }

  const faqData =
    (await faqResponse.json()) as FaqCmsResponse;

  // ---------------------------------
  // 4. Render editor
  // ---------------------------------

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <a
            href="/admin/dashboard"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            ← Back to Dashboard
          </a>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Super Admin · Homepage CMS
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Homepage FAQ Management
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Manage the FAQ section heading, questions,
            answers and display order. Save your changes
            as a draft before publishing them to the
            public homepage.
          </p>
        </div>

        <FaqEditor initialData={faqData} />
      </div>
    </main>
  );
}

export default function AdminHomepageFaqPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 p-8">
          <div
            role="status"
            className="mx-auto max-w-6xl text-sm text-slate-600"
          >
            Loading Homepage FAQ CMS...
          </div>
        </main>
      }
    >
      <AdminHomepageFaqContent />
    </Suspense>
  );
}
