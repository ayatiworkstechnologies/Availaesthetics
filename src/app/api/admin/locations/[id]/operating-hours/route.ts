
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "avail_admin_session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  // Require a same-origin browser request.
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { detail: "Invalid request origin" },
      { status: 403 }
    );
  }

  const sessionToken =
    request.cookies.get(COOKIE_NAME)?.value;

  if (!sessionToken) {
    return NextResponse.json(
      { detail: "Authentication required" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const locationId = Number(id);

  if (
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(locationId)
  ) {
    return NextResponse.json(
      { detail: "Invalid clinic ID" },
      { status: 400 }
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON request" },
      { status: 400 }
    );
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    !("days" in payload) ||
    !Array.isArray(payload.days)
  ) {
    return NextResponse.json(
      { detail: "A weekly schedule is required" },
      { status: 400 }
    );
  }

  const apiUrl =
    process.env.API_BASE_URL ??
    "http://127.0.0.1:8000";

  try {
    const backendResponse = await fetch(
      `${apiUrl}/api/v1/admin/locations/${locationId}/operating-hours`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${COOKIE_NAME}=${sessionToken}`,
          Origin: origin,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const data = await backendResponse.json().catch(
      () => ({
        detail: "Unexpected backend response",
      })
    );

    return NextResponse.json(data, {
      status: backendResponse.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "Backend service unavailable" },
      { status: 502 }
    );
  }
}
