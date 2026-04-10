import type { CookieOptionsWithName } from "@supabase/ssr";

/** URL + anon key for Edge proxy and server; must match browser `NEXT_PUBLIC_*` usage. */
export function getSupabaseUrlAndAnonKey(): {
  supabaseUrl: string | undefined;
  supabaseAnonKey: string | undefined;
} {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

/**
 * Vercel serves HTTPS; `Secure` session cookies avoid browsers dropping them in stricter modes.
 * We only set this when `VERCEL` is set so `next start` on http://localhost still works.
 */
export function getSupabaseCookieOptions(): CookieOptionsWithName {
  if (process.env.VERCEL === "1") return { secure: true };
  return {};
}
