
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import HeroEditorForm from "./hero-editor-form";

// =====================================
// TYPES
// =====================================

type Admin = {
  id: number;
  full_name: string;
  email: string;
  role: string;
};

type HeroContent = {
  heading: string;
  description: string;
  imageSrc: string;
  mobileImageSrc: string | null;
  imageAlt: string;
  consultationUrl: string | null;
  consultationLabel: string;
  eligibilityText: string;
};

type HeroAdminResponse = {
  scope: "global";
  draft_content: HeroContent | null;
  published_content: HeroContent | null;
  draft_version: number;
  published_version: number;
  updated_at: string | null;
  published_at: string | null;
};

// =====================================
// ACCESS DENIED COMPONENT
// =====================================

function AccessDenied() {
  return (
    <main className="min-h-screen bg-[#F7F5F1] p-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-stone-900">
          Access denied
        </h1>

        <p className="mt-3 text-stone-600">
          Super Admin permission is required to
          manage the global homepage.
        </p>

        <Link
          href="/admin/dashboard"
          className="mt-6 inline-block text-sm font-medium text-stone-900 underline"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}

// =====================================
// HERO PREVIEW COMPONENT
// =====================================

function HeroPreview({
  title,
  content,
}: {
  title: string;
  content: HeroContent | null;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-stone-900">
        {title}
      </h2>

      {!content ? (
        <p className="mt-5 text-sm text-stone-500">
          No Hero content available.
        </p>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-2">

          {/* =====================================
              BANNER IMAGE PREVIEWS
          ===================================== */}

          <div>
            {/* Desktop Banner */}
            <p className="mb-3 text-sm font-medium text-stone-600">
              Desktop Banner
            </p>

            <div className="relative aspect-video overflow-hidden rounded-xl bg-stone-100">
              <Image
                src={content.imageSrc}
                alt={content.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            {/* Mobile Banner */}
            {content.mobileImageSrc && (
              <div className="mt-6">
                <p className="mb-3 text-sm font-medium text-stone-600">
                  Mobile Banner
                </p>

                <div className="relative aspect-[3/4] w-40 overflow-hidden rounded-xl bg-stone-100">
                  <Image
                    src={content.mobileImageSrc}
                    alt={content.imageAlt}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* =====================================
              HERO CONTENT PREVIEW
          ===================================== */}

          <div className="space-y-5">

            {/* Heading */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
                Heading
              </p>

              <p className="mt-2 whitespace-pre-line break-words text-2xl font-semibold text-stone-900">
                {content.heading}
              </p>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
                Description
              </p>

              <p className="mt-2 text-sm leading-7 text-stone-700">
                {content.description}
              </p>
            </div>

            {/* Consultation Button */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
                Consultation Button
              </p>

              <p className="mt-2 text-sm text-stone-800">
                {content.consultationLabel}
              </p>

              <p className="mt-1 break-all text-xs text-stone-500">
                {content.consultationUrl ??
                  "No link configured"}
              </p>
            </div>

            {/* Eligibility Text */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
                Eligibility Text
              </p>

              <p className="mt-2 text-sm text-stone-800">
                {content.eligibilityText}
              </p>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}

// =====================================
// AUTHENTICATED HOMEPAGE HERO CMS
// =====================================

async function HomepageHeroContent() {
  // ---------------------------------
  // 1. Read authenticated session
  // ---------------------------------

  const session = (await cookies()).get(
    "avail_admin_session"
  )?.value;

  if (!session) {
    redirect("/admin/login");
  }

  // ---------------------------------
  // 2. Read backend URL from .env.local
  // ---------------------------------

  const apiUrl = process.env.API_BASE_URL;

  if (!apiUrl) {
    throw new Error(
      "API_BASE_URL is not configured in .env.local"
    );
  }

  // Forward existing session to FastAPI.
  const headers = {
    Cookie: `avail_admin_session=${session}`,
  };

  // ---------------------------------
  // 3. Fetch admin and CMS data
  // ---------------------------------

  const [adminResponse, heroResponse] =
    await Promise.all([
      fetch(`${apiUrl}/api/v1/auth/me`, {
        headers,
        cache: "no-store",
      }),

      fetch(
        `${apiUrl}/api/v1/admin/homepage/hero`,
        {
          headers,
          cache: "no-store",
        }
      ),
    ]);

  // ---------------------------------
  // 4. Check authentication
  // ---------------------------------

  if (
    adminResponse.status === 401 ||
    heroResponse.status === 401
  ) {
    redirect("/admin/login");
  }

  // ---------------------------------
  // 5. Check Super Admin permission
  // ---------------------------------

  if (
    adminResponse.status === 403 ||
    heroResponse.status === 403
  ) {
    return <AccessDenied />;
  }

  if (!adminResponse.ok || !heroResponse.ok) {
    throw new Error(
      "Unable to load Homepage Hero CMS"
    );
  }

  const admin: Admin =
    await adminResponse.json();

  const hero: HeroAdminResponse =
    await heroResponse.json();

  if (admin.role !== "super_admin") {
    return <AccessDenied />;
  }

  // ---------------------------------
  // 6. Determine publication status
  // ---------------------------------

  const isPublished =
    hero.published_content !== null;

  const hasUnpublishedChanges =
    hero.draft_content !== null &&
    (
      !isPublished ||
      hero.draft_version > hero.published_version
    );

  const publicationStatus = !isPublished
    ? "Not Published"
    : hasUnpublishedChanges
      ? "Published — New Draft Pending"
      : "Published";

  // ---------------------------------
  // 7. Render Homepage Hero CMS
  // ---------------------------------

  return (
    <main className="min-h-screen bg-[#F7F5F1] px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* =====================================
            BREADCRUMB
        ===================================== */}

        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-sm text-stone-500"
        >
          <Link
            href="/admin/dashboard"
            className="transition hover:text-stone-900"
          >
            Dashboard
          </Link>

          <span aria-hidden="true">/</span>
          <span>Homepage</span>
          <span aria-hidden="true">/</span>

          <span
            aria-current="page"
            className="font-medium text-stone-900"
          >
            Hero
          </span>
        </nav>

        {/* =====================================
            PAGE HEADER
        ===================================== */}

        <div className="mt-8">
          <p className="text-sm font-medium text-stone-500">
            Avail Aesthetics MD / Global CMS
          </p>

          <h1 className="mt-3 text-3xl font-semibold text-stone-900">
            Homepage Hero Management
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
            Manage the global homepage banner.
            Edit content, save drafts, review changes,
            and publish approved Hero content.
          </p>
        </div>

        {/* =====================================
            PUBLICATION STATUS CARDS
        ===================================== */}

        <div className="mt-10 grid gap-5 sm:grid-cols-3">

          {/* Draft Version */}
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <p className="text-sm text-stone-500">
              Draft Version
            </p>

            <p className="mt-3 text-3xl font-semibold text-stone-900">
              {hero.draft_version}
            </p>
          </div>

          {/* Published Version */}
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <p className="text-sm text-stone-500">
              Published Version
            </p>

            <p className="mt-3 text-3xl font-semibold text-stone-900">
              {hero.published_version}
            </p>
          </div>

          {/* Publication Status */}
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <p className="text-sm text-stone-500">
              Publication Status
            </p>

            <p
              className={
                "mt-3 text-base font-semibold " +
                (hasUnpublishedChanges
                  ? "text-amber-700"
                  : isPublished
                    ? "text-emerald-700"
                    : "text-stone-900")
              }
            >
              {publicationStatus}
            </p>
          </div>
        </div>

        {/* =====================================
            EDIT HERO + SAVE + PUBLISH
        ===================================== */}

        <div className="mt-8">
          <HeroEditorForm
            initialContent={
              hero.draft_content ??
              hero.published_content
            }
            initialDraftVersion={
              hero.draft_version
            }
            initialPublishedVersion={
              hero.published_version
            }
          />
        </div>

        {/* =====================================
            CURRENT DRAFT PREVIEW
        ===================================== */}

        <div className="mt-8">
          <HeroPreview
            title="Current Draft"
            content={hero.draft_content}
          />
        </div>

        {/* =====================================
            PUBLISHED HERO PREVIEW
        ===================================== */}

        <div className="mt-6">
          <HeroPreview
            title="Published Homepage Hero"
            content={hero.published_content}
          />
        </div>

        {/* =====================================
            PUBLISHING INFORMATION
        ===================================== */}

        <section className="mt-8 rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-stone-900">
            How Homepage Publishing Works
          </h2>

          <p className="mt-2 text-sm leading-7 text-stone-600">
            Changes made in the editor must be saved
            as a draft first. Saving a draft does not
            affect currently published content.
            When the draft is ready, select
            {" "}Publish Hero and confirm publication.
            The published version is then available
            through the public Homepage Hero API.
          </p>

          {hasUnpublishedChanges && (
            <p className="mt-3 text-sm font-medium text-amber-700">
              A newer draft is available and has
              not yet been published.
            </p>
          )}

          {isPublished && !hasUnpublishedChanges && (
            <p className="mt-3 text-sm font-medium text-emerald-700">
              The latest saved draft is published.
            </p>
          )}
        </section>

      </div>
    </main>
  );
}

// =====================================
// PAGE EXPORT
// =====================================

export default function HomepageHeroAdminPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F7F5F1] p-10">
          <p className="text-stone-600">
            Loading Homepage Hero CMS...
          </p>
        </main>
      }
    >
      <HomepageHeroContent />
    </Suspense>
  );
}
