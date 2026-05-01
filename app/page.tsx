import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = user ? await isCurrentUserAdmin() : false;

  return (
    <main className="min-h-screen px-6 py-14 sm:py-20">
      <section className="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/95 shadow-xl shadow-zinc-200/60 backdrop-blur">
        <div className="border-b border-zinc-100 bg-gradient-to-r from-teal-50/70 via-white to-blue-50/70 px-8 py-10 sm:px-12">
          <p className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold tracking-wide text-teal-700 uppercase">
            Prompt Chain Tool
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Manage humor flavors and test caption generation
          </h1>
          <p className="mt-3 max-w-2xl text-base text-zinc-600">
            Central workspace for flavor configuration, step editing, and end-to-end caption testing with the pipeline
            API.
          </p>
        </div>

        <div className="space-y-6 px-8 py-8 sm:px-12 sm:py-10">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
              <p className="text-sm font-semibold text-zinc-900">Flavor management</p>
              <p className="mt-1 text-sm text-zinc-600">Create, duplicate, and maintain prompt-chain steps.</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
              <p className="text-sm font-semibold text-zinc-900">Pipeline validation</p>
              <p className="mt-1 text-sm text-zinc-600">Run caption generation against each flavor before shipping.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              isAdmin ? (
                <Link
                  href="/admin"
                  className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  Open Admin
                </Link>
              ) : (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Signed in, but this account does not have admin access.
                </p>
              )
            ) : (
              <Link
                href="/auth/login"
                prefetch={false}
                className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </Link>
            )}
            {user ? (
              <LogoutButton className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-zinc-100" />
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
