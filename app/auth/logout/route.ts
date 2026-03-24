import { NextResponse } from "next/server";
import { getCachedClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await getCachedClient();
  await supabase.auth.signOut();

  const url = new URL(request.url);
  const redirect = url.searchParams.get("next") ?? "/";
  return NextResponse.redirect(new URL(redirect, url.origin));
}
