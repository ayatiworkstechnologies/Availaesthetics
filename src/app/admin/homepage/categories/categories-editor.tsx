
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type CategoryCard = {
  id: string;
  title: string;
  imageSrc: string | null;
  imageAlt: string;
  href: string | null;
};

type CategoriesContent = {
  cards: CategoryCard[];
  allTreatmentsHref: string | null;
};

type CategoriesAdminResponse = {
  scope: "global";
  draft_content: CategoriesContent | null;
  published_content: CategoriesContent | null;
  draft_version: number;
  published_version: number;
  updated_at: string | null;
  published_at: string | null;
};

type Props = {
  initialData: CategoriesAdminResponse;
  previewContent: CategoriesContent;
};

function copyContent(
  content: CategoriesContent
): CategoriesContent {
  return {
    allTreatmentsHref: content.allTreatmentsHref,
    cards: content.cards.map((card) => ({ ...card })),
  };
}

function normalizePath(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

function isValidLocalPath(value: string | null): boolean {
  if (!value) return true;

  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !value.includes("?") &&
    !value.includes("#") &&
    !value.split("/").some(
      (part) => part === "." || part === ".."
    )
  );
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
  }

  return "The request could not be completed.";
}

// =====================================
// MAIN EDITOR
// =====================================

export default function CategoriesEditor({
  initialData,
  previewContent,
}: Props) {
  const initialContent =
    initialData.draft_content ?? previewContent;

  const [content, setContent] = useState(
    () => copyContent(initialContent)
  );

  // Null means the first draft hasn't been saved.
  const [savedContent, setSavedContent] =
    useState<CategoriesContent | null>(
      initialData.draft_content
        ? copyContent(initialData.draft_content)
        : null
    );

  const [draftVersion, setDraftVersion] = useState(
    initialData.draft_version
  );

  const [publishedVersion, setPublishedVersion] =
    useState(initialData.published_version);

  const [publishedContent, setPublishedContent] =
    useState<CategoriesContent | null>(
      initialData.published_content
    );

  const [busy, setBusy] = useState<
    "save" | "publish" | null
  >(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const hasUnsavedChanges = useMemo(() => {
    if (savedContent === null) return true;

    return (
      JSON.stringify(content) !==
      JSON.stringify(savedContent)
    );
  }, [content, savedContent]);

  const canPublish =
    !hasUnsavedChanges &&
    draftVersion > 0 &&
    draftVersion > publishedVersion &&
    busy === null;

  // =====================================
  // MODIFY A CARD
  // =====================================

  function updateCard(
    id: string,
    field: keyof CategoryCard,
    value: string
  ) {
    setContent((previous) => ({
      ...previous,
      cards: previous.cards.map((card) => {
        if (card.id !== id) return card;

        if (field === "id") return card;

        if (field === "href" || field === "imageSrc") {
          return {
            ...card,
            [field]: normalizePath(value),
          };
        }

        return {
          ...card,
          [field]: value,
        };
      }),
    }));

    setMessage("");
    setError("");
  }

  // =====================================
  // ADD CATEGORY
  // =====================================

  function addCategory() {
    if (content.cards.length >= 20) {
      setError("Maximum 20 categories allowed.");
      return;
    }

    const id = `category-${crypto.randomUUID()}`;

    setContent((previous) => ({
      ...previous,
      cards: [
        ...previous.cards,
        {
          id,
          title: "",
          imageSrc: null,
          imageAlt: "",
          href: null,
        },
      ],
    }));

    setMessage("");
    setError("");
  }

  // =====================================
  // REMOVE CATEGORY
  // =====================================

  function removeCategory(id: string) {
    setContent((previous) => ({
      ...previous,
      cards: previous.cards.filter(
        (card) => card.id !== id
      ),
    }));

    setMessage("");
    setError("");
  }

  // =====================================
  // REORDER CATEGORY
  // =====================================

  function moveCategory(
    index: number,
    direction: -1 | 1
  ) {
    const nextIndex = index + direction;

    if (
      nextIndex < 0 ||
      nextIndex >= content.cards.length
    ) {
      return;
    }

    setContent((previous) => {
      const cards = [...previous.cards];

      [cards[index], cards[nextIndex]] = [
        cards[nextIndex],
        cards[index],
      ];

      return { ...previous, cards };
    });

    setMessage("");
    setError("");
  }

  // =====================================
  // VALIDATE EDITOR CONTENT
  // =====================================

  function validateContent(): string | null {
    if (content.cards.length > 20) {
      return "Maximum 20 categories allowed.";
    }

    const ids = new Set<string>();

    for (const card of content.cards) {
      const title = card.title.trim();

      if (!card.id.trim()) {
        return "A category has an empty ID.";
      }

      if (ids.has(card.id)) {
        return "Category IDs must be unique.";
      }

      ids.add(card.id);

      if (!title) {
        return "Every category needs a title.";
      }

      if (title.length > 150) {
        return "Category title exceeds 150 characters.";
      }

      if (
        card.imageSrc &&
        !isValidLocalPath(card.imageSrc)
      ) {
        return `Invalid image path for ${title}.`;
      }

      if (
        card.imageSrc &&
        !card.imageAlt.trim()
      ) {
        return `Image alt text is required for ${title}.`;
      }

      if (!isValidLocalPath(card.href)) {
        return `Invalid destination URL for ${title}.`;
      }
    }

    if (
      !isValidLocalPath(content.allTreatmentsHref)
    ) {
      return "All Treatments URL must be a local path.";
    }

    return null;
  }

  // =====================================
  // SAVE DRAFT
  // =====================================

  async function saveDraft() {
    if (busy) return;

    setError("");
    setMessage("");

    const validationError = validateContent();

    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy("save");

    try {
      const response = await fetch(
        "/api/admin/homepage/categories/draft",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            expected_draft_version: draftVersion,
            content,
          }),
        }
      );

      const data: unknown = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data));
      }

      const result = data as CategoriesAdminResponse;

      setDraftVersion(result.draft_version);

      const newSavedContent =
        result.draft_content ?? copyContent(content);

      setSavedContent(
        copyContent(newSavedContent)
      );

      setContent(
        copyContent(newSavedContent)
      );

      setMessage(
        `Draft v${result.draft_version} saved successfully.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save draft."
      );
    } finally {
      setBusy(null);
    }
  }

  // =====================================
  // PUBLISH
  // =====================================

  async function publishCategories() {
    if (!canPublish) return;

    const confirmed = window.confirm(
      "Publish these category cards to the public website?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setBusy("publish");

    try {
      const response = await fetch(
        "/api/admin/homepage/categories/publish",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            expected_draft_version: draftVersion,
          }),
        }
      );

      const data: unknown = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data));
      }

      const result = data as CategoriesAdminResponse;

      setPublishedVersion(result.published_version);

      setPublishedContent(
        result.published_content
          ? copyContent(result.published_content)
          : null
      );

      setMessage(
        `Categories v${result.published_version} published successfully.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to publish categories."
      );
    } finally {
      setBusy(null);
    }
  }

  // =====================================
  // RENDER EDITOR
  // =====================================

  return (
    <div className="mt-10 space-y-8">
      {/* STATUS CARDS */}
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
          value={
            !publishedContent
              ? "Not Published"
              : hasUnsavedChanges
                ? "Unsaved Changes"
                : draftVersion > publishedVersion
                  ? "Draft Pending"
                  : "Up to Date"
          }
        />
      </div>

      {/* NOTIFICATIONS */}
      {message && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          {message}
        </div>
      )}

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

      {!savedContent && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          This is the initial category preview data.
          Save a draft before publishing.
        </div>
      )}

      {/* EDITOR HEADER */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#0B253B]">
              Category Cards
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {content.cards.length} categories configured
            </p>
          </div>

          <button
            type="button"
            onClick={addCategory}
            disabled={busy !== null || content.cards.length >= 20}
            className="rounded-full bg-[#0B253B] px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            + Add Category
          </button>
        </div>

        {/* CATEGORY CARDS */}
        <div className="mt-8 space-y-5">
          {content.cards.map((card, index) => (
            <div
              key={card.id}
              className="rounded-xl border border-stone-200 p-5"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-[#0B253B]">
                  Category {index + 1}
                </h3>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy !== null || index === 0}
                    onClick={() => moveCategory(index, -1)}
                    className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
                    aria-label={`Move ${card.title || "category"} up`}
                  >
                    ↑ Up
                  </button>

                  <button
                    type="button"
                    disabled={
                      busy !== null ||
                      index === content.cards.length - 1
                    }
                    onClick={() => moveCategory(index, 1)}
                    className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
                    aria-label={`Move ${card.title || "category"} down`}
                  >
                    ↓ Down
                  </button>

                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => removeCategory(card.id)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[190px_1fr]">
                {/* IMAGE PREVIEW */}
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#EAE4DF]">
                  {card.imageSrc &&
                  isValidLocalPath(card.imageSrc) ? (
                    <Image
                      src={card.imageSrc}
                      alt={card.imageAlt || card.title}
                      fill
                      sizes="190px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-4 text-center text-sm text-stone-500">
                      Image pending
                    </div>
                  )}
                </div>

                {/* CARD FIELDS */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <EditorField label="Category Title">
                    <input
                      value={card.title}
                      maxLength={150}
                      disabled={busy !== null}
                      onChange={(event) =>
                        updateCard(
                          card.id,
                          "title",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-stone-300 p-3 text-sm"
                    />
                  </EditorField>

                  <EditorField label="Destination URL">
                    <input
                      value={card.href ?? ""}
                      placeholder="/treatments"
                      maxLength={500}
                      disabled={busy !== null}
                      onChange={(event) =>
                        updateCard(
                          card.id,
                          "href",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-stone-300 p-3 text-sm"
                    />
                  </EditorField>

                  <EditorField label="Image Path">
                    <input
                      value={card.imageSrc ?? ""}
                      placeholder="/images/category.jpg"
                      maxLength={500}
                      disabled={busy !== null}
                      onChange={(event) =>
                        updateCard(
                          card.id,
                          "imageSrc",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-stone-300 p-3 text-sm"
                    />
                  </EditorField>

                  <EditorField label="Image Alt Text">
                    <input
                      value={card.imageAlt}
                      maxLength={250}
                      disabled={busy !== null}
                      onChange={(event) =>
                        updateCard(
                          card.id,
                          "imageAlt",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-stone-300 p-3 text-sm"
                    />
                  </EditorField>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* EXPLORE ALL CTA */}
        <div className="mt-8 border-t border-stone-200 pt-6">
          <EditorField label="Explore All Treatments URL">
            <input
              value={content.allTreatmentsHref ?? ""}
              placeholder="/treatments"
              maxLength={500}
              disabled={busy !== null}
              onChange={(event) => {
                setContent((previous) => ({
                  ...previous,
                  allTreatmentsHref: normalizePath(
                    event.target.value
                  ),
                }));
                setMessage("");
                setError("");
              }}
              className="mt-2 w-full rounded-lg border border-stone-300 p-3 text-sm sm:max-w-xl"
            />
          </EditorField>
        </div>
      </section>

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <button
          type="button"
          disabled={busy !== null || !hasUnsavedChanges}
          onClick={saveDraft}
          className="rounded-full bg-[#0B253B] px-7 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === "save" ? "Saving..." : "Save Draft"}
        </button>

        <button
          type="button"
          disabled={!canPublish}
          onClick={publishCategories}
          className="rounded-full bg-[#356B63] px-7 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === "publish"
            ? "Publishing..."
            : "Publish Categories"}
        </button>

        <p className="text-sm text-stone-500">
          {hasUnsavedChanges
            ? "Save your changes before publishing."
            : draftVersion > publishedVersion
              ? "Saved draft is ready to publish."
              : "No unpublished changes."}
        </p>
      </div>
    </div>
  );
}

// =====================================
// SMALL UI HELPERS
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
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[#0B253B]">
        {value}
      </p>
    </div>
  );
}

function EditorField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-stone-700">
        {label}
      </span>
      {children}
    </label>
  );
}
