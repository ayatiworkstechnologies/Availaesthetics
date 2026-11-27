"use client";

import { useMemo, useState } from "react";

import type {
  HomepageLocation,
} from "@/lib/cms/homepage-locations-preview";

type HomepageLocationsContent = {
  heading: string;
  description: string;
  locations: HomepageLocation[];
  defaultSelectedLocationId: string | null;
};

type CmsResponse = {
  draft_content: HomepageLocationsContent | null;
  published_content: HomepageLocationsContent | null;
  draft_version: number;
  published_version: number;
};

type Props = {
  initialContent: HomepageLocationsContent;
  initialDraftVersion: number;
  initialPublishedVersion: number;
  initialHasPublishedContent: boolean;
};

function copyContent(
  content: HomepageLocationsContent
): HomepageLocationsContent {
  return {
    ...content,
    locations: content.locations.map((location) => ({
      ...location,
    })),
  };
}

function getErrorMessage(
  data: unknown,
  fallback: string
): string {
  if (data && typeof data === "object" && "detail" in data) {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

export default function LocationsEditor({
  initialContent,
  initialDraftVersion,
  initialPublishedVersion,
  initialHasPublishedContent,
}: Props) {
  const [content, setContent] = useState(
    () => copyContent(initialContent)
  );
  const [savedContent, setSavedContent] = useState(
    () => initialDraftVersion > 0
      ? copyContent(initialContent)
      : null
  );
  const [draftVersion, setDraftVersion] = useState(
    initialDraftVersion
  );
  const [publishedVersion, setPublishedVersion] = useState(
    initialPublishedVersion
  );
  const [hasPublishedContent, setHasPublishedContent] = useState(
    initialHasPublishedContent
  );
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const hasUnsavedChanges = useMemo(
    () => savedContent === null ||
      JSON.stringify(content) !== JSON.stringify(savedContent),
    [content, savedContent]
  );

  const canPublish =
    !hasUnsavedChanges &&
    draftVersion > publishedVersion &&
    !saving &&
    !publishing;

  function changed(next: HomepageLocationsContent) {
    setContent(next);
    setMessage("");
    setError("");
  }

  function updateLocation(
    id: string,
    field: keyof HomepageLocation,
    value: string
  ) {
    changed({
      ...content,
      locations: content.locations.map((location) =>
        location.id === id
          ? {
              ...location,
              [field]:
                field === "phone" || field === "phoneHref"
                  ? (value || null)
                  : value,
            }
          : location
      ),
    });
  }

  function addLocation() {
    if (content.locations.length >= 20) {
      setError("Maximum 20 homepage locations allowed.");
      return;
    }

    const id = `homepage-location-${crypto.randomUUID()}`;
    changed({
      ...content,
      locations: [
        ...content.locations,
        {
          id,
          name: "",
          regionLabel: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          postalCode: "",
          country: "USA",
          phone: null,
          phoneHref: null,
          mapsUrl: "https://www.google.com/maps",
          mapEmbedUrl: "https://www.google.com/maps/embed",
        },
      ],
      defaultSelectedLocationId:
        content.defaultSelectedLocationId ?? id,
    });
  }

  function removeLocation(id: string) {
    const locations = content.locations.filter(
      (location) => location.id !== id
    );
    changed({
      ...content,
      locations,
      defaultSelectedLocationId:
        content.defaultSelectedLocationId === id
          ? (locations[0]?.id ?? null)
          : content.defaultSelectedLocationId,
    });
  }

  function moveLocation(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= content.locations.length) return;
    const locations = [...content.locations];
    [locations[index], locations[target]] = [
      locations[target],
      locations[index],
    ];
    changed({ ...content, locations });
  }

  function validate(): string | null {
    if (!content.heading.trim()) return "Heading is required.";
    if (!content.description.trim()) return "Description is required.";
    if (content.locations.length === 0) {
      return "Add at least one homepage location.";
    }
    for (const location of content.locations) {
      if (
        !location.name.trim() ||
        !location.addressLine1.trim() ||
        !location.city.trim() ||
        !location.state.trim() ||
        !location.country.trim()
      ) {
        return "Every location needs a name and complete address.";
      }
      if (!location.mapsUrl.trim() || !location.mapEmbedUrl.trim()) {
        return `Google Maps URLs are required for ${location.name}.`;
      }
    }
    return null;
  }

  async function saveDraft() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        "/api/admin/homepage/locations/draft",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            expected_draft_version: draftVersion,
            content,
          }),
        }
      );
      const data: unknown = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Unable to save draft."));
      }
      const result = data as CmsResponse;
      if (!result.draft_content) {
        throw new Error("Saved draft content was not returned.");
      }
      const saved = copyContent(result.draft_content);
      setContent(copyContent(saved));
      setSavedContent(saved);
      setDraftVersion(result.draft_version);
      setPublishedVersion(result.published_version);
      setMessage(`Homepage Locations draft v${result.draft_version} saved.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save draft.");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!canPublish) return;
    setPublishing(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        "/api/admin/homepage/locations/publish",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            expected_draft_version: draftVersion,
          }),
        }
      );
      const data: unknown = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Unable to publish."));
      }
      const result = data as CmsResponse;
      setPublishedVersion(result.published_version);
      setHasPublishedContent(result.published_content !== null);
      setMessage(`Homepage Locations v${result.published_version} published.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to publish.");
    } finally {
      setPublishing(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-[#356B63]";

  return (
    <div className="mt-10 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Status label="Draft Version" value={`v${draftVersion}`} />
        <Status label="Published Version" value={`v${publishedVersion}`} />
        <Status
          label="Publication Status"
          value={
            hasUnsavedChanges
              ? "Unsaved Changes"
              : !hasPublishedContent
                ? "Not Published"
                : draftVersion > publishedVersion
                  ? "Draft Pending"
                  : "Published"
          }
        />
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-5 sm:p-8">
        <h2 className="text-xl font-semibold text-stone-900">Section Content</h2>
        <div className="mt-6 space-y-5">
          <Field label="Heading">
            <input
              value={content.heading}
              maxLength={200}
              onChange={(event) => changed({ ...content, heading: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Description">
            <textarea
              value={content.description}
              rows={4}
              maxLength={1000}
              onChange={(event) => changed({ ...content, description: event.target.value })}
              className={`${inputClass} resize-y`}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-stone-900">Homepage Location Cards</h2>
            <p className="mt-1 text-sm text-stone-500">
              {content.locations.length} locations configured
            </p>
          </div>
          <button
            type="button"
            onClick={addLocation}
            disabled={saving || publishing || content.locations.length >= 20}
            className="rounded-lg bg-[#356B63] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            + Add Homepage Location
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {content.locations.map((location, index) => (
            <div key={location.id} className="rounded-xl border border-stone-200 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-stone-900">Location {index + 1}</h3>
                <div className="flex gap-2">
                  <button type="button" disabled={index === 0} onClick={() => moveLocation(index, -1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">↑</button>
                  <button type="button" disabled={index === content.locations.length - 1} onClick={() => moveLocation(index, 1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">↓</button>
                  <button type="button" onClick={() => removeLocation(location.id)} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700">Remove</button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {([
                  ["name", "Clinic Name"],
                  ["regionLabel", "Region Label"],
                  ["addressLine1", "Address Line 1"],
                  ["addressLine2", "Address Line 2"],
                  ["city", "City"],
                  ["state", "State"],
                  ["postalCode", "Postal Code"],
                  ["country", "Country"],
                  ["phone", "Phone"],
                  ["phoneHref", "Telephone URL"],
                  ["mapsUrl", "Google Maps URL"],
                  ["mapEmbedUrl", "Google Maps Embed URL"],
                ] as const).map(([field, label]) => (
                  <Field key={field} label={label}>
                    <input
                      value={location[field] ?? ""}
                      onChange={(event) => updateLocation(location.id, field, event.target.value)}
                      className={inputClass}
                    />
                  </Field>
                ))}
              </div>

              <label className="mt-5 flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="radio"
                  name="default-location"
                  checked={content.defaultSelectedLocationId === location.id}
                  onChange={() => changed({ ...content, defaultSelectedLocationId: location.id })}
                  className="accent-[#356B63]"
                />
                Default selected map
              </label>
            </div>
          ))}
        </div>
      </section>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {message && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>}

      <section className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white p-5">
        <button type="button" onClick={saveDraft} disabled={saving || publishing || !hasUnsavedChanges} className="rounded-lg border border-[#356B63] px-5 py-3 text-sm font-semibold text-[#356B63] disabled:opacity-50">
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button type="button" onClick={publish} disabled={!canPublish} className="rounded-lg bg-[#356B63] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {publishing ? "Publishing..." : "Publish"}
        </button>
      </section>
    </div>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-2 font-semibold text-stone-900">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}
