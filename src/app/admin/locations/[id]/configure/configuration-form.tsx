
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";


export type LocationConfiguration = {
  location_id: number;

  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;

  phone: string | null;
  email: string | null;

  seo_title: string | null;
  seo_description: string | null;

  updated_at: string | null;
};


type FormValues = {
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  seo_title: string;
  seo_description: string;
};


type Props = {
  locationId: number;
  initialConfiguration: LocationConfiguration;
  readOnly: boolean;
};


export default function ConfigurationForm({
  locationId,
  initialConfiguration,
  readOnly,
}: Props) {
  const router = useRouter();

  const [values, setValues] = useState<FormValues>({
    address_line1:
      initialConfiguration.address_line1 ?? "",
    address_line2:
      initialConfiguration.address_line2 ?? "",
    city: initialConfiguration.city ?? "",
    state: initialConfiguration.state ?? "",
    postal_code:
      initialConfiguration.postal_code ?? "",
    country: initialConfiguration.country ?? "",
    phone: initialConfiguration.phone ?? "",
    email: initialConfiguration.email ?? "",
    seo_title:
      initialConfiguration.seo_title ?? "",
    seo_description:
      initialConfiguration.seo_description ?? "",
  });

  const [savedSnapshot, setSavedSnapshot] = useState(
    JSON.stringify(values)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasChanges =
    JSON.stringify(values) !== savedSnapshot;


  function updateField(
    field: keyof FormValues,
    value: string
  ) {
    setValues((previous) => ({
      ...previous,
      [field]: value,
    }));

    setSuccess("");
  }


  function renderField(
    field: keyof FormValues,
    label: string,
    maxLength: number,
    type: "text" | "email" | "tel" | "textarea" = "text"
  ) {
    const fieldClass =
      "w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none focus:border-stone-800 focus:ring-2 focus:ring-stone-100 disabled:bg-stone-50 disabled:text-stone-500";

    return (
      <div key={field}>
        <label
          htmlFor={field}
          className="mb-2 block text-sm font-medium text-stone-800"
        >
          {label}
        </label>

        {type === "textarea" ? (
          <textarea
            id={field}
            rows={4}
            maxLength={maxLength}
            value={values[field]}
            disabled={readOnly || loading}
            onChange={(event) =>
              updateField(field, event.target.value)
            }
            className={fieldClass}
          />
        ) : (
          <input
            id={field}
            type={type}
            maxLength={maxLength}
            value={values[field]}
            disabled={readOnly || loading}
            onChange={(event) =>
              updateField(field, event.target.value)
            }
            className={fieldClass}
          />
        )}
      </div>
    );
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (readOnly || loading || !hasChanges) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    // Convert empty optional fields to null.
    const payload = Object.fromEntries(
      Object.entries(values).map(
        ([key, value]) => [
          key,
          value.trim() || null,
        ]
      )
    );

    try {
      const response = await fetch(
        `/api/admin/locations/${locationId}/configuration`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify(payload),
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
            : "Please check the configuration details."
        );
        return;
      }

      const normalizedValues = Object.fromEntries(
        Object.entries(payload).map(
          ([key, value]) => [key, value ?? ""]
        )
      ) as FormValues;

      setValues(normalizedValues);
      setSavedSnapshot(
        JSON.stringify(normalizedValues)
      );

      setSuccess(
        "Clinic configuration saved successfully."
      );

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
      className="mt-9 space-y-8"
    >
      {/* Address Information */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-stone-900">
          Address Information
        </h2>

        <p className="mt-1 text-sm text-stone-500">
          Physical address of this clinic.
        </p>

        <div className="mt-6 space-y-5">
          {renderField(
            "address_line1",
            "Address Line 1",
            255
          )}

          {renderField(
            "address_line2",
            "Address Line 2",
            255
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            {renderField("city", "City", 100)}
            {renderField("state", "State", 100)}

            {renderField(
              "postal_code",
              "Postal Code",
              20
            )}

            {renderField(
              "country",
              "Country",
              100
            )}
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-stone-900">
          Contact Information
        </h2>

        <p className="mt-1 text-sm text-stone-500">
          Contact details for this clinic location.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {renderField(
            "phone",
            "Phone Number",
            30,
            "tel"
          )}

          {renderField(
            "email",
            "Email Address",
            254,
            "email"
          )}
        </div>
      </section>

      {/* SEO Information */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-stone-900">
          SEO Settings
        </h2>

        <p className="mt-1 text-sm text-stone-500">
          Search engine metadata for this clinic's
          future public page.
        </p>

        <div className="mt-6 space-y-5">
          {renderField(
            "seo_title",
            "SEO Page Title",
            160
          )}

          {renderField(
            "seo_description",
            "Meta Description",
            300,
            "textarea"
          )}
        </div>
      </section>

      {/* Feedback */}
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="rounded-lg bg-stone-100 p-4 text-sm text-stone-800"
        >
          {success}
        </p>
      )}

      {/* Save Button */}
      {!readOnly && (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !hasChanges}
            className="rounded-lg bg-stone-900 px-7 py-3 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Saving Configuration..."
              : "Save Configuration"}
          </button>
        </div>
      )}
    </form>
  );
}
