import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getRedirectTarget(request: Request): string {
  const url = new URL(request.url);
  const redirectParam = url.searchParams.get("redirect");
  const origin = request.headers.get("origin") ?? url.origin;
  if (redirectParam?.startsWith("/")) return origin + redirectParam;
  return origin;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(getRedirectTarget(request));
}
