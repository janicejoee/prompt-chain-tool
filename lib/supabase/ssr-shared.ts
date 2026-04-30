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

function normalizeOrigin(origin: string): string {
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

/**
 * Build a stable app origin in production so OAuth/callback redirects stay on one host.
 * Prefer NEXT_PUBLIC_SITE_URL when set, then Vercel forwarded headers, then request URL.
 */
export function getRequestOrigin(request: Request): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredOrigin) return normalizeOrigin(configuredOrigin);

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
    return normalizeOrigin(`${forwardedProto}://${forwardedHost}`);
  }

  return normalizeOrigin(new URL(request.url).origin);
}
