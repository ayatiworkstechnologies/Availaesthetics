
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "avail_admin_session";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  // Require a same-origin browser request.
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
    !("name" in payload) ||
    !("slug" in payload) ||
    typeof payload.name !== "string" ||
    typeof payload.slug !== "string"
  ) {
    return NextResponse.json(
      { detail: "Clinic name and slug are required" },
      { status: 400 }
    );
  }

  const apiUrl =
    process.env.API_BASE_URL ??
    "http://127.0.0.1:8000";

  try {
    const backendResponse = await fetch(
      `${apiUrl}/api/v1/admin/locations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${COOKIE_NAME}=${sessionToken}`,
          Origin: origin,
        },
        body: JSON.stringify({
          name: payload.name,
          slug: payload.slug,
        }),
        cache: "no-store",
      }
    );

    const data = await backendResponse.json();

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
