
"use client";

import { useMemo, useState } from "react";

// =====================================
// TYPES
// =====================================

type TestimonialItem = {
  id: string;
  quote: string;
  author: string;
};

type TestimonialsContent = {
  heading: string;
  testimonials: TestimonialItem[];
};

type TestimonialsAdminResponse = {
  scope: "global";
  draft_content: TestimonialsContent | null;
  published_content: TestimonialsContent | null;
  draft_version: number;
  published_version: number;
  updated_at: string | null;
  published_at: string | null;
};

type Props = {
  initialData: TestimonialsAdminResponse;
  previewContent: TestimonialsContent;
};

// =====================================
// HELPERS
// =====================================

function copyContent(
  value: TestimonialsContent
): TestimonialsContent {
  return {
    heading: value.heading,
    testimonials: value.testimonials.map(
      (item) => ({ ...item })
    ),
  };
}

function getErrorMessage(data: unknown): string {
  if (
    data &&
    typeof data === "object" &&
    "detail" in data
  ) {
    const detail = (
      data as { detail: unknown }
    ).detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) =>
          typeof item?.msg === "string"
            ? item.msg
            : "Invalid field"
        )
        .join("; ");
    }
  }

  return "Unable to complete the request.";
}

async function readApiResponse(
  response: Response
): Promise<TestimonialsAdminResponse> {
  const data: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data as TestimonialsAdminResponse;
}

// =====================================
// TESTIMONIALS EDITOR
// =====================================

export default function TestimonialsEditor({
  initialData,
  previewContent,
}: Props) {
  const startingContent =
    initialData.draft_content ??
    initialData.published_content ??
    previewContent;

  const [content, setContent] = useState(
    () => copyContent(startingContent)
  );

  const [savedContent, setSavedContent] =
    useState<TestimonialsContent | null>(
      initialData.draft_content
        ? copyContent(initialData.draft_content)
        : null
    );

  const [publishedContent, setPublishedContent] =
    useState<TestimonialsContent | null>(
      initialData.published_content
        ? copyContent(initialData.published_content)
        : null
    );

  const [draftVersion, setDraftVersion] = useState(
    initialData.draft_version
  );

  const [publishedVersion, setPublishedVersion] =
    useState(initialData.published_version);

  const [busy, setBusy] = useState<
    "save" | "publish" | null
  >(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =====================================
  // UNSAVED CHANGES
  // =====================================

  const hasUnsavedChanges = useMemo(() => {
    if (!savedContent) {
      return true;
    }

    return (
      JSON.stringify(content) !==
      JSON.stringify(savedContent)
    );
  }, [content, savedContent]);

  const canPublish =
    busy === null &&
    !hasUnsavedChanges &&
    draftVersion > 0 &&
    (
      publishedContent === null ||
      draftVersion > publishedVersion
    );

  const publicationStatus = hasUnsavedChanges
    ? "Unsaved Changes"
    : !publishedContent
      ? "Not Published"
      : draftVersion > publishedVersion
        ? "Draft Pending"
        : "Up to Date";

  // =====================================
  // UPDATE SECTION HEADING
  // =====================================

  function updateHeading(value: string) {
    if (busy) return;

    setContent((previous) => ({
      ...previous,
      heading: value,
    }));

    setError("");
    setMessage("");
  }

  // =====================================
  // UPDATE TESTIMONIAL
  // =====================================

  function updateTestimonial(
    id: string,
    field: "quote" | "author",
    value: string
  ) {
    if (busy) return;

    setContent((previous) => ({
      ...previous,
      testimonials: previous.testimonials.map(
        (item) =>
          item.id === id
            ? { ...item, [field]: value }
            : item
      ),
    }));

    setError("");
    setMessage("");
  }

  // =====================================
  // ADD TESTIMONIAL
  // =====================================

  function addTestimonial() {
    if (busy) return;

    if (content.testimonials.length >= 30) {
      setError(
        "Maximum 30 testimonials are allowed."
      );
      return;
    }

    const newItem: TestimonialItem = {
      id: `testimonial-${crypto.randomUUID()}`,
      quote: "",
      author: "",
    };

    setContent((previous) => ({
      ...previous,
      testimonials: [
        ...previous.testimonials,
        newItem,
      ],
    }));

    setError("");
    setMessage("");
  }

  // =====================================
  // REMOVE TESTIMONIAL
  // =====================================

  function removeTestimonial(id: string) {
    if (busy) return;

    const confirmed = window.confirm(
      "Remove this testimonial from the draft?"
    );

    if (!confirmed) return;

    setContent((previous) => ({
      ...previous,
      testimonials: previous.testimonials.filter(
        (item) => item.id !== id
      ),
    }));

    setError("");
    setMessage("");
  }

  // =====================================
  // REORDER TESTIMONIALS
  // =====================================

  function moveTestimonial(
    index: number,
    direction: -1 | 1
  ) {
    if (busy) return;

    setContent((previous) => {
      const nextIndex = index + direction;
      const items = [...previous.testimonials];

      if (
        nextIndex < 0 ||
        nextIndex >= items.length
      ) {
        return previous;
      }

      [items[index], items[nextIndex]] = [
        items[nextIndex],
        items[index],
      ];

      return {
        ...previous,
        testimonials: items,
      };
    });

    setError("");
    setMessage("");
  }

  // =====================================
  // CONTENT VALIDATION
  // =====================================

  function validateContent(): string | null {
    const heading = content.heading.trim();

    if (!heading) {
      return "Section heading is required.";
    }

    if (heading.length > 200) {
      return "Heading cannot exceed 200 characters.";
    }

    if (content.testimonials.length > 30) {
      return "Maximum 30 testimonials are allowed.";
    }

    const ids = new Set<string>();

    for (const item of content.testimonials) {
      if (
        !item.id.trim() ||
        item.id.length > 100
      ) {
        return "Invalid testimonial ID.";
      }

      if (ids.has(item.id)) {
        return "Duplicate testimonial IDs found.";
      }

      ids.add(item.id);

      if (!item.quote.trim()) {
        return "Every testimonial needs review text.";
      }

      if (item.quote.trim().length > 2000) {
        return "Testimonial text cannot exceed 2000 characters.";
      }

      if (!item.author.trim()) {
        return "Every testimonial needs an author name.";
      }

      if (item.author.trim().length > 150) {
        return "Author name cannot exceed 150 characters.";
      }
    }

    return null;
  }

  // =====================================
  // SAVE DRAFT
  // =====================================

  async function saveDraft() {
    if (busy || !hasUnsavedChanges) {
      return;
    }

    setError("");
    setMessage("");

    const validationError = validateContent();

    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy("save");

    try {
      const normalizedContent: TestimonialsContent = {
        heading: content.heading.trim(),
        testimonials: content.testimonials.map(
          (item) => ({
            id: item.id.trim(),
            quote: item.quote.trim(),
            author: item.author.trim(),
          })
        ),
      };

      const response = await fetch(
        "/api/admin/homepage/testimonials/draft",
        {
          method: "PUT",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            expected_draft_version: draftVersion,
            content: normalizedContent,
          }),
        }
      );

      const result = await readApiResponse(response);

      if (!result.draft_content) {
        throw new Error(
          "Backend did not return the saved draft."
        );
      }

      const saved = copyContent(
        result.draft_content
      );

      setContent(copyContent(saved));
      setSavedContent(saved);

      setDraftVersion(result.draft_version);
      setPublishedVersion(result.published_version);

      setPublishedContent(
        result.published_content
          ? copyContent(result.published_content)
          : null
      );

      setMessage(
        `Testimonials draft v${result.draft_version} saved successfully.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save Testimonials draft."
      );
    } finally {
      setBusy(null);
    }
  }

  // =====================================
  // PUBLISH DRAFT
  // =====================================

  async function publishDraft() {
    if (!canPublish) return;

    const confirmed = window.confirm(
      "Publish the Testimonials section to the public website?"
    );

    if (!confirmed) return;

    setBusy("publish");
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/homepage/testimonials/publish",
        {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            expected_draft_version: draftVersion,
          }),
        }
      );

      const result = await readApiResponse(response);

      if (!result.published_content) {
        throw new Error(
          "Backend did not return published content."
        );
      }

      setDraftVersion(result.draft_version);
      setPublishedVersion(result.published_version);

      setPublishedContent(
        copyContent(result.published_content)
      );

      setMessage(
        `Testimonials v${result.published_version} published successfully.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to publish Testimonials."
      );
    } finally {
      setBusy(null);
    }
  }

  // =====================================
  // UI
  // =====================================

  return (
    <div className="mt-10 space-y-8">

      {/* CMS STATUS */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatusCard
          label="Draft Version"
          value={`v${draftVersion}`}
        />

        <StatusCard
          label="Published Version"
          value={`v${publishedVersion}`}
        />

        <StatusCard
          label="Publication Status"
          value={publicationStatus}
        />
      </div>

      {/* SUCCESS MESSAGE */}
      {message && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          {message}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="ml-3 font-semibold underline"
          >
            Reload latest data
          </button>
        </div>
      )}

      {/* INITIAL PREVIEW NOTICE */}
      {!savedContent && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          The initial heading and testimonials are
          loaded from the approved design preview.
          Save a draft before publishing. Only
          approved client testimonials should be
          published.
        </div>
      )}

      {/* DYNAMIC SECTION HEADING */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-8">
        <h2 className="text-xl font-semibold text-[#0B253B]">
          Section Heading
        </h2>

        <p className="mt-2 text-sm text-stone-500">
          This heading appears above the Testimonials
          carousel on the public homepage.
        </p>

        <label className="mt-6 block space-y-2">
          <span className="text-sm font-medium text-stone-700">
            Heading
          </span>

          <input
            type="text"
            value={content.heading}
            maxLength={200}
            disabled={busy !== null}
            onChange={(event) =>
              updateHeading(event.target.value)
            }
            placeholder="Enter section heading"
            className="w-full rounded-lg border border-stone-300 p-3 text-sm text-[#0B253B] outline-none focus:border-[#356B63] disabled:opacity-60"
          />
        </label>

        <div className="mt-6 rounded-xl bg-[#FDF9F7] px-5 py-8 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-stone-500">
            Heading Preview
          </p>

          <h3 className="font-serif text-[clamp(1.6rem,3vw,2.5rem)] leading-tight text-[#0B253B]">
            {content.heading || "Section heading"}
          </h3>
        </div>
      </section>

      {/* TESTIMONIALS MANAGEMENT */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#0B253B]">
              Client Testimonials
            </h2>

            <p className="mt-2 text-sm text-stone-500">
              {content.testimonials.length} testimonials configured
            </p>
          </div>

          <button
            type="button"
            onClick={addTestimonial}
            disabled={
              busy !== null ||
              content.testimonials.length >= 30
            }
            className="rounded-full bg-[#0B253B] px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Add Testimonial
          </button>
        </div>

        {/* TESTIMONIAL CARDS */}
        <div className="mt-8 space-y-5">
          {content.testimonials.map((item, index) => (
            <div
              key={item.id}
              className="rounded-xl border border-stone-200 p-5 sm:p-6"
            >
              {/* CARD HEADER */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-[#0B253B]">
                  Testimonial {index + 1}
                </h3>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={
                      busy !== null ||
                      index === 0
                    }
                    onClick={() =>
                      moveTestimonial(index, -1)
                    }
                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm disabled:opacity-40"
                  >
                    ↑ Up
                  </button>

                  <button
                    type="button"
                    disabled={
                      busy !== null ||
                      index ===
                        content.testimonials.length - 1
                    }
                    onClick={() =>
                      moveTestimonial(index, 1)
                    }
                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm disabled:opacity-40"
                  >
                    ↓ Down
                  </button>

                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() =>
                      removeTestimonial(item.id)
                    }
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* QUOTE */}
              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">
                  Testimonial Review
                </span>

                <textarea
                  rows={5}
                  value={item.quote}
                  maxLength={2000}
                  disabled={busy !== null}
                  onChange={(event) =>
                    updateTestimonial(
                      item.id,
                      "quote",
                      event.target.value
                    )
                  }
                  placeholder="Enter approved client testimonial"
                  className="w-full resize-y rounded-lg border border-stone-300 p-3 text-sm leading-6 text-[#0B253B] outline-none focus:border-[#356B63] disabled:opacity-60"
                />

                <span className="block text-right text-xs text-stone-400">
                  {item.quote.length}/2000
                </span>
              </label>

              {/* AUTHOR */}
              <label className="mt-5 block space-y-2">
                <span className="text-sm font-medium text-stone-700">
                  Client Name / Attribution
                </span>

                <input
                  type="text"
                  value={item.author}
                  maxLength={150}
                  disabled={busy !== null}
                  onChange={(event) =>
                    updateTestimonial(
                      item.id,
                      "author",
                      event.target.value
                    )
                  }
                  placeholder="Enter client attribution"
                  className="w-full rounded-lg border border-stone-300 p-3 text-sm text-[#0B253B] outline-none focus:border-[#356B63] disabled:opacity-60"
                />
              </label>

              {/* CARD PREVIEW */}
              <div className="mt-6 bg-[#FDF9F7] p-6">
                <span
                  aria-hidden="true"
                  className="text-4xl font-serif text-[#0B253B]"
                >
                  “
                </span>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#878787]">
                  {item.quote ||
                    "Testimonial preview will appear here."}
                </p>

                <p className="mt-5 text-sm font-semibold text-[#292529]">
                  — {item.author || "Client attribution"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* EMPTY STATE */}
        {content.testimonials.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-stone-300 p-8 text-center">
            <p className="text-sm text-stone-500">
              No testimonials configured.
            </p>

            <p className="mt-2 text-xs text-stone-400">
              Add a testimonial to populate this section.
            </p>
          </div>
        )}
      </section>

      {/* SAVE / PUBLISH ACTIONS */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={saveDraft}
            disabled={
              busy !== null ||
              !hasUnsavedChanges
            }
            className="rounded-full bg-[#0B253B] px-7 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === "save"
              ? "Saving..."
              : "Save Draft"}
          </button>

          <button
            type="button"
            onClick={publishDraft}
            disabled={!canPublish}
            className="rounded-full bg-[#356B63] px-7 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === "publish"
              ? "Publishing..."
              : "Publish Testimonials"}
          </button>
        </div>

        <p className="mt-4 text-sm text-stone-500">
          {hasUnsavedChanges
            ? "Save your changes before publishing."
            : canPublish
              ? "The saved draft is ready to publish."
              : "No unpublished changes."}
        </p>
      </section>
    </div>
  );
}

// =====================================
// REUSABLE STATUS CARD
// =====================================

function StatusCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <p className="text-sm text-stone-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold text-[#0B253B]">
        {value}
      </p>
    </div>
  );
}
