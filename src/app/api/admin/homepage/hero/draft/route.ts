
import { NextRequest, NextResponse } from "next/server";

// =====================================
// CONFIGURATION
// =====================================

const COOKIE_NAME = "avail_admin_session";

// =====================================
// SAVE HOMEPAGE HERO DRAFT
// =====================================

export async function PUT(request: NextRequest) {
  // ---------------------------------
  // 1. Verify same-origin request
  // ---------------------------------

  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      {
        detail: "Invalid request origin",
      },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  // ---------------------------------
  // 2. Read existing admin session
  // ---------------------------------

  const sessionToken = request.cookies.get(
    COOKIE_NAME
  )?.value;

  if (!sessionToken) {
    return NextResponse.json(
      {
        detail: "Authentication required",
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  // ---------------------------------
  // 3. Backend URL from .env.local
  // ---------------------------------

  const apiUrl = process.env.API_BASE_URL;

  if (!apiUrl) {
    return NextResponse.json(
      {
        detail: "Backend API is not configured",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  // ---------------------------------
  // 4. Parse JSON request
  // ---------------------------------

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        detail: "Invalid JSON request",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  // ---------------------------------
  // 5. Validate request structure
  // ---------------------------------

  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    return NextResponse.json(
      {
        detail: "Invalid Hero draft request",
      },
      {
        status: 400,
      }
    );
  }

  // Check expected draft version.
  const expectedVersion =
    "expected_draft_version" in payload
      ? payload.expected_draft_version
      : undefined;

  if (
    typeof expectedVersion !== "number" ||
    !Number.isInteger(expectedVersion) ||
    expectedVersion < 0
  ) {
    return NextResponse.json(
      {
        detail:
          "expected_draft_version must be a non-negative integer",
      },
      {
        status: 400,
      }
    );
  }

  // Check Hero content structure.
  const content =
    "content" in payload
      ? payload.content
      : undefined;

  if (
    !content ||
    typeof content !== "object" ||
    Array.isArray(content)
  ) {
    return NextResponse.json(
      {
        detail: "Hero content object is required",
      },
      {
        status: 400,
      }
    );
  }

  // Full content validation is performed
  // by the FastAPI Pydantic schema.

  // ---------------------------------
  // 6. Forward request to FastAPI
  // ---------------------------------

  try {
    const backendResponse = await fetch(
      `${apiUrl}/api/v1/admin/homepage/hero/draft`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",

          // Forward the existing session.
          Cookie: `${COOKIE_NAME}=${sessionToken}`,

          // Preserve the browser origin
          // for FastAPI origin verification.
          Origin: origin,
        },

        body: JSON.stringify(payload),

        cache: "no-store",
      }
    );

    // ---------------------------------
    // 7. Read backend response
    // ---------------------------------

    const data = await backendResponse.json();

    // ---------------------------------
    // 8. Preserve FastAPI response status
    // ---------------------------------

    return NextResponse.json(data, {
      status: backendResponse.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });

  } catch {
    return NextResponse.json(
      {
        detail: "Backend service unavailable",
      },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
