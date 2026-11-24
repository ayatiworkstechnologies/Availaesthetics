
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export type OperatingHourRecord = {
  day_of_week: number;
  is_closed: boolean;
  opening_time: string | null;
  closing_time: string | null;
};

export type OperatingHoursResponse = {
  location_id: number;
  configured: boolean;
  days: OperatingHourRecord[];
};

type DayMode = "unset" | "open" | "closed";

type FormDay = {
  day_of_week: number;
  mode: DayMode;
  opening_time: string;
  closing_time: string;
};

type Props = {
  locationId: number;
  initialHours: OperatingHoursResponse;
  readOnly: boolean;
};

function toTimeInput(
  value: string | null
): string {
  // FastAPI may return "09:00:00".
  // HTML time inputs use "09:00".
  return value ? value.slice(0, 5) : "";
}

function buildFormDays(
  response: OperatingHoursResponse
): FormDay[] {
  return WEEKDAYS.map((_, index) => {
    const record = response.days.find(
      (day) => day.day_of_week === index
    );

    if (!record) {
      return {
        day_of_week: index,
        mode: "unset" as DayMode,
        opening_time: "",
        closing_time: "",
      };
    }

    return {
      day_of_week: index,
      mode: record.is_closed ? "closed" : "open",
      opening_time: record.is_closed
        ? ""
        : toTimeInput(record.opening_time),
      closing_time: record.is_closed
        ? ""
        : toTimeInput(record.closing_time),
    };
  });
}

export default function OperatingHoursForm({
  locationId,
  initialHours,
  readOnly,
}: Props) {
  const router = useRouter();

  const [days, setDays] = useState<FormDay[]>(
    () => buildFormDays(initialHours)
  );

  const [savedSnapshot, setSavedSnapshot] =
    useState(() =>
      JSON.stringify(buildFormDays(initialHours))
    );

  const [configured, setConfigured] = useState(
    initialHours.configured
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasChanges =
    JSON.stringify(days) !== savedSnapshot;

  const selectedDays = days.filter(
    (day) => day.mode !== "unset"
  ).length;

  function updateMode(
    dayIndex: number,
    mode: DayMode
  ) {
    setDays((previous) =>
      previous.map((day) =>
        day.day_of_week === dayIndex
          ? {
              ...day,
              mode,
              opening_time:
                mode === "open"
                  ? day.opening_time
                  : "",
              closing_time:
                mode === "open"
                  ? day.closing_time
                  : "",
            }
          : day
      )
    );

    setError("");
    setSuccess("");
  }

  function updateTime(
    dayIndex: number,
    field: "opening_time" | "closing_time",
    value: string
  ) {
    setDays((previous) =>
      previous.map((day) =>
        day.day_of_week === dayIndex
          ? { ...day, [field]: value }
          : day
      )
    );

    setError("");
    setSuccess("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (readOnly || loading || !hasChanges) {
      return;
    }

    setError("");
    setSuccess("");

    // Every weekday must be explicitly configured.
    if (days.some((day) => day.mode === "unset")) {
      setError(
        "Choose Open or Closed for all seven days."
      );
      return;
    }

    for (const day of days) {
      if (day.mode !== "open") {
        continue;
      }

      if (
        !day.opening_time ||
        !day.closing_time
      ) {
        setError(
          `${WEEKDAYS[day.day_of_week]} requires opening and closing times.`
        );
        return;
      }

      if (
        day.opening_time >= day.closing_time
      ) {
        setError(
          `${WEEKDAYS[day.day_of_week]}: Closing time must be later than opening time.`
        );
        return;
      }
    }

    const payload = {
      days: days.map((day) => ({
        day_of_week: day.day_of_week,
        is_closed: day.mode === "closed",
        opening_time:
          day.mode === "open"
            ? day.opening_time
            : null,
        closing_time:
          day.mode === "open"
            ? day.closing_time
            : null,
      })),
    };

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/locations/${locationId}/operating-hours`,
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
            : "Unable to save operating hours. Check all seven days."
        );
        return;
      }

      const savedHours =
        result as OperatingHoursResponse;

      const normalizedDays =
        buildFormDays(savedHours);

      setDays(normalizedDays);
      setSavedSnapshot(
        JSON.stringify(normalizedDays)
      );
      setConfigured(savedHours.configured);

      setSuccess(
        "Operating hours saved successfully."
      );

      router.refresh();
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-9 space-y-6"
    >
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">

        {/* Section Heading */}
        <div className="border-b border-stone-200 px-6 py-5 sm:px-8">
          <h2 className="text-lg font-semibold text-stone-900">
            Weekly Operating Hours
          </h2>

          <p className="mt-2 text-sm text-stone-500">
            Set the regular opening and closing hours
            for each day of the week.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            <span className="rounded-full bg-stone-100 px-3 py-1.5 font-medium text-stone-700">
              {configured
                ? "Schedule Configured"
                : "Not Configured"}
            </span>

            <span className="text-stone-500">
              {selectedDays} / 7 days selected
            </span>
          </div>
        </div>

        {/* Weekday Rows */}
        <div className="divide-y divide-stone-100">
          {days.map((day) => (
            <div
              key={day.day_of_week}
              className="p-6 sm:px-8"
            >
              <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-start">

                <div className="pt-2">
                  <p className="font-semibold text-stone-900">
                    {WEEKDAYS[day.day_of_week]}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor={`status-${day.day_of_week}`}
                      className="mb-2 block text-xs font-medium text-stone-600"
                    >
                      Day Status
                    </label>

                    <select
                      id={`status-${day.day_of_week}`}
                      value={day.mode}
                      disabled={readOnly || loading}
                      onChange={(event) =>
                        updateMode(
                          day.day_of_week,
                          event.target.value as DayMode
                        )
                      }
                      className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm text-stone-800 disabled:bg-stone-50"
                    >
                      <option value="unset">
                        Not Set
                      </option>

                      <option value="open">
                        Open
                      </option>

                      <option value="closed">
                        Closed
                      </option>
                    </select>
                  </div>

                  {day.mode === "open" && (
                    <div className="grid gap-4 sm:grid-cols-2">

                      <div>
                        <label
                          htmlFor={`opens-${day.day_of_week}`}
                          className="mb-2 block text-xs font-medium text-stone-600"
                        >
                          Opening Time
                        </label>

                        <input
                          id={`opens-${day.day_of_week}`}
                          type="time"
                          required
                          value={day.opening_time}
                          disabled={readOnly || loading}
                          onChange={(event) =>
                            updateTime(
                              day.day_of_week,
                              "opening_time",
                              event.target.value
                            )
                          }
                          className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm text-stone-800 disabled:bg-stone-50"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`closes-${day.day_of_week}`}
                          className="mb-2 block text-xs font-medium text-stone-600"
                        >
                          Closing Time
                        </label>

                        <input
                          id={`closes-${day.day_of_week}`}
                          type="time"
                          required
                          value={day.closing_time}
                          disabled={readOnly || loading}
                          onChange={(event) =>
                            updateTime(
                              day.day_of_week,
                              "closing_time",
                              event.target.value
                            )
                          }
                          className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm text-stone-800 disabled:bg-stone-50"
                        />
                      </div>

                    </div>
                  )}

                  {day.mode === "closed" && (
                    <p className="rounded-lg bg-stone-50 px-4 py-3 text-sm text-stone-500">
                      The clinic is closed on this day.
                    </p>
                  )}

                  {day.mode === "unset" && (
                    <p className="text-xs text-amber-700">
                      Select Open or Closed before saving.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Form Feedback */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-800"
        >
          {success}
        </div>
      )}

      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-stone-500">
            This saves the clinic's regular weekly hours.
            It does not publish the clinic or create appointments.
          </p>

          <button
            type="submit"
            disabled={loading || !hasChanges}
            className="rounded-lg bg-stone-900 px-7 py-3 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Saving Hours..."
              : "Save Operating Hours"}
          </button>
        </div>
      )}
    </form>
  );
}
