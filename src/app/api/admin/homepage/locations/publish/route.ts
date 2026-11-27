
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "avail_admin_session";

type LocationsPublishPayload = {
  expected_draft_version: number;
};

export async function POST(request: NextRequest) {
  // 1. Verify same-origin request.
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { detail: "Invalid request origin" },
      { status: 403 }
    );
  }

  // 2. Verify existing admin session.
  const session = (await cookies()).get(
    SESSION_COOKIE
  )?.value;

  if (!session) {
    return NextResponse.json(
      { detail: "Authentication required" },
      { status: 401 }
    );
  }

  // 3. Get FastAPI base URL.
  const apiBaseUrl = process.env.API_BASE_URL;

  if (!apiBaseUrl) {
    return NextResponse.json(
      { detail: "API_BASE_URL is not configured" },
      { status: 500 }
    );
  }

  // 4. Parse request body.
  let payload: LocationsPublishPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON request body" },
      { status: 400 }
    );
  }

  // 5. Validate expected draft version.
  if (
    !payload ||
    !Number.isInteger(payload.expected_draft_version) ||
    payload.expected_draft_version < 1
  ) {
    return NextResponse.json(
      { detail: "Invalid Homepage Locations draft version" },
      { status: 400 }
    );
  }

  // 6. Forward Publish request to FastAPI.
  try {
    const response = await fetch(
      `${apiBaseUrl.replace(/\/+$/, "")}/api/v1/admin/homepage/locations/publish`,
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

    let data: unknown;

    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { detail: "Invalid response from FastAPI" },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "Unable to connect to FastAPI" },
      { status: 502 }
    );
  }
}
