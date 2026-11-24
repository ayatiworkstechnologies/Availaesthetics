
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "avail_admin_session";

export async function POST(request: NextRequest) {
  // Reject requests originating from another website.
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { detail: "Invalid request origin" },
      { status: 403 }
    );
  }

  const sessionToken =
    request.cookies.get(COOKIE_NAME)?.value;

  // If the browser has no session, it is already logged out.
  if (!sessionToken) {
    const response = NextResponse.json({
      message: "Logged out successfully",
    });

    response.cookies.delete(COOKIE_NAME);
    response.headers.set("Cache-Control", "no-store");

    return response;
  }

  const apiUrl =
    process.env.API_BASE_URL ?? "http://127.0.0.1:8000";

  try {
    // Revoke the database session through FastAPI.
    const backendResponse = await fetch(
      `${apiUrl}/api/v1/auth/logout`,
      {
        method: "POST",
        headers: {
          Cookie: `${COOKIE_NAME}=${sessionToken}`,
        },
        cache: "no-store",
      }
    );

    if (!backendResponse.ok) {
      return NextResponse.json(
        { detail: "Unable to revoke session" },
        { status: 502 }
      );
    }

    // Clear the browser cookie only after revocation succeeds.
    const response = NextResponse.json({
      message: "Logged out successfully",
    });

    response.cookies.delete(COOKIE_NAME);
    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch {
    return NextResponse.json(
      { detail: "Authentication server unavailable" },
      { status: 502 }
    );
  }
}
