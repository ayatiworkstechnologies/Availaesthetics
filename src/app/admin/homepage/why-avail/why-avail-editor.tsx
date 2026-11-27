
"use client";

import {
  useState,
  type FormEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";

type FeatureStatus = boolean | null;

export type WhyAvailFeature = {
  id: string;
  label: string;
  avail: FeatureStatus;
  others: FeatureStatus;
};

export type WhyAvailContent = {
  heading: string;
  imageSrc: string | null;
  imageAlt: string;

  logoSrc: string | null;
  logoAlt: string;

  othersHeading: string;
  consultationLabel: string;

  features: WhyAvailFeature[];
};

export type WhyAvailAdminResponse = {
  scope: "global";

  draft_content: WhyAvailContent | null;
  published_content: WhyAvailContent | null;

  draft_version: number;
  published_version: number;

  updated_at: string | null;
  published_at: string | null;
};

type Props = {
  initialContent: WhyAvailContent;
  initialDraftVersion: number;
  initialPublishedVersion: number;
};

type StatusOption =
  | "available"
  | "unavailable"
  | "unknown";

function statusToOption(
  value: FeatureStatus
): StatusOption {
  if (value === true) return "available";
  if (value === false) return "unavailable";
  return "unknown";
}

function optionToStatus(
  value: StatusOption
): FeatureStatus {
  if (value === "available") return true;
  if (value === "unavailable") return false;
  return null;
}

function getErrorMessage(
  data: unknown,
  fallback: string
): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "detail" in data
  ) {
    const detail = data.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (
            typeof item === "object" &&
            item !== null &&
            "msg" in item
          ) {
            return String(item.msg);
          }

          return "Validation error";
        })
        .join("; ");
    }
  }

  return fallback;
}

async function readJsonResponse(
  response: Response
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error(
      `Unexpected server response (HTTP ${response.status}).`
    );
  }
}

function isAdminResponse(
  value: unknown
): value is WhyAvailAdminResponse {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.draft_version === "number" &&
    typeof data.published_version === "number" &&
    "draft_content" in data
  );
}

function imageIsPreviewable(
  value: string | null
): value is string {
  return (
    typeof value === "string" &&
    /^\/(?!\/)/.test(value) &&
    !/[%?#\\]/.test(value) &&
    !value.split("/").some(
      (segment) =>
        segment === "." || segment === ".."
    )
  );
}

export default function WhyAvailEditor({
  initialContent,
  initialDraftVersion,
  initialPublishedVersion,
}: Props) {
  const [content, setContent] =
    useState<WhyAvailContent>(initialContent);

  const [draftVersion, setDraftVersion] =
    useState(initialDraftVersion);

  const [
    publishedVersion,
    setPublishedVersion,
  ] = useState(initialPublishedVersion);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // True when the form has changes that
  // have not yet been saved as a draft.
  const [hasUnsavedChanges, setHasUnsavedChanges] =
    useState(false);

  const isPublished =
    publishedVersion > 0 &&
    draftVersion === publishedVersion;

  const canPublish =
    draftVersion > 0 &&
    draftVersion !== publishedVersion &&
    !hasUnsavedChanges &&
    !busy;

  function markChanged() {
    setHasUnsavedChanges(true);
    setSuccess("");
    setError("");
  }

  function updateContent<K extends keyof WhyAvailContent>(
    key: K,
    value: WhyAvailContent[K]
  ) {
    setContent((current) => ({
      ...current,
      [key]: value,
    }));

    markChanged();
  }

  function updateFeature(
    index: number,
    key: keyof WhyAvailFeature,
    value: string | FeatureStatus
  ) {
    setContent((current) => ({
      ...current,
      features: current.features.map(
        (feature, position) =>
          position === index
            ? { ...feature, [key]: value }
            : feature
      ),
    }));

    markChanged();
  }

  function addFeature() {
    if (content.features.length >= 5) {
      setError(
        "Maximum 5 comparison features allowed."
      );
      return;
    }

    const feature: WhyAvailFeature = {
      id: crypto.randomUUID(),
      label: "",
      avail: null,
      others: null,
    };

    setContent((current) => ({
      ...current,
      features: [...current.features, feature],
    }));

    markChanged();
  }

  function removeFeature(index: number) {
    setContent((current) => ({
      ...current,
      features: current.features.filter(
        (_, position) => position !== index
      ),
    }));

    markChanged();
  }

  function moveFeature(
    index: number,
    direction: -1 | 1
  ) {
    const target = index + direction;

    if (
      target < 0 ||
      target >= content.features.length
    ) {
      return;
    }

    setContent((current) => {
      const updated = [...current.features];

      [updated[index], updated[target]] = [
        updated[target],
        updated[index],
      ];

      return {
        ...current,
        features: updated,
      };
    });

    markChanged();
  }

  async function saveDraft(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        expected_draft_version: draftVersion,
        content: {
          ...content,
          imageSrc:
            content.imageSrc?.trim() || null,
          logoSrc:
            content.logoSrc?.trim() || null,
        },
      };

      const response = await fetch(
        "/api/admin/homepage/why-avail/draft",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        }
      );

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Unable to save Why Avail draft."
          )
        );
      }

      if (!isAdminResponse(data)) {
        throw new Error(
          "Invalid response from Why Avail API."
        );
      }

      setDraftVersion(data.draft_version);
      setPublishedVersion(
        data.published_version
      );

      if (data.draft_content) {
        setContent(data.draft_content);
      }

      setHasUnsavedChanges(false);
      setSuccess(
        "Why Avail draft saved successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save draft."
      );
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!canPublish) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/admin/homepage/why-avail/publish",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            expected_draft_version:
              draftVersion,
          }),
        }
      );

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Unable to publish Why Avail."
          )
        );
      }

      if (!isAdminResponse(data)) {
        throw new Error(
          "Invalid response from Why Avail API."
        );
      }

      setDraftVersion(data.draft_version);
      setPublishedVersion(
        data.published_version
      );

      setSuccess(
        "Why Avail content published successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to publish content."
      );
    } finally {
      setBusy(false);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  const labelClass =
    "mb-1.5 block text-sm font-medium text-slate-700";

  const actionClass =
    "rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin/dashboard"
          className="text-sm text-blue-700 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Super Admin / Homepage CMS
            </p>

            <h1 className="mt-2 text-3xl font-semibold">
              Why Avail Aesthetics MD
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Manage the comparison section,
              profile image, logo, headings,
              and consultation button.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <p>
              Draft Version:{" "}
              <strong>{draftVersion}</strong>
            </p>

            <p className="mt-1">
              Published Version:{" "}
              <strong>{publishedVersion}</strong>
            </p>

            <p className="mt-2 font-medium">
              {hasUnsavedChanges
                ? "Unsaved Changes"
                : isPublished
                  ? "Published"
                  : draftVersion > 0
                    ? "Unpublished Draft"
                    : "Not Published"}
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        <form
          onSubmit={saveDraft}
          className="mt-8 space-y-6"
        >
          {/* SECTION HEADING */}

          <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold">
              Section Heading
            </h2>

            <div className="mt-5">
              <label
                htmlFor="why-avail-heading"
                className={labelClass}
              >
                Heading
              </label>

              <input
                id="why-avail-heading"
                required
                maxLength={200}
                className={fieldClass}
                value={content.heading}
                onChange={(event) =>
                  updateContent(
                    "heading",
                    event.target.value
                  )
                }
              />
            </div>
          </section>

          {/* PROFILE IMAGE */}

          <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold">
              Profile Image
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Left-side image used in the
              comparison section.
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="profile-src"
                    className={labelClass}
                  >
                    Profile Image Path
                  </label>

                  <input
                    id="profile-src"
                    className={fieldClass}
                    maxLength={500}
                    placeholder="/avail/home/image.png"
                    value={content.imageSrc ?? ""}
                    onChange={(event) =>
                      updateContent(
                        "imageSrc",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-alt"
                    className={labelClass}
                  >
                    Image Alt Text
                  </label>

                  <input
                    id="profile-alt"
                    className={fieldClass}
                    maxLength={250}
                    required={Boolean(content.imageSrc)}
                    value={content.imageAlt}
                    onChange={(event) =>
                      updateContent(
                        "imageAlt",
                        event.target.value
                      )
                    }
                  />
                </div>
              </div>

              <div className="flex min-h-52 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                {imageIsPreviewable(
                  content.imageSrc
                ) ? (
                  <div className="relative h-60 w-full">
                    <Image
                      src={content.imageSrc}
                      alt={
                        content.imageAlt ||
                        "Profile preview"
                      }
                      fill
                      unoptimized
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <p className="px-4 text-center text-sm text-slate-500">
                    No valid local image path
                    selected.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* DYNAMIC AVAIL LOGO */}

          <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold">
              Avail Comparison Logo
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Logo displayed above the Avail
              comparison column.
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="logo-src"
                    className={labelClass}
                  >
                    Logo Image Path
                  </label>

                  <input
                    id="logo-src"
                    className={fieldClass}
                    maxLength={500}
                    placeholder="/avail/brand/logo.svg"
                    value={content.logoSrc ?? ""}
                    onChange={(event) =>
                      updateContent(
                        "logoSrc",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="logo-alt"
                    className={labelClass}
                  >
                    Logo Alt Text
                  </label>

                  <input
                    id="logo-alt"
                    className={fieldClass}
                    maxLength={250}
                    required={Boolean(content.logoSrc)}
                    value={content.logoAlt}
                    onChange={(event) =>
                      updateContent(
                        "logoAlt",
                        event.target.value
                      )
                    }
                  />
                </div>
              </div>

              <div className="flex min-h-48 items-center justify-center rounded-lg bg-[#C9D8E8] p-6">
                {imageIsPreviewable(
                  content.logoSrc
                ) ? (
                  <Image
                    src={content.logoSrc}
                    alt={
                      content.logoAlt ||
                      "Logo preview"
                    }
                    width={160}
                    height={80}
                    unoptimized
                    className="h-auto max-h-24 w-auto max-w-full object-contain"
                  />
                ) : (
                  <p className="text-center text-sm text-slate-600">
                    No valid local logo path
                    selected.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* COLUMN HEADING + CTA */}

          <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold">
              Comparison Settings
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="others-heading"
                  className={labelClass}
                >
                  Others Column Heading
                </label>

                <input
                  id="others-heading"
                  className={fieldClass}
                  required
                  maxLength={100}
                  value={content.othersHeading}
                  onChange={(event) =>
                    updateContent(
                      "othersHeading",
                      event.target.value
                    )
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="consultation-label"
                  className={labelClass}
                >
                  Consultation Button Label
                </label>

                <input
                  id="consultation-label"
                  className={fieldClass}
                  required
                  maxLength={150}
                  value={content.consultationLabel}
                  onChange={(event) =>
                    updateContent(
                      "consultationLabel",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              The consultation destination URL
              comes from the published Hero CMS.
              It is not managed separately here.
            </p>
          </section>

          {/* COMPARISON FEATURES */}

          <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  Comparison Features
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {content.features.length} of 5
                  comparison features.
                </p>
              </div>

              <button
                type="button"
                onClick={addFeature}
                disabled={
                  busy ||
                  content.features.length >= 5
                }
                className={actionClass}
              >
                + Add Feature
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {content.features.map(
                (feature, index) => (
                  <div
                    key={feature.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold">
                        Feature {index + 1}
                      </h3>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={
                            busy || index === 0
                          }
                          onClick={() =>
                            moveFeature(index, -1)
                          }
                          className={actionClass}
                          aria-label={`Move feature ${index + 1} up`}
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          disabled={
                            busy ||
                            index ===
                              content.features.length - 1
                          }
                          onClick={() =>
                            moveFeature(index, 1)
                          }
                          className={actionClass}
                          aria-label={`Move feature ${index + 1} down`}
                        >
                          ↓
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            removeFeature(index)
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label
                          htmlFor={`feature-${feature.id}-label`}
                          className={labelClass}
                        >
                          Feature Label
                        </label>

                        <input
                          id={`feature-${feature.id}-label`}
                          required
                          maxLength={200}
                          className={fieldClass}
                          value={feature.label}
                          onChange={(event) =>
                            updateFeature(
                              index,
                              "label",
                              event.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`feature-${feature.id}-avail`}
                          className={labelClass}
                        >
                          Avail Status
                        </label>

                        <select
                          id={`feature-${feature.id}-avail`}
                          className={fieldClass}
                          value={statusToOption(
                            feature.avail
                          )}
                          onChange={(event) =>
                            updateFeature(
                              index,
                              "avail",
                              optionToStatus(
                                event.target
                                  .value as StatusOption
                              )
                            )
                          }
                        >
                          <option value="available">
                            Available
                          </option>
                          <option value="unavailable">
                            Not Available
                          </option>
                          <option value="unknown">
                            Not Verified
                          </option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor={`feature-${feature.id}-others`}
                          className={labelClass}
                        >
                          Others Status
                        </label>

                        <select
                          id={`feature-${feature.id}-others`}
                          className={fieldClass}
                          value={statusToOption(
                            feature.others
                          )}
                          onChange={(event) =>
                            updateFeature(
                              index,
                              "others",
                              optionToStatus(
                                event.target
                                  .value as StatusOption
                              )
                            )
                          }
                        >
                          <option value="available">
                            Available
                          </option>
                          <option value="unavailable">
                            Not Available
                          </option>
                          <option value="unknown">
                            Not Verified
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                )
              )}

              {content.features.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  No comparison features added.
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Status values: Available = true,
              Not Available = false, Not Verified
              = null. Verify comparison claims
              before publishing.
            </p>
          </section>

          {/* ACTIONS */}

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              Save the draft before publishing.
              Unsaved changes will not appear
              on the public website.
            </p>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg border border-[#0B253B] px-5 py-2.5 text-sm font-semibold text-[#0B253B] hover:bg-slate-50 disabled:opacity-50"
              >
                {busy
                  ? "Processing..."
                  : "Save Draft"}
              </button>

              <button
                type="button"
                onClick={publish}
                disabled={!canPublish}
                className="rounded-lg bg-[#0B253B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#163C59] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Publish
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
