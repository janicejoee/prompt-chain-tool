import Link from "next/link";
import { notFound } from "next/navigation";
import { FlavorTester } from "@/components/flavor-tester";
import { createReadOnlyClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FlavorTestPage({
  params,
}: {
  params: Promise<{ flavorId: string }>;
}) {
  const { flavorId } = await params;
  const id = Number(flavorId);
  if (!Number.isFinite(id)) notFound();

  const supabase = await createReadOnlyClient();
  const { data: row } = await supabase.from("humor_flavors").select("slug").eq("id", id).single();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/admin/flavors/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-teal-800 hover:text-teal-950"
        >
          <span aria-hidden>←</span> Back to flavor
        </Link>
      </div>
      <FlavorTester flavorId={id} flavorSlug={row?.slug} />
    </div>
  );
}
