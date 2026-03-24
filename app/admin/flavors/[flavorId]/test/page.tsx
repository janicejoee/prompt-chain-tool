import Link from "next/link";
import { FlavorTester } from "@/components/flavor-tester";

export const dynamic = "force-dynamic";

export default async function FlavorTestPage({
  params,
}: {
  params: Promise<{ flavorId: string }>;
}) {
  const { flavorId } = await params;
  const id = Number(flavorId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Test Flavor #{id}</h2>
        <Link
          href={`/admin/flavors/${id}`}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
        >
          Back to flavor
        </Link>
      </div>
      <p className="text-sm text-zinc-600">
        Select an image set to run the full pipeline: presign upload URL, upload image bytes,
        register image URL, then generate captions with this humor flavor.
      </p>
      <FlavorTester flavorId={id} />
    </div>
  );
}
