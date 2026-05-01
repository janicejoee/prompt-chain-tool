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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Overview</h2>
        <p className="mt-1 text-sm text-zinc-600">Quick status of prompt-chain configuration data.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Humor Flavors</p>
          <p className="mt-2 text-2xl font-semibold">{flavors ?? 0}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Flavor Steps</p>
          <p className="mt-2 text-2xl font-semibold">{steps ?? 0}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Captions</p>
          <p className="mt-2 text-2xl font-semibold">{captions ?? 0}</p>
        </div>
      </div>
      <Link
        href="/admin/flavors"
        className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
      >
        Manage Humor Flavors
      </Link>
    </div>
  );
}
