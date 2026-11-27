
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// =====================================
// PUBLISH REQUEST TYPE
// =====================================

type WhyAvailPublishRequest = {
  expected_draft_version: number;
};

// =====================================
// PUBLISH WHY AVAIL CONTENT
// =====================================

export async function POST(request: NextRequest) {
  // ---------------------------------
  // 1. VERIFY SAME-ORIGIN REQUEST
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
  // 2. READ AUTHENTICATED ADMIN SESSION
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
  // 3. READ FASTAPI CONFIGURATION
  // ---------------------------------

  const apiUrl = process.env.API_BASE_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { detail: "API_BASE_URL is not configured" },
      { status: 500 }
    );
  }

  // ---------------------------------
  // 4. PARSE PUBLISH REQUEST
  // ---------------------------------

  let payload: WhyAvailPublishRequest;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON request body" },
      { status: 400 }
    );
  }

  // ---------------------------------
  // 5. VALIDATE DRAFT VERSION
  // ---------------------------------

  if (
    !payload ||
    !Number.isInteger(
      payload.expected_draft_version
    ) ||
    payload.expected_draft_version < 1
  ) {
    return NextResponse.json(
      { detail: "Invalid Why Avail draft version" },
      { status: 400 }
    );
  }

  // ---------------------------------
  // 6. FORWARD PUBLISH TO FASTAPI
  // ---------------------------------

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/v1/admin/homepage/why-avail/publish`,
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
