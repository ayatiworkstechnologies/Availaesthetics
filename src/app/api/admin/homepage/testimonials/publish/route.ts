
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// =====================================
// REQUEST TYPE
// =====================================

type TestimonialsPublishRequest = {
  expected_draft_version: number;
};

// =====================================
// PUBLISH TESTIMONIALS
// =====================================

export async function POST(request: NextRequest) {
  // ---------------------------------
  // 1. Validate request origin
  // ---------------------------------

  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { detail: "Invalid request origin" },
      { status: 403 }
    );
  }

  // ---------------------------------
  // 2. Read admin session
  // ---------------------------------

  const session = (await cookies()).get(
    "avail_admin_session"
  )?.value;

  if (!session) {
    return NextResponse.json(
      { detail: "Authentication required" },
      { status: 401 }
    );
  }

  // ---------------------------------
  // 3. Read backend URL
  // ---------------------------------

  const apiUrl = process.env.API_BASE_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { detail: "API_BASE_URL is not configured" },
      { status: 500 }
    );
  }

  // ---------------------------------
  // 4. Parse publish request
  // ---------------------------------

  let payload: TestimonialsPublishRequest;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON request body" },
      { status: 400 }
    );
  }

  // ---------------------------------
  // 5. Validate draft version
  // ---------------------------------

  if (
    !payload ||
    !Number.isInteger(payload.expected_draft_version) ||
    payload.expected_draft_version < 1
  ) {
    return NextResponse.json(
      { detail: "Invalid Testimonials draft version" },
      { status: 400 }
    );
  }

  // ---------------------------------
  // 6. Forward publish request
  // ---------------------------------

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/v1/admin/homepage/testimonials/publish`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Cookie: `avail_admin_session=${session}`,
          Origin: origin,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { detail: "Unable to connect to FastAPI" },
      { status: 502 }
    );
  }
}
