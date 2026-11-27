
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type SignatureCard = {
  id: string;
  title: string;
  imageSrc: string | null;
  imageAlt: string;
  href: string | null;
};

type SignatureContent = {
  heading: string;
  cards: SignatureCard[];
};

type SignatureAdminResponse = {
  scope: "global";
  draft_content: SignatureContent | null;
  published_content: SignatureContent | null;
  draft_version: number;
  published_version: number;
  updated_at: string | null;
  published_at: string | null;
};

type Props = {
  initialData: SignatureAdminResponse;
  previewContent: SignatureContent;
};

function copyContent(
  value: SignatureContent
): SignatureContent {
  return {
    heading: value.heading,
    cards: value.cards.map((card) => ({ ...card })),
  };
}

function nullablePath(value: string): string | null {
  return value.trim() || null;
}

function validLocalPath(
  value: string | null
): boolean {
  if (!value) return true;

  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.includes("?") ||
    value.includes("#") ||
    [...value].some(
      (char) => char.charCodeAt(0) < 32
    )
  ) {
    return false;
  }

  return !value.split("/").some(
    (segment) =>
      segment === "." || segment === ".."
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

  return "Unable to complete request.";
}

async function readApiResponse(
  response: Response
): Promise<SignatureAdminResponse> {
  const data: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data as SignatureAdminResponse;
}

// =====================================
// SIGNATURE AESTHETICS EDITOR
// =====================================

export default function SignatureEditor({
  initialData,
  previewContent,
}: Props) {
  const startingContent = initialData.draft_content ?? {
    ...previewContent,
    heading:
      initialData.published_content?.heading ??
      previewContent.heading,
  };

  const [content, setContent] = useState(
    () => copyContent(startingContent)
  );

  const [savedContent, setSavedContent] =
    useState<SignatureContent | null>(
      initialData.draft_content
        ? copyContent(initialData.draft_content)
        : null
    );

  const [draftVersion, setDraftVersion] =
    useState(initialData.draft_version);

  const [publishedVersion, setPublishedVersion] =
    useState(initialData.published_version);

  const [publishedContent, setPublishedContent] =
    useState<SignatureContent | null>(
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
  // CARD FIELD UPDATE
  // =====================================

  function updateCard(
    id: string,
    field: "title" | "imageSrc" | "imageAlt" | "href",
    value: string
  ) {
    setContent((previous) => ({
      ...previous,
      cards: previous.cards.map((card) => {
        if (card.id !== id) return card;

        if (field === "imageSrc" || field === "href") {
          return {
            ...card,
            [field]: nullablePath(value),
          };
        }

        return {
          ...card,
          [field]: value,
        };
      }),
    }));

    setError("");
    setMessage("");
  }

  // =====================================
  // ADD TREATMENT
  // =====================================

  function addCard() {
    if (busy) return;

    if (content.cards.length >= 20) {
      setError("Maximum 20 treatment cards allowed.");
      return;
    }

    const newCard: SignatureCard = {
      id: `signature-${crypto.randomUUID()}`,
      title: "",
      imageSrc: null,
      imageAlt: "",
      href: null,
    };

    setContent((previous) => ({
      ...previous,
      cards: [...previous.cards, newCard],
    }));

    setError("");
    setMessage("");
  }

  // =====================================
  // REMOVE TREATMENT
  // =====================================

  function removeCard(id: string) {
    if (busy) return;

    const confirmed = window.confirm(
      "Remove this treatment card from the draft?"
    );

    if (!confirmed) return;

    setContent((previous) => ({
      ...previous,
      cards: previous.cards.filter(
        (card) => card.id !== id
      ),
    }));

    setError("");
    setMessage("");
  }

  // =====================================
  // REORDER TREATMENTS
  // =====================================

  function moveCard(
    index: number,
    direction: -1 | 1
  ) {
    if (busy) return;

    const nextIndex = index + direction;

    setContent((previous) => {
      if (
        nextIndex < 0 ||
        nextIndex >= previous.cards.length
      ) {
        return previous;
      }

      const cards = [...previous.cards];

      [cards[index], cards[nextIndex]] = [
        cards[nextIndex],
        cards[index],
      ];

      return { ...previous, cards };
    });

    setError("");
    setMessage("");
  }

  // =====================================
  // VALIDATION
  // =====================================

  function validateContent(): string | null {
    if (!content.heading.trim()) {
      return "Section heading is required.";
    }

    if (content.heading.length > 200) {
      return "Section heading exceeds 200 characters.";
    }

    if (content.cards.length > 20) {
      return "Maximum 20 treatment cards allowed.";
    }

    const ids = new Set<string>();

    for (const card of content.cards) {
      const title = card.title.trim();

      if (!card.id.trim() || card.id.length > 100) {
        return "Invalid treatment card ID.";
      }

      if (ids.has(card.id)) {
        return "Duplicate treatment card IDs.";
      }

      ids.add(card.id);

      if (!title) {
        return "Every treatment needs a title.";
      }

      if (title.length > 150) {
        return `Title exceeds 150 characters: ${title}`;
      }

      if (card.imageAlt.length > 250) {
        return `Image alt text is too long: ${title}`;
      }

      if (
        card.imageSrc &&
        (
          card.imageSrc.length > 500 ||
          !validLocalPath(card.imageSrc)
        )
      ) {
        return `Invalid image path: ${title}`;
      }

      if (
        card.imageSrc &&
        !card.imageAlt.trim()
      ) {
        return `Image alt text is required: ${title}`;
      }

      if (
        card.href &&
        (
          card.href.length > 500 ||
          !validLocalPath(card.href)
        )
      ) {
        return `Invalid treatment URL: ${title}`;
      }
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
        "/api/admin/homepage/signature/draft",
        {
          method: "PUT",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            expected_draft_version: draftVersion,
            content,
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

      setMessage(
        `Signature Aesthetics draft v${result.draft_version} saved successfully.`
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
  // PUBLISH DRAFT
  // =====================================

  async function publishDraft() {
    if (!canPublish) return;

    const confirmed = window.confirm(
      "Publish Signature Aesthetics to the public website?"
    );

    if (!confirmed) return;

    setBusy("publish");
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/homepage/signature/publish",
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

      setPublishedContent(
        copyContent(result.published_content)
      );

      setPublishedVersion(
        result.published_version
      );

      setMessage(
        `Signature Aesthetics v${result.published_version} published successfully.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to publish."
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
          value={
            hasUnsavedChanges
              ? "Unsaved Changes"
              : !publishedContent
                ? "Not Published"
                : draftVersion > publishedVersion
                  ? "Draft Pending"
                  : "Up to Date"
          }
        />
      </div>

      {/* SUCCESS */}
      {message && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          {message}
        </div>
      )}

      {/* ERROR */}
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

      {/* INITIAL DATA NOTE */}
      {!savedContent && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Initial cards are loaded from the
          approved design preview. Save a draft
          before publishing them.
        </div>
      )}

      {/* SECTION HEADING */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-8">
        <EditorField label="Section Heading">
          <input
            value={content.heading}
            maxLength={200}
            disabled={busy !== null}
            onChange={(event) => {
              setContent((previous) => ({
                ...previous,
                heading: event.target.value,
              }));
              setError("");
              setMessage("");
            }}
            className="w-full rounded-lg border border-stone-300 p-3 text-sm"
          />
        </EditorField>
      </section>

      {/* CARD EDITOR */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-8">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#0B253B]">
              Signature Treatment Cards
            </h2>

            <p className="mt-1 text-sm text-stone-500">
              {content.cards.length} treatments configured
            </p>
          </div>

          <button
            type="button"
            onClick={addCard}
            disabled={
              busy !== null ||
              content.cards.length >= 20
            }
            className="rounded-full bg-[#0B253B] px-5 py-3 text-sm font-medium text-white disabled:opacity-40"
          >
            + Add Treatment
          </button>
        </div>

        <div className="mt-8 space-y-5">
          {content.cards.map((card, index) => (
            <div
              key={card.id}
              className="rounded-xl border border-stone-200 p-5"
            >
              {/* CARD TOOLBAR */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-[#0B253B]">
                  Treatment {index + 1}
                </h3>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={
                      busy !== null || index === 0
                    }
                    onClick={() => moveCard(index, -1)}
                    className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
                  >
                    ↑ Up
                  </button>

                  <button
                    type="button"
                    disabled={
                      busy !== null ||
                      index === content.cards.length - 1
                    }
                    onClick={() => moveCard(index, 1)}
                    className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
                  >
                    ↓ Down
                  </button>

                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => removeCard(card.id)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[210px_1fr]">

                {/* IMAGE PREVIEW */}
                <div className="relative aspect-[9/10] overflow-hidden rounded-xl bg-[#D7D9D9]">
                  {card.imageSrc &&
                  validLocalPath(card.imageSrc) ? (
                    <Image
                      src={card.imageSrc}
                      alt={card.imageAlt || card.title}
                      fill
                      sizes="210px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-4 text-center text-sm text-stone-500">
                      Image pending
                    </div>
                  )}
                </div>

                {/* EDITABLE FIELDS */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <EditorField label="Treatment Title">
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

                  <EditorField label="Learn More URL">
                    <input
                      value={card.href ?? ""}
                      maxLength={500}
                      placeholder="/treatments/example"
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
                      maxLength={500}
                      placeholder="/avail/home/signature/example.png"
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

        {content.cards.length === 0 && (
          <p className="mt-6 rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
            No treatments configured.
            Use Add Treatment to create a card.
          </p>
        )}
      </section>

      {/* SAVE / PUBLISH */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <button
          type="button"
          onClick={saveDraft}
          disabled={
            busy !== null || !hasUnsavedChanges
          }
          className="rounded-full bg-[#0B253B] px-7 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === "save" ? "Saving..." : "Save Draft"}
        </button>

        <button
          type="button"
          onClick={publishDraft}
          disabled={!canPublish}
          className="rounded-full bg-[#356B63] px-7 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === "publish"
            ? "Publishing..."
            : "Publish Signature"}
        </button>

        <p className="text-sm text-stone-500">
          {hasUnsavedChanges
            ? "Save changes before publishing."
            : draftVersion > publishedVersion
              ? "Saved draft is ready to publish."
              : "No unpublished changes."}
        </p>
      </div>
    </div>
  );
}

// =====================================
// REUSABLE UI HELPERS
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
