import Link from "next/link";
import { createReadOnlyClient } from "@/lib/supabase/server";
import type { CaptionRow } from "@/lib/types/humor";

export const dynamic = "force-dynamic";

export default async function FlavorCaptionsPage({
  params,
}: {
  params: Promise<{ flavorId: string }>;
}) {
  const { flavorId } = await params;
  const id = Number(flavorId);
  const supabase = await createReadOnlyClient();

  const { data, error } = await supabase
    .from("captions")
    .select("id, content, image_id, humor_flavor_id, caption_request_id, created_datetime_utc, is_public")
    .eq("humor_flavor_id", id)
    .order("created_datetime_utc", { ascending: false })
    .limit(100);

  if (error) return <p className="text-red-600">Failed to load captions: {error.message}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Captions for Flavor #{id}</h2>
        <Link
          href={`/admin/flavors/${id}`}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
        >
          Back to flavor
        </Link>
      </div>
      <div className="space-y-2">
        {(data as CaptionRow[] | null)?.map((caption) => (
          <div key={caption.id} className="rounded-lg border border-zinc-200 p-3">
            <p className="text-sm leading-relaxed">{caption.content}</p>
            <p className="mt-2 text-xs text-zinc-600">
              image: {caption.image_id} | public: {String(caption.is_public)} |{" "}
              {new Date(caption.created_datetime_utc).toLocaleString()}
            </p>
          </div>
        ))}
        {!data?.length ? (
          <p className="text-sm text-zinc-600">No captions yet for this flavor.</p>
        ) : null}
      </div>
    </div>
  );
}
