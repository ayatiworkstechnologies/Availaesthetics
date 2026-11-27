
"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  homepageFaqs,
} from "@/lib/cms/homepage-faq-preview";

// =====================================
// FAQ CMS TYPES
// =====================================

export type FaqItem = {
  id: string;
  question: string;
  answer: string | null;
};

export type FaqContent = {
  heading: string;
  faqs: FaqItem[];
};

export type FaqCmsResponse = {
  scope: "global";
  draft_content: FaqContent | null;
  published_content: FaqContent | null;
  draft_version: number;
  published_version: number;
  updated_at: string | null;
  published_at: string | null;
};

// =====================================
// DEFAULT CONTENT
// =====================================

const DEFAULT_CONTENT: FaqContent = {
  heading: "Frequently Asked Questions",
  faqs: homepageFaqs.map((faq) => ({
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
  })),
};

const MAX_FAQS = 30;
const MAX_HEADING_LENGTH = 200;
const MAX_QUESTION_LENGTH = 500;
const MAX_ANSWER_LENGTH = 5000;

// =====================================
// PROPS
// =====================================

type FaqEditorProps = {
  initialData: FaqCmsResponse;
};

// =====================================
// HELPERS
// =====================================

function cloneContent(
  content: FaqContent
): FaqContent {
  return {
    heading: content.heading,
    faqs: content.faqs.map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
    })),
  };
}

function normalizeContent(
  content: FaqContent
): FaqContent {
  return {
    heading: content.heading.trim(),

    faqs: content.faqs.map((faq) => ({
      id: faq.id,
      question: faq.question.trim(),
      answer: faq.answer?.trim() || null,
    })),
  };
}

function getErrorMessage(
  value: unknown,
  fallback: string
): string {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return fallback;
  }

  const data = value as Record<
    string,
    unknown
  >;

  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => {
        if (
          item &&
          typeof item === "object" &&
          "msg" in item &&
          typeof item.msg === "string"
        ) {
          return item.msg;
        }

        return "Invalid FAQ field";
      })
      .join(". ");
  }

  return fallback;
}

async function sendJsonRequest(
  url: string,
  method: "PUT" | "POST",
  payload: unknown
): Promise<FaqCmsResponse> {
  const response = await fetch(url, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result: unknown =
    await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        result,
        `Request failed: HTTP ${response.status}`
      )
    );
  }

  if (
    !result ||
    typeof result !== "object" ||
    Array.isArray(result)
  ) {
    throw new Error(
      "Invalid FAQ CMS API response."
    );
  }

  return result as FaqCmsResponse;
}

function validateContent(
  content: FaqContent
): string | null {
  if (!content.heading) {
    return "FAQ heading is required.";
  }

  if (
    content.heading.length >
    MAX_HEADING_LENGTH
  ) {
    return "FAQ heading is too long.";
  }

  if (
    content.faqs.length < 1 ||
    content.faqs.length > MAX_FAQS
  ) {
    return `Add between 1 and ${MAX_FAQS} FAQs.`;
  }

  const ids = new Set<string>();

  for (
    let index = 0;
    index < content.faqs.length;
    index += 1
  ) {
    const faq = content.faqs[index];

    if (!faq.id || ids.has(faq.id)) {
      return "FAQ identifiers must be unique.";
    }

    ids.add(faq.id);

    if (!faq.question) {
      return `Question ${index + 1} cannot be empty.`;
    }

    if (
      faq.question.length >
      MAX_QUESTION_LENGTH
    ) {
      return `Question ${index + 1} is too long.`;
    }

    if (
      (faq.answer?.length ?? 0) >
      MAX_ANSWER_LENGTH
    ) {
      return `Answer ${index + 1} is too long.`;
    }
  }

  return null;
}

// =====================================
// MAIN FAQ CMS EDITOR
// =====================================

export default function FaqEditor({
  initialData,
}: FaqEditorProps) {
  const initialContent =
    initialData.draft_content ??
    initialData.published_content ??
    DEFAULT_CONTENT;

  // ---------------------------------
  // FORM STATE
  // ---------------------------------

  const [content, setContent] = useState<
    FaqContent
  >(() => cloneContent(initialContent));

  const [
    savedDraftContent,
    setSavedDraftContent,
  ] = useState<FaqContent | null>(
    initialData.draft_content
      ? cloneContent(initialData.draft_content)
      : null
  );

  const [
    publishedContent,
    setPublishedContent,
  ] = useState<FaqContent | null>(
    initialData.published_content
  );

  const [
    draftVersion,
    setDraftVersion,
  ] = useState(initialData.draft_version);

  const [
    publishedVersion,
    setPublishedVersion,
  ] = useState(initialData.published_version);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isPublishing, setIsPublishing] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  // ---------------------------------
  // FORM STATE CALCULATIONS
  // ---------------------------------

  const normalizedContent = useMemo(
    () => normalizeContent(content),
    [content]
  );

  const hasUnsavedChanges =
    savedDraftContent === null ||
    JSON.stringify(normalizedContent) !==
      JSON.stringify(
        normalizeContent(savedDraftContent)
      );

  const hasUnpublishedChanges =
    draftVersion > publishedVersion;

  const isBusy = isSaving || isPublishing;

  const canPublish =
    !isBusy &&
    !hasUnsavedChanges &&
    savedDraftContent !== null &&
    hasUnpublishedChanges;

  // ---------------------------------
  // RESET FEEDBACK
  // ---------------------------------

  function clearFeedback() {
    setSuccessMessage("");
    setErrorMessage("");
  }

  // ---------------------------------
  // UPDATE HEADING
  // ---------------------------------

  function updateHeading(value: string) {
    clearFeedback();

    setContent((current) => ({
      ...current,
      heading: value,
    }));
  }

  // ---------------------------------
  // UPDATE FAQ FIELD
  // ---------------------------------

  function updateFaq(
    id: string,
    field: "question" | "answer",
    value: string
  ) {
    clearFeedback();

    setContent((current) => ({
      ...current,

      faqs: current.faqs.map((faq) => {
        if (faq.id !== id) {
          return faq;
        }

        if (field === "answer") {
          return {
            ...faq,
            answer: value,
          };
        }

        return {
          ...faq,
          question: value,
        };
      }),
    }));
  }

  // ---------------------------------
  // ADD FAQ
  // ---------------------------------

  function addFaq() {
    if (content.faqs.length >= MAX_FAQS) {
      setErrorMessage(
        `Maximum ${MAX_FAQS} FAQs allowed.`
      );
      return;
    }

    clearFeedback();

    const id = `faq-${crypto.randomUUID()}`;

    setContent((current) => ({
      ...current,
      faqs: [
        ...current.faqs,
        {
          id,
          question: "",
          answer: null,
        },
      ],
    }));
  }

  // ---------------------------------
  // REMOVE FAQ
  // ---------------------------------

  function removeFaq(id: string) {
    if (content.faqs.length <= 1) {
      setErrorMessage(
        "At least one FAQ is required."
      );
      return;
    }

    clearFeedback();

    setContent((current) => ({
      ...current,
      faqs: current.faqs.filter(
        (faq) => faq.id !== id
      ),
    }));
  }

  // ---------------------------------
  // REORDER FAQ
  // ---------------------------------

  function moveFaq(
    index: number,
    direction: -1 | 1
  ) {
    const target = index + direction;

    if (
      target < 0 ||
      target >= content.faqs.length
    ) {
      return;
    }

    clearFeedback();

    setContent((current) => {
      const next = [...current.faqs];

      [next[index], next[target]] = [
        next[target],
        next[index],
      ];

      return {
        ...current,
        faqs: next,
      };
    });
  }

  // ---------------------------------
  // HANDLE UPDATED SERVER RESPONSE
  // ---------------------------------

  function applyResponse(
    response: FaqCmsResponse
  ) {
    setDraftVersion(
      response.draft_version
    );

    setPublishedVersion(
      response.published_version
    );

    setSavedDraftContent(
      response.draft_content
        ? cloneContent(response.draft_content)
        : null
    );

    setPublishedContent(
      response.published_content
    );

    if (response.draft_content) {
      setContent(
        cloneContent(response.draft_content)
      );
    }
  }

  // ---------------------------------
  // SAVE FAQ DRAFT
  // ---------------------------------

  async function saveDraft() {
    if (isBusy) {
      return;
    }

    clearFeedback();

    const prepared =
      normalizeContent(content);

    const validationError =
      validateContent(prepared);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const response = await sendJsonRequest(
        "/api/admin/homepage/faq/draft",
        "PUT",
        {
          expected_draft_version:
            draftVersion,
          content: prepared,
        }
      );

      applyResponse(response);

      setSuccessMessage(
        "FAQ draft saved successfully. Changes are not yet live."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save FAQ draft."
      );
    } finally {
      setIsSaving(false);
    }
  }

  // ---------------------------------
  // PUBLISH FAQ DRAFT
  // ---------------------------------

  async function publishDraft() {
    if (!canPublish) {
      setErrorMessage(
        "Save your latest FAQ changes before publishing."
      );
      return;
    }

    clearFeedback();
    setIsPublishing(true);

    try {
      const response = await sendJsonRequest(
        "/api/admin/homepage/faq/publish",
        "POST",
        {
          expected_draft_version:
            draftVersion,
        }
      );

      applyResponse(response);

      setSuccessMessage(
        "Homepage FAQs published successfully."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to publish FAQs."
      );
    } finally {
      setIsPublishing(false);
    }
  }

  // =====================================
  // RENDER EDITOR
  // =====================================

  return (
    <div className="space-y-6">
      {/* ==================================
          PUBLICATION STATUS
      ================================== */}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Draft Version
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {draftVersion}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Published Version
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {publishedVersion}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Publication Status
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-900">
            {!publishedContent
              ? "Not Published"
              : hasUnsavedChanges
                ? "Unsaved Changes"
                : hasUnpublishedChanges
                  ? "Draft Pending Publication"
                  : "Published"}
          </p>
        </div>
      </div>

      {/* ==================================
          FEEDBACK
      ================================== */}

      {successMessage && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800"
        >
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
        >
          {errorMessage}
        </div>
      )}

      {/* ==================================
          SECTION HEADING
      ================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-semibold text-slate-900">
          FAQ Section Settings
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Configure the heading displayed above
          the public FAQ accordion.
        </p>

        <div className="mt-6">
          <label
            htmlFor="faq-section-heading"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Section Heading
          </label>

          <input
            id="faq-section-heading"
            type="text"
            value={content.heading}
            onChange={(event) =>
              updateHeading(
                event.target.value
              )
            }
            maxLength={MAX_HEADING_LENGTH}
            disabled={isBusy}
            placeholder="Frequently Asked Questions"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition-colors focus:border-[#0B253B] focus:ring-2 focus:ring-[#0B253B]/10 disabled:opacity-60"
          />
        </div>
      </section>

      {/* ==================================
          FAQ QUESTIONS
      ================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              FAQ Questions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Edit questions and answers,
              and arrange the display order.
            </p>
          </div>

          <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
            {content.faqs.length} / {MAX_FAQS} FAQs
          </div>
        </div>

        {/* FAQ EDITOR CARDS */}
        <div className="mt-6 space-y-5">
          {content.faqs.map((faq, index) => (
            <div
              key={faq.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
            >
              {/* CARD HEADER */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  FAQ {index + 1}
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isBusy || index === 0}
                    onClick={() =>
                      moveFaq(index, -1)
                    }
                    aria-label={`Move FAQ ${index + 1} up`}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ↑ Up
                  </button>

                  <button
                    type="button"
                    disabled={
                      isBusy ||
                      index === content.faqs.length - 1
                    }
                    onClick={() =>
                      moveFaq(index, 1)
                    }
                    aria-label={`Move FAQ ${index + 1} down`}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ↓ Down
                  </button>

                  <button
                    type="button"
                    disabled={
                      isBusy ||
                      content.faqs.length <= 1
                    }
                    onClick={() =>
                      removeFaq(faq.id)
                    }
                    className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* QUESTION */}
              <div>
                <label
                  htmlFor={`faq-question-input-${faq.id}`}
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Question
                </label>

                <input
                  id={`faq-question-input-${faq.id}`}
                  type="text"
                  value={faq.question}
                  maxLength={MAX_QUESTION_LENGTH}
                  disabled={isBusy}
                  onChange={(event) =>
                    updateFaq(
                      faq.id,
                      "question",
                      event.target.value
                    )
                  }
                  placeholder="Enter FAQ question"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#0B253B] focus:ring-2 focus:ring-[#0B253B]/10 disabled:opacity-60"
                />
              </div>

              {/* ANSWER */}
              <div className="mt-5">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor={`faq-answer-input-${faq.id}`}
                    className="text-sm font-medium text-slate-700"
                  >
                    Answer
                  </label>

                  <span className="text-xs text-slate-500">
                    Optional
                  </span>
                </div>

                <textarea
                  id={`faq-answer-input-${faq.id}`}
                  value={faq.answer ?? ""}
                  maxLength={MAX_ANSWER_LENGTH}
                  rows={4}
                  disabled={isBusy}
                  onChange={(event) =>
                    updateFaq(
                      faq.id,
                      "answer",
                      event.target.value
                    )
                  }
                  placeholder="Enter the client-approved answer, or leave blank."
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-7 outline-none transition-colors focus:border-[#0B253B] focus:ring-2 focus:ring-[#0B253B]/10 disabled:opacity-60"
                />

                {!faq.answer?.trim() && (
                  <p className="mt-2 text-xs text-amber-700">
                    No answer provided. The public
                    accordion will display:
                    &quot;Answer pending client approval.&quot;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ADD FAQ */}
        <button
          type="button"
          onClick={addFaq}
          disabled={
            isBusy ||
            content.faqs.length >= MAX_FAQS
          }
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-[#0B253B] bg-white px-5 py-3 text-sm font-semibold text-[#0B253B] transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Add FAQ
        </button>
      </section>

      {/* ==================================
          SAVE AND PUBLISH
      ================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Save & Publish
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Saving updates the private CMS draft.
              Publishing makes the saved version
              visible on the website.
            </p>

            {hasUnsavedChanges && (
              <p className="mt-2 text-xs font-medium text-amber-700">
                You have unsaved changes.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveDraft}
              disabled={
                isBusy ||
                !hasUnsavedChanges
              }
              className="min-h-11 rounded-xl border border-[#0B253B] bg-white px-6 py-3 text-sm font-semibold text-[#0B253B] transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? "Saving..."
                : "Save Draft"}
            </button>

            <button
              type="button"
              onClick={publishDraft}
              disabled={!canPublish}
              className="min-h-11 rounded-xl bg-[#0B253B] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#19435E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPublishing
                ? "Publishing..."
                : "Publish FAQs"}
            </button>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <a
            href="/dev/home-preview"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#0B253B] underline underline-offset-4 hover:text-[#19435E]"
          >
            View static homepage design reference
          </a>
        </div>
      </section>
    </div>
  );
}
