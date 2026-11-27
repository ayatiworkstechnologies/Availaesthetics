
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// =====================================
// WHY AVAIL CMS REQUEST TYPES
// =====================================

type ComparisonFeature = {
  id: string;
  label: string;
  avail: boolean | null;
  others: boolean | null;
};

type WhyAvailContent = {
  heading: string;
  imageSrc: string | null;
  imageAlt: string;
  logoSrc: string | null;
  logoAlt: string;
  othersHeading: string;
  consultationLabel: string;
  features: ComparisonFeature[];
};

type WhyAvailDraftRequest = {
  expected_draft_version: number;
  content: WhyAvailContent;
};

// =====================================
// SAVE WHY AVAIL DRAFT
// =====================================

export async function PUT(request: NextRequest) {
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
  // 4. PARSE REQUEST BODY
  // ---------------------------------

  let payload: WhyAvailDraftRequest;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON request body" },
      { status: 400 }
    );
  }

  // ---------------------------------
  // 5. BASIC REQUEST VALIDATION
  // ---------------------------------

  if (
    !payload ||
    !Number.isInteger(
      payload.expected_draft_version
    ) ||
    payload.expected_draft_version < 0 ||
    !payload.content ||
    typeof payload.content.heading !== "string" ||
    !payload.content.heading.trim() ||
    typeof payload.content.othersHeading !== "string" ||
    !payload.content.othersHeading.trim() ||
    typeof payload.content.consultationLabel !== "string" ||
    !payload.content.consultationLabel.trim() ||
    !Array.isArray(payload.content.features)
  ) {
    return NextResponse.json(
      { detail: "Invalid Why Avail draft request" },
      { status: 400 }
    );
  }

  // ---------------------------------
  // 6. FORWARD REQUEST TO FASTAPI
  // ---------------------------------

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/v1/admin/homepage/why-avail/draft`,
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
