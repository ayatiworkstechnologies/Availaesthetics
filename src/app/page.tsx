
import { Suspense } from "react";

type HealthResponse = {
  status: string;
  message: string;
};

// This component fetches live backend data
async function BackendStatus() {
  const response = await fetch(
    `${process.env.API_BASE_URL}/api/v1/health`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Backend connection failed");
  }

  const data: HealthResponse = await response.json();

  return (
    <div className="mt-6 rounded-lg border p-5">
      <h2 className="text-xl font-semibold">
        Backend Connection
      </h2>

      <p className="mt-3">
        Status: {data.status}
      </p>

      <p>{data.message}</p>
    </div>
  );
}

// This page renders immediately
export default function HomePage() {
  return (
    <main className="min-h-screen p-10">
      <h1 className="text-3xl font-bold">
        Avail Aesthetics MD
      </h1>

      <Suspense fallback={
        <p className="mt-4">
          Connecting to FastAPI...
        </p>
      }>
        <BackendStatus />
      </Suspense>
    </main>
  );
}
