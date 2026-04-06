import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.SUPABASE_KEY;

function getEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY) in .env.local"
    );
  }
  return { supabaseUrl, supabaseAnonKey };
}

/** Use only in Route Handlers (auth callback, login, logout) where cookies can be set. */
export async function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getEnv();
  const cookieStore = await cookies();
  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

/** Read-only cookies (setAll no-op). Use in Server Components and Server Actions. */
async function createReadOnlyClient() {
  const { supabaseUrl, supabaseAnonKey } = getEnv();
  const cookieStore = await cookies();
  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // No-op: cookie writes only allowed in Route Handlers
      },
    },
  });
}

export const getCachedClient = cache(createReadOnlyClient);

export const getCachedUser = cache(async () => {
  const supabase = await getCachedClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
});
