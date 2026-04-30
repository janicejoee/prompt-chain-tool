import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRequestOrigin } from "@/lib/supabase/ssr-shared";

export async function GET(request: Request) {
  const supabase = await createClient();
  const origin = getRequestOrigin(request);
  const redirectTo = `${origin}/auth/callback`;

  const {
    data: { url },
    error,
  } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error.message)}`
    );
  }
  if (!url) {
    return NextResponse.redirect(`${origin}/auth/login?error=No+redirect+URL`);
  }
  return NextResponse.redirect(url);
}
