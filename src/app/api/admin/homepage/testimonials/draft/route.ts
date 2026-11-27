
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// =====================================
// REQUEST TYPES
// =====================================

type TestimonialItem = {
  id: string;
  quote: string;
  author: string;
};

type TestimonialsDraftRequest = {
  expected_draft_version: number;
  content: {
    heading: string;
    testimonials: TestimonialItem[];
  };
};

// =====================================
// SAVE TESTIMONIALS DRAFT
// =====================================

export async function PUT(request: NextRequest) {
  // ---------------------------------
  // 1. Verify same-origin request
  // ---------------------------------

  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { detail: "Invalid request origin" },
      { status: 403 }
    );
  }

  // ---------------------------------
  // 2. Read authenticated admin session
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
  // 3. Verify FastAPI configuration
  // ---------------------------------

  const apiUrl = process.env.API_BASE_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { detail: "API_BASE_URL is not configured" },
      { status: 500 }
    );
  }

  // ---------------------------------
  // 4. Parse request body
  // ---------------------------------

  let payload: TestimonialsDraftRequest;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON request body" },
      { status: 400 }
    );
  }

  // ---------------------------------
  // 5. Basic request validation
  // ---------------------------------

  if (
    !payload ||
    !Number.isInteger(payload.expected_draft_version) ||
    payload.expected_draft_version < 0 ||
    !payload.content ||
    typeof payload.content.heading !== "string" ||
    !payload.content.heading.trim() ||
    !Array.isArray(payload.content.testimonials)
  ) {
    return NextResponse.json(
      { detail: "Invalid Testimonials draft request" },
      { status: 400 }
    );
  }

  // ---------------------------------
  // 6. Forward request to FastAPI
  // ---------------------------------

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/v1/admin/homepage/testimonials/draft`,
      {
        method: "PUT",
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
