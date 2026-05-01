import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const supabase = await createClient();
  const [{ count: flavors }, { count: steps }, { count: captions }] = await Promise.all([
    supabase.from("humor_flavors").select("id", { count: "exact", head: true }),
    supabase.from("humor_flavor_steps").select("id", { count: "exact", head: true }),
    supabase.from("captions").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Overview</h2>
        <p className="mt-1 text-sm text-zinc-600">Quick status of prompt-chain configuration data.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-5">
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Humor Flavors</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{flavors ?? 0}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-5">
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Flavor Steps</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{steps ?? 0}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-5">
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Captions</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{captions ?? 0}</p>
        </div>
      </div>
      <Link
        href="/admin/flavors"
        className="inline-block rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
      >
        Manage Humor Flavors
      </Link>
    </div>
  );
}
