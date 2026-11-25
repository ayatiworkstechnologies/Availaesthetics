
"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

// =====================================
// TYPES
// =====================================

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

type FormValues = Omit<
  HeroContent,
  "mobileImageSrc" | "consultationUrl"
> & {
  mobileImageSrc: string;
  consultationUrl: string;
};

type HeroEditorFormProps = {
  initialContent: HeroContent | null;
  initialDraftVersion: number;
  initialPublishedVersion: number;
};

type Feedback = {
  kind: "success" | "error";
  message: string;
} | null;

type HeroActionResponse = {
  draft_version: number;
  published_version: number;
};

// =====================================
// INITIAL FORM VALUES
// =====================================

function buildInitialValues(
  content: HeroContent | null
): FormValues {
  return {
    heading: content?.heading ?? "",
    description: content?.description ?? "",
    imageSrc: content?.imageSrc ?? "",
    mobileImageSrc: content?.mobileImageSrc ?? "",
    imageAlt: content?.imageAlt ?? "",
    consultationUrl: content?.consultationUrl ?? "",
    consultationLabel: content?.consultationLabel ?? "",
    eligibilityText: content?.eligibilityText ?? "",
  };
}

// =====================================
// ERROR MESSAGE HELPER
// =====================================

function getErrorMessage(data: unknown): string {
  if (
    !data ||
    typeof data !== "object" ||
    !("detail" in data)
  ) {
    return "Unable to complete the request.";
  }

  const detail = data.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .filter(
        (item): item is { msg: string } =>
          item !== null &&
          typeof item === "object" &&
          "msg" in item &&
          typeof item.msg === "string"
      )
      .map((item) => item.msg);

    if (messages.length > 0) {
      return messages.join(". ");
    }
  }

  return "Unable to complete the request.";
}

// =====================================
// RESPONSE VALIDATION
// =====================================

function isHeroActionResponse(
  data: unknown
): data is HeroActionResponse {
  if (!data || typeof data !== "object") {
    return false;
  }

  if (
    !("draft_version" in data) ||
    !("published_version" in data)
  ) {
    return false;
  }

  return (
    typeof data.draft_version === "number" &&
    Number.isInteger(data.draft_version) &&
    typeof data.published_version === "number" &&
    Number.isInteger(data.published_version)
  );
}

// =====================================
// HOMEPAGE HERO EDITOR
// =====================================

export default function HeroEditorForm({
  initialContent,
  initialDraftVersion,
  initialPublishedVersion,
}: HeroEditorFormProps) {
  const router = useRouter();

  // Native accessible confirmation dialog.
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Editable fields.
  const [values, setValues] = useState<FormValues>(
    () => buildInitialValues(initialContent)
  );

  // Current draft revision.
  const [draftVersion, setDraftVersion] = useState(
    initialDraftVersion
  );

  // Current published revision.
  const [publishedVersion, setPublishedVersion] =
    useState(initialPublishedVersion);

  // Request states.
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Track edits not yet saved as a draft.
  const [isDirty, setIsDirty] = useState(false);

  // User feedback.
  const [feedback, setFeedback] =
    useState<Feedback>(null);

  const busy = saving || publishing;

  // A draft can be published only if:
  // - A newer draft version exists.
  // - All form edits have been saved.
  // - No other request is in progress.
  const hasPendingPublication =
    draftVersion > publishedVersion;

  const canPublish =
    hasPendingPublication &&
    !isDirty &&
    !busy;

  // =====================================
  // UPDATE FORM FIELD
  // =====================================

  function updateField(
    field: keyof FormValues,
    value: string
  ) {
    setValues((previous) => ({
      ...previous,
      [field]: value,
    }));

    setIsDirty(true);
    setFeedback(null);
  }

  // =====================================
  // SAVE DRAFT
  // =====================================

  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (busy) {
      return;
    }

    setSaving(true);
    setFeedback(null);

    // Build the Pydantic-compatible payload.
    const content: HeroContent = {
      heading: values.heading.trim(),
      description: values.description.trim(),
      imageSrc: values.imageSrc.trim(),

      mobileImageSrc:
        values.mobileImageSrc.trim() || null,

      imageAlt: values.imageAlt.trim(),

      consultationUrl:
        values.consultationUrl.trim() || null,

      consultationLabel:
        values.consultationLabel.trim(),

      eligibilityText:
        values.eligibilityText.trim(),
    };

    try {
      const response = await fetch(
        "/api/admin/homepage/hero/draft",
        {
          method: "PUT",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            expected_draft_version: draftVersion,
            content,
          }),
        }
      );

      const data: unknown = await response
        .json()
        .catch(() => null);

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        if (response.status === 409) {
          setFeedback({
            kind: "error",
            message:
              "The draft was changed elsewhere. " +
              "Reload the page and review the " +
              "latest version before saving.",
          });
          return;
        }

        setFeedback({
          kind: "error",
          message: getErrorMessage(data),
        });
        return;
      }

      if (!isHeroActionResponse(data)) {
        throw new Error("Unexpected API response");
      }

      // Update revision numbers.
      setDraftVersion(data.draft_version);
      setPublishedVersion(data.published_version);

      // Form now represents the saved draft.
      setValues(buildInitialValues(content));
      setIsDirty(false);

      setFeedback({
        kind: "success",
        message:
          `Draft version ${data.draft_version} saved. ` +
          "The published homepage is unchanged.",
      });

      // Refresh server-rendered CMS previews.
      router.refresh();

    } catch {
      setFeedback({
        kind: "error",
        message:
          "Unable to save the draft. " +
          "Please check your connection.",
      });

    } finally {
      setSaving(false);
    }
  }

  // =====================================
  // OPEN PUBLISH CONFIRMATION
  // =====================================

  function openPublishDialog() {
    if (!canPublish) {
      return;
    }

    dialogRef.current?.showModal();
  }

  // =====================================
  // PUBLISH HOMEPAGE HERO
  // =====================================

  async function handlePublish() {
    // Close the confirmation dialog.
    dialogRef.current?.close();

    if (!canPublish) {
      return;
    }

    setPublishing(true);
    setFeedback(null);

    try {
      const response = await fetch(
        "/api/admin/homepage/hero/publish",
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            expected_draft_version: draftVersion,
          }),
        }
      );

      const data: unknown = await response
        .json()
        .catch(() => null);

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        if (response.status === 409) {
          setFeedback({
            kind: "error",
            message:
              "The Hero could not be published. " +
              "The draft may have changed or " +
              "already been published. " +
              "Reload the page to review it.",
          });
          return;
        }

        setFeedback({
          kind: "error",
          message: getErrorMessage(data),
        });
        return;
      }

      if (!isHeroActionResponse(data)) {
        throw new Error("Unexpected API response");
      }

      // Keep local versions synchronized.
      setDraftVersion(data.draft_version);
      setPublishedVersion(data.published_version);

      setFeedback({
        kind: "success",
        message:
          `Homepage Hero version ` +
          `${data.published_version} published successfully.`,
      });

      // Refresh publication status and previews.
      router.refresh();

    } catch {
      setFeedback({
        kind: "error",
        message:
          "Unable to publish the Hero. " +
          "Please check your connection.",
      });

    } finally {
      setPublishing(false);
    }
  }

  // =====================================
  // INPUT STYLES
  // =====================================

  const inputClass =
    "mt-2 w-full rounded-lg border border-stone-300 " +
    "bg-white px-4 py-3 text-sm text-stone-900 " +
    "outline-none transition " +
    "focus:border-stone-700 focus:ring-2 " +
    "focus:ring-stone-200";

  const labelClass =
    "block text-sm font-medium text-stone-800";

  // =====================================
  // RENDER
  // =====================================

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">

      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">
            Edit Homepage Hero
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-500">
            Update the global homepage banner,
            save a draft, then publish the
            reviewed version.
          </p>
        </div>

        <span className="rounded-full bg-stone-100 px-4 py-2 text-xs font-medium text-stone-700">
          Draft v{draftVersion}
        </span>
      </div>

      {/* VERSION INFORMATION */}
      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full bg-stone-100 px-3 py-1.5 text-stone-700">
          Published v{publishedVersion}
        </span>

        {isDirty ? (
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-800">
            Unsaved Changes
          </span>
        ) : hasPendingPublication ? (
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-800">
            Ready to Publish
          </span>
        ) : publishedVersion > 0 ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-800">
            Up to Date
          </span>
        ) : (
          <span className="rounded-full bg-stone-100 px-3 py-1.5 text-stone-600">
            Not Published
          </span>
        )}
      </div>

      {/* EDITOR FORM */}
      <form onSubmit={handleSave} className="mt-8">
        <fieldset disabled={busy} className="space-y-7">

          {/* HEADING */}
          <div>
            <label
              htmlFor="hero-heading"
              className={labelClass}
            >
              Hero Heading
            </label>

            <textarea
              id="hero-heading"
              value={values.heading}
              onChange={(event) =>
                updateField(
                  "heading",
                  event.target.value
                )
              }
              rows={2}
              maxLength={160}
              required
              placeholder={"CONFIDENCE,\nREIMAGINED"}
              className={inputClass}
            />

            <p className="mt-2 text-xs text-stone-500">
              Line breaks are preserved.
            </p>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label
              htmlFor="hero-description"
              className={labelClass}
            >
              Hero Description
            </label>

            <textarea
              id="hero-description"
              value={values.description}
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value
                )
              }
              rows={4}
              maxLength={2000}
              required
              className={inputClass}
            />
          </div>

          {/* IMAGE PATHS */}
          <div className="grid gap-6 md:grid-cols-2">

            <div>
              <label
                htmlFor="hero-desktop-image"
                className={labelClass}
              >
                Desktop Banner Path
              </label>

              <input
                id="hero-desktop-image"
                type="text"
                value={values.imageSrc}
                onChange={(event) =>
                  updateField(
                    "imageSrc",
                    event.target.value
                  )
                }
                placeholder="/avail/home/hero.png"
                maxLength={1024}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="hero-mobile-image"
                className={labelClass}
              >
                Mobile Banner Path
              </label>

              <input
                id="hero-mobile-image"
                type="text"
                value={values.mobileImageSrc}
                onChange={(event) =>
                  updateField(
                    "mobileImageSrc",
                    event.target.value
                  )
                }
                placeholder="/avail/home/hero-mobile.png"
                maxLength={1024}
                className={inputClass}
              />
            </div>

          </div>

          <p className="text-xs leading-5 text-stone-500">
            Use existing image paths from the
            Next.js public folder. Media uploads
            will be implemented separately.
          </p>

          {/* IMAGE ALT TEXT */}
          <div>
            <label
              htmlFor="hero-image-alt"
              className={labelClass}
            >
              Image Alt Text
            </label>

            <input
              id="hero-image-alt"
              type="text"
              value={values.imageAlt}
              onChange={(event) =>
                updateField(
                  "imageAlt",
                  event.target.value
                )
              }
              maxLength={250}
              required
              className={inputClass}
            />
          </div>

          {/* CONSULTATION FIELDS */}
          <div className="grid gap-6 md:grid-cols-2">

            <div>
              <label
                htmlFor="hero-cta-label"
                className={labelClass}
              >
                Consultation Button Label
              </label>

              <input
                id="hero-cta-label"
                type="text"
                value={values.consultationLabel}
                onChange={(event) =>
                  updateField(
                    "consultationLabel",
                    event.target.value
                  )
                }
                maxLength={100}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="hero-cta-url"
                className={labelClass}
              >
                Consultation URL
              </label>

              <input
                id="hero-cta-url"
                type="url"
                value={values.consultationUrl}
                onChange={(event) =>
                  updateField(
                    "consultationUrl",
                    event.target.value
                  )
                }
                placeholder="https://example.com/book"
                maxLength={2048}
                pattern="https://.*"
                title="Enter a valid HTTPS URL"
                className={inputClass}
              />

              <p className="mt-2 text-xs text-stone-500">
                Optional approved external booking URL.
              </p>
            </div>

          </div>

          {/* ELIGIBILITY TEXT */}
          <div>
            <label
              htmlFor="hero-eligibility"
              className={labelClass}
            >
              Eligibility Text
            </label>

            <input
              id="hero-eligibility"
              type="text"
              value={values.eligibilityText}
              onChange={(event) =>
                updateField(
                  "eligibilityText",
                  event.target.value
                )
              }
              maxLength={200}
              required
              className={inputClass}
            />

            <p className="mt-2 text-xs text-stone-500">
              Use only approved eligibility claims.
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-stone-200 pt-6">

            <p className="max-w-md text-xs leading-5 text-stone-500">
              Save Draft stores your changes privately.
              Publish Hero makes the saved version
              available to the public API.
            </p>

            <div className="flex flex-wrap gap-3">

              {/* SAVE DRAFT */}
              <button
                type="submit"
                disabled={busy}
                className="inline-flex min-w-32 items-center justify-center rounded-lg border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-900 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Draft"}
              </button>

              {/* PUBLISH */}
              <button
                type="button"
                onClick={openPublishDialog}
                disabled={!canPublish}
                className="inline-flex min-w-36 items-center justify-center rounded-lg bg-[#0B253B] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#173C57] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {publishing
                  ? "Publishing..."
                  : "Publish Hero"}
              </button>

            </div>
          </div>

          {/* FEEDBACK */}
          {feedback && (
            <div
              role={
                feedback.kind === "error"
                  ? "alert"
                  : "status"
              }
              aria-live="polite"
              className={
                feedback.kind === "success"
                  ? "rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
                  : "rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
              }
            >
              {feedback.message}
            </div>
          )}

        </fieldset>
      </form>

      {/* =====================================
          PUBLISH CONFIRMATION DIALOG
      ===================================== */}

      <dialog
        ref={dialogRef}
        aria-labelledby="hero-publish-dialog-title"
        aria-describedby="hero-publish-dialog-description"
        className="w-[min(92vw,480px)] rounded-2xl border border-stone-200 bg-white p-6 text-stone-900 shadow-2xl backdrop:bg-black/50 sm:p-8"
      >
        <div className="space-y-5">

          <div>
            <h3
              id="hero-publish-dialog-title"
              className="text-xl font-semibold text-stone-900"
            >
              Confirm Hero Publication
            </h3>

            <p
              id="hero-publish-dialog-description"
              className="mt-3 text-sm leading-6 text-stone-600"
            >
              You are about to publish Hero draft
              version {draftVersion}. This will
              replace the currently published
              homepage Hero content.
            </p>
          </div>

          <div className="rounded-xl bg-stone-100 p-4 text-sm text-stone-700">
            <p>
              Current published version:
              <strong className="ml-2">
                {publishedVersion}
              </strong>
            </p>

            <p className="mt-2">
              New published version:
              <strong className="ml-2">
                {draftVersion}
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">

            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-lg border border-stone-300 px-5 py-3 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => void handlePublish()}
              className="rounded-lg bg-[#0B253B] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#173C57]"
            >
              Confirm Publish
            </button>

          </div>

        </div>
      </dialog>

    </section>
  );
}
