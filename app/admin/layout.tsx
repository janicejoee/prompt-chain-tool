import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) redirect("/forbidden");

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:py-10">
        <div className="mb-6 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 shadow-lg shadow-zinc-200/60">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 bg-gradient-to-r from-teal-50/70 via-white to-blue-50/70 px-5 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-teal-700 uppercase">Admin console</p>
              <h1 className="mt-1 text-xl font-semibold text-zinc-900">Prompt Chain Admin</h1>
              <p className="text-sm text-zinc-600">{user.email}</p>
            </div>
            <LogoutButton
              redirect="/"
              className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium transition hover:bg-zinc-100"
            />
          </div>
          <nav className="flex flex-wrap gap-3 px-5 py-3 text-sm">
            <Link href="/admin" className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 font-medium hover:bg-zinc-100">
              Dashboard
            </Link>
            <Link
              href="/admin/flavors"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 font-medium hover:bg-zinc-100"
            >
              Humor Flavors
            </Link>
          </nav>
        </div>
        <div className="rounded-2xl border border-zinc-200/90 bg-white/95 p-5 shadow-sm sm:p-6">{children}</div>
      </div>
    </div>
  );
}
