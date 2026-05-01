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
  } catch {
    // empty body
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(getRedirectTarget(request, redirectPath));
}

/** Never sign out on GET — Next prefetches Link targets and RSC may GET this route. */
export async function GET() {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><title>Sign out</title></head>
<body style="font-family:system-ui;margin:2rem">
  <p>If you opened this URL directly, use the button below to sign out.</p>
  <form method="post" action="/auth/logout">
    <input type="hidden" name="redirect" value="/" />
    <button type="submit">Sign out</button>
  </form>
</body>
</html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
}
