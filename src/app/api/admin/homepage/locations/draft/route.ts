
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "avail_admin_session";

type LocationsDraftPayload = {
  expected_draft_version: number;
  content: {
    heading: string;
    description: string;
    locations: unknown[];
    defaultSelectedLocationId: string | null;
  };
};

export async function PUT(request: NextRequest) {
  // 1. Verify the browser request origin.
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { detail: "Invalid request origin" },
      { status: 403 }
    );
  }

  // 2. Require an existing admin session.
  const session = (await cookies()).get(
    SESSION_COOKIE
  )?.value;

  if (!session) {
    return NextResponse.json(
      { detail: "Authentication required" },
      { status: 401 }
    );
  }

  // 3. Read the configured FastAPI address.
  const apiBaseUrl = process.env.API_BASE_URL;

  if (!apiBaseUrl) {
    return NextResponse.json(
      { detail: "API_BASE_URL is not configured" },
      { status: 500 }
    );
  }

  // 4. Parse JSON.
  let payload: LocationsDraftPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON request body" },
      { status: 400 }
    );
  }

  // 5. Perform basic request validation.
  // FastAPI/Pydantic performs full validation.
  if (
    !payload ||
    !Number.isInteger(payload.expected_draft_version) ||
    payload.expected_draft_version < 0 ||
    !payload.content ||
    typeof payload.content.heading !== "string" ||
    !payload.content.heading.trim() ||
    typeof payload.content.description !== "string" ||
    !payload.content.description.trim() ||
    !Array.isArray(payload.content.locations) ||
    !(
      payload.content.defaultSelectedLocationId === null ||
      (
        typeof payload.content.defaultSelectedLocationId === "string" &&
        Boolean(payload.content.defaultSelectedLocationId.trim())
      )
    )
  ) {
    return NextResponse.json(
      { detail: "Invalid Homepage Locations draft request" },
      { status: 400 }
    );
  }

  // 6. Forward to FastAPI.
  try {
    const response = await fetch(
      `${apiBaseUrl.replace(/\/+$/, "")}/api/v1/admin/homepage/locations/draft`,
      {
        method: "PUT",
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
        {
          detail: "Invalid response from FastAPI",
        },
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
