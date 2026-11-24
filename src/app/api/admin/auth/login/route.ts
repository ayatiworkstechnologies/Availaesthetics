
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  // Reject cross-origin login submissions.
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { detail: "Invalid request origin" },
      { status: 403 }
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
    !("email" in payload) ||
    !("password" in payload) ||
    typeof payload.email !== "string" ||
    typeof payload.password !== "string"
  ) {
    return NextResponse.json(
      { detail: "Email and password are required" },
      { status: 400 }
    );
  }

  const apiUrl =
    process.env.API_BASE_URL ?? "http://127.0.0.1:8000";

  try {
    const backendResponse = await fetch(
      `${apiUrl}/api/v1/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
        }),
        cache: "no-store",
      }
    );

    const data = await backendResponse.json();

    const response = NextResponse.json(data, {
      status: backendResponse.status,
    });

    response.headers.set("Cache-Control", "no-store");

    // Forward FastAPI's HttpOnly cookie to the browser.
    const setCookie = backendResponse.headers.get("set-cookie");

    if (backendResponse.ok && setCookie) {
      response.headers.append("Set-Cookie", setCookie);
    }

    return response;
  } catch {
    return NextResponse.json(
      { detail: "Authentication service unavailable" },
      { status: 502 }
    );
  }
}
