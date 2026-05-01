import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getRedirectTarget(request: Request, redirectOverride?: string | null): string {
  const url = new URL(request.url);
  const origin = request.headers.get("origin") ?? url.origin;
  if (redirectOverride?.startsWith("/")) return origin + redirectOverride;
  const redirectParam = url.searchParams.get("redirect");
  if (redirectParam?.startsWith("/")) return origin + redirectParam;
  return origin + "/";
}

export async function POST(request: Request) {
  let redirectPath: string | null = null;
  try {
    const formData = await request.formData();
    const raw = formData.get("redirect");
    if (typeof raw === "string") redirectPath = raw;
  } catch {}

  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(getRedirectTarget(request, redirectPath));
}

/** GET does not sign out (prefetch/RSC). Use POST via LogoutButton. */
export async function GET() {
  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
