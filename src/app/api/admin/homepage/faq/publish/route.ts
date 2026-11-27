
import {
  NextRequest,
  NextResponse,
} from "next/server";

import { cookies } from "next/headers";

const SESSION_COOKIE = "avail_admin_session";

// =====================================
// PUBLISH FAQ DRAFT
// =====================================

export async function POST(request: NextRequest) {
  // ---------------------------------
  // 1. Verify request origin
  // ---------------------------------

  const origin = request.headers.get("origin");

  if (
    !origin ||
    origin !== request.nextUrl.origin
  ) {
    return NextResponse.json(
      { detail: "Invalid request origin" },
      { status: 403 }
    );
  }

  // ---------------------------------
  // 2. Verify admin session
  // ---------------------------------

  const session = (await cookies()).get(
    SESSION_COOKIE
  )?.value;

  if (!session) {
    return NextResponse.json(
      { detail: "Authentication required" },
      { status: 401 }
    );
  }

  // ---------------------------------
  // 3. Check FastAPI URL
  // ---------------------------------

  const apiBaseUrl = process.env.API_BASE_URL;

  if (!apiBaseUrl) {
    return NextResponse.json(
      { detail: "API_BASE_URL is not configured" },
      { status: 500 }
    );
  }

  // ---------------------------------
  // 4. Parse request body
  // ---------------------------------

  let payload: unknown;

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
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    return NextResponse.json(
      { detail: "Invalid FAQ publish request" },
      { status: 400 }
    );
  }

  const data = payload as Record<string, unknown>;

  if (
    !Number.isInteger(
      data.expected_draft_version
    ) ||
    (data.expected_draft_version as number) < 1
  ) {
    return NextResponse.json(
      { detail: "Invalid FAQ draft version" },
      { status: 400 }
    );
  }

  // ---------------------------------
  // 6. Forward to FastAPI
  // ---------------------------------

  try {
    const response = await fetch(
      `${apiBaseUrl.replace(/\/+$/, "")}/api/v1/admin/homepage/faq/publish`,
      {
        method: "POST",
        cache: "no-store",

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Cookie: `${SESSION_COOKIE}=${session}`,
          Origin: origin,
        },

        body: JSON.stringify(payload),

        signal: AbortSignal.timeout(15000),
      }
    );

    const responseText = await response.text();

    let responseData: unknown;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { detail: "Invalid response from FastAPI" },
        { status: 502 }
      );
    }

    return NextResponse.json(
      responseData,
      {
        status: response.status,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { detail: "Unable to connect to FastAPI" },
      { status: 502 }
    );
  }
}
