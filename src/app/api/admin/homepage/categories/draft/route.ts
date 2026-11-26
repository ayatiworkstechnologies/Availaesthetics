
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

type DraftRequest = {
  expected_draft_version: number;
  content: {
    cards: {
      id: string;
      title: string;
      imageSrc: string | null;
      imageAlt: string;
      href: string | null;
    }[];
    allTreatmentsHref: string | null;
  };
};

export async function PUT(request: NextRequest) {
  const origin = request.headers.get("origin");

  // Same-origin protection.
  if (origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { detail: "Invalid request origin" },
      { status: 403 }
    );
  }

  const session = (await cookies()).get(
    "avail_admin_session"
  )?.value;

  if (!session) {
    return NextResponse.json(
      { detail: "Authentication required" },
      { status: 401 }
    );
  }

  const apiUrl = process.env.API_BASE_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { detail: "Backend URL is not configured" },
      { status: 500 }
    );
  }

  let payload: DraftRequest;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON" },
      { status: 400 }
    );
  }

  if (
    !Number.isInteger(payload?.expected_draft_version) ||
    payload.expected_draft_version < 0 ||
    !payload.content ||
    !Array.isArray(payload.content.cards)
  ) {
    return NextResponse.json(
      { detail: "Invalid draft request" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/v1/admin/homepage/categories/draft`,
      {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Cookie: `avail_admin_session=${session}`,
          Origin: origin,
        },
        body: JSON.stringify(payload),
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
