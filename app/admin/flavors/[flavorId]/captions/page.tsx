import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { CaptionRow } from "@/lib/types/humor";

export const dynamic = "force-dynamic";

export default async function FlavorCaptionsPage({
  params,
}: {
  params: Promise<{ flavorId: string }>;
}) {
  const { flavorId } = await params;
  const id = Number(flavorId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("captions")
    .select("id, content, image_id, humor_flavor_id, caption_request_id, created_datetime_utc, is_public")
    .eq("humor_flavor_id", id)
    .order("created_datetime_utc", { ascending: false })
    .limit(100);

  if (error) return <p className="text-red-600">Failed to load captions: {error.message}</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Captions for Flavor #{id}</h2>
        <Link
          href={`/admin/flavors/${id}`}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100"
        >
          Back to flavor
        </Link>
      </div>
      <div className="space-y-3">
        {(data as CaptionRow[] | null)?.map((caption) => (
          <div key={caption.id} className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
            <p className="text-sm leading-relaxed text-zinc-900">{caption.content}</p>
            <p className="mt-3 text-xs text-zinc-600">
              image: {caption.image_id} | public: {String(caption.is_public)} |{" "}
              {new Date(caption.created_datetime_utc).toLocaleString()}
            </p>
          </div>
        ))}
        {!data?.length ? (
          <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            No captions yet for this flavor.
          </p>
        ) : null}
      </div>
    </div>
  );
}
