
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";


export type LocationRecord = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  publication_status: string;
  created_at: string;
};


type EditLocationFormProps = {
  location: LocationRecord;
};


export default function EditLocationForm({
  location,
}: EditLocationFormProps) {
  const router = useRouter();

  const [name, setName] = useState(location.name);
  const [slug, setSlug] = useState(location.slug);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasChanges =
    name !== location.name ||
    slug !== location.slug;


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/locations/${location.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim(),
          }),
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!response.ok) {
        setError(
          typeof result.detail === "string"
            ? result.detail
            : "Unable to update clinic details."
        );
        return;
      }

      router.replace("/admin/locations");
      router.refresh();
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }


  return (
    <form
      onSubmit={handleSubmit}
      className="mt-9 space-y-6 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8"
    >
      <div>
        <label
          htmlFor="clinic-name"
          className="mb-2 block text-sm font-medium text-stone-800"
        >
          Clinic Name
        </label>

        <input
          id="clinic-name"
          type="text"
          required
          minLength={2}
          maxLength={150}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none focus:border-stone-800 focus:ring-2 focus:ring-stone-100"
        />
      </div>

      <div>
        <label
          htmlFor="clinic-slug"
          className="mb-2 block text-sm font-medium text-stone-800"
        >
          URL Slug
        </label>

        <input
          id="clinic-slug"
          type="text"
          required
          minLength={2}
          maxLength={150}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none focus:border-stone-800 focus:ring-2 focus:ring-stone-100"
        />

        <p className="mt-2 text-xs text-stone-500">
          Changing the slug will change the clinic&apos;s
          future public URL. Use lowercase letters,
          numbers and hyphens.
        </p>
      </div>

      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
        <p className="text-sm font-medium text-stone-800">
          Publication Status: Draft
        </p>

        <p className="mt-1 text-xs text-stone-500">
          Editing these details will not publish the clinic.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3 border-t border-stone-100 pt-6">
        <Link
          href="/admin/locations"
          className="rounded-lg border border-stone-300 px-6 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={loading || !hasChanges}
          className="rounded-lg bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Saving Changes..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
