
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "avail_admin_session";

// =====================================
// POST - PUBLISH HOMEPAGE HERO
// =====================================

export async function POST(request: NextRequest) {
  // 1. Verify same-origin request.
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { detail: "Invalid request origin" },
      {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  // 2. Read the authenticated session.
  const sessionToken =
    request.cookies.get(COOKIE_NAME)?.value;

  if (!sessionToken) {
    return NextResponse.json(
      { detail: "Authentication required" },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  // 3. Read the backend URL from .env.local.
  const apiUrl = process.env.API_BASE_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { detail: "Backend API is not configured" },
      { status: 500 }
    );
  }

  // 4. Parse the request body.
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON request" },
      { status: 400 }
    );
  }

  // 5. Check the request structure.
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    return NextResponse.json(
      { detail: "Invalid publish request" },
      { status: 400 }
    );
  }

  const expectedVersion =
    "expected_draft_version" in payload
      ? payload.expected_draft_version
      : undefined;

  if (
    typeof expectedVersion !== "number" ||
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion < 1
  ) {
    return NextResponse.json(
      {
        detail:
          "expected_draft_version must be a positive integer",
      },
      { status: 400 }
    );
  }

  // 6. Forward to the protected FastAPI API.
  try {
    const backendResponse = await fetch(
      `${apiUrl}/api/v1/admin/homepage/hero/publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${COOKIE_NAME}=${sessionToken}`,
          Origin: origin,
        },
        body: JSON.stringify({
          expected_draft_version: expectedVersion,
        }),
        cache: "no-store",
      }
    );

    const data: unknown =
      await backendResponse.json();

    // Preserve FastAPI status codes:
    // 200, 401, 403, 409, 422, etc.
    return NextResponse.json(data, {
      status: backendResponse.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "Backend service unavailable" },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
