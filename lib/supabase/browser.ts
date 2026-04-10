import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseCookieOptions } from "@/lib/supabase/ssr-shared";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export function createClient() {
  return createBrowserClient(supabaseUrl as string, supabaseAnonKey as string, {
    cookieOptions: getSupabaseCookieOptions(),
  });
}
