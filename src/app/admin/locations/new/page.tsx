
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";


function createSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}


export default function CreateClinicPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  function handleNameChange(value: string) {
    setName(value);

    if (!slugEdited) {
      setSlug(createSlug(value));
    }
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/admin/locations",
        {
          method: "POST",
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
            : "Please check the clinic details."
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
    <main className="min-h-screen bg-[#F7F5F1] px-5 py-10">
      <div className="mx-auto max-w-2xl">

        <Link
          href="/admin/locations"
          className="text-sm text-stone-500 hover:text-stone-900"
        >
          ← Back to Locations
        </Link>

        <div className="mt-8">
          <p className="text-sm text-stone-500">
            Avail Aesthetics MD / Administration
          </p>

          <h1 className="mt-3 text-3xl font-semibold text-stone-900">
            Add New Clinic
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            Create a clinic location. New locations
            are saved as drafts.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-9 space-y-6 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8"
        >
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-stone-800"
            >
              Clinic Name
            </label>

            <input
              id="name"
              type="text"
              required
              minLength={2}
              maxLength={150}
              value={name}
              onChange={(e) =>
                handleNameChange(e.target.value)
              }
              placeholder="e.g. Cypress"
              className="w-full rounded-lg border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none focus:border-stone-800 focus:ring-2 focus:ring-stone-100"
            />
          </div>

          <div>
            <label
              htmlFor="slug"
              className="mb-2 block text-sm font-medium text-stone-800"
            >
              URL Slug
            </label>

            <input
              id="slug"
              type="text"
              required
              minLength={2}
              maxLength={150}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugEdited(true);
              }}
              placeholder="e.g. cypress"
              className="w-full rounded-lg border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none focus:border-stone-800 focus:ring-2 focus:ring-stone-100"
            />

            <p className="mt-2 text-xs text-stone-500">
              Use lowercase letters, numbers and hyphens.
              Each clinic must have a unique slug.
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">
              Publication Status: Draft
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-800">
              This clinic will not appear on the public
              website until it is published.
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
              disabled={loading}
              className="rounded-lg bg-stone-900 px-6 py-3 text-sm font-medium text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Clinic"}
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}
