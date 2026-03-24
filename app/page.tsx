import Link from "next/link";
import { getCachedUser } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCachedUser();
  const isAdmin = user ? await isCurrentUserAdmin() : false;

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-16">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-semibold">Prompt Chain Tool</h1>
      <p className="mt-3 text-zinc-600">
        Manage humor flavors and test caption generation with the caption pipeline API.
      </p>
      <div className="mt-6 flex gap-3">
        {user ? (
          isAdmin ? (
            <Link
              href="/admin"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Open Admin
            </Link>
          ) : null
        ) : (
          <Link
            href="/auth/login"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Login
          </Link>
        )}
        {user ? (
          <>
            <Link href="/auth/logout" className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100">
              Logout
            </Link>
          </>
        ) : null}
      </div>
      </div>
    </div>
  );
}
