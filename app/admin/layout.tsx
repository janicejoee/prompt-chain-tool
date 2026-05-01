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
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold">Prompt Chain Admin</h1>
          <p className="text-sm text-zinc-600">{user.email}</p>
        </div>
        <LogoutButton
          redirect="/"
          className="cursor-pointer rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-100"
        />
      </div>
      <nav className="mb-6 flex gap-3 text-sm">
        <Link href="/admin" className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 hover:bg-zinc-100">
          Dashboard
        </Link>
        <Link
          href="/admin/flavors"
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 hover:bg-zinc-100"
        >
          Humor Flavors
        </Link>
      </nav>
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
