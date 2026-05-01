import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createFlavor, deleteFlavor, duplicateFlavor, updateFlavor } from "./actions";
import type { HumorFlavor } from "@/lib/types/humor";

export const dynamic = "force-dynamic";

export default async function FlavorsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; q?: string }>;
}) {
  const { error: actionError, q } = await searchParams;
  const slugQuery = q?.trim() ?? "";
  const supabase = await createClient();
  let query = supabase
    .from("humor_flavors")
    .select("id, slug, description, created_datetime_utc")
    .order("created_datetime_utc", { ascending: false });
  if (slugQuery) {
    query = query.ilike("slug", `%${slugQuery}%`);
  }
  const { data: flavors, error } = await query;

  if (error) {
    return <p className="text-red-600">Failed to load flavors: {error.message}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Humor Flavors</h2>
          <p className="text-sm text-zinc-600">
            Create, duplicate, edit, and delete humor flavors.
          </p>
        </div>
        <form className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 md:flex-row md:items-center">
          <input
            type="search"
            name="q"
            defaultValue={slugQuery}
            placeholder="Type slug keyword..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 md:w-72"
          />
          <button className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-100">
            Search
          </button>
          {slugQuery ? (
            <Link href="/admin/flavors" className="text-sm text-zinc-700 underline underline-offset-2">
              Clear
            </Link>
          ) : null}
        </form>
      </div>
      {actionError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}
      <form
        action={createFlavor}
        className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-3"
      >
        <input
          name="slug"
          required
          placeholder="Slug (e.g. dry-observational)"
          className="rounded border border-zinc-300 bg-white px-3 py-2"
        />
        <input
          name="description"
          placeholder="Description"
          className="rounded border border-zinc-300 bg-white px-3 py-2"
        />
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="is_pinned" className="h-4 w-4" />
          Is pinned
        </label>
        <button className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700">
          Create Flavor
        </button>
      </form>

      <div className="space-y-3">
        {(flavors as HumorFlavor[] | null)?.map((flavor) => (
          <div key={flavor.id} className="rounded-lg border border-zinc-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-900">
                  #{flavor.id} {flavor.slug}
                </p>
                <p className="text-sm text-zinc-600">
                  {flavor.description || "No description"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/flavors/${flavor.id}`}
                  className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
                >
                  Manage Steps
                </Link>
                <Link
                  href={`/admin/flavors/${flavor.id}/captions`}
                  className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
                >
                  Captions
                </Link>
                <Link
                  href={`/admin/flavors/${flavor.id}/test`}
                  className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
                >
                  Test
                </Link>
              </div>
            </div>
            <form action={updateFlavor} className="grid gap-2 md:grid-cols-4">
              <input type="hidden" name="id" value={flavor.id} />
              <input
                name="slug"
                defaultValue={flavor.slug}
                className="rounded border border-zinc-300 bg-white px-3 py-2"
              />
              <input
                name="description"
                defaultValue={flavor.description ?? ""}
                className="rounded border border-zinc-300 bg-white px-3 py-2 md:col-span-2"
              />
              <button className="rounded border border-zinc-300 px-3 py-2 hover:bg-zinc-100">Save</button>
            </form>
            <form
              action={duplicateFlavor}
              className="mt-3 flex flex-col gap-2 rounded-md border border-dashed border-zinc-300 bg-zinc-50/80 p-3 md:flex-row md:flex-wrap md:items-end"
            >
              <input type="hidden" name="source_id" value={flavor.id} />
              <div className="min-w-0 flex-1 md:max-w-xs">
                <label htmlFor={`dup-slug-${flavor.id}`} className="mb-1 block text-xs font-medium text-zinc-600">
                  Duplicate (new unique slug)
                </label>
                <input
                  id={`dup-slug-${flavor.id}`}
                  name="new_slug"
                  required
                  placeholder={`${flavor.slug}-copy`}
                  className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded border border-zinc-400 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-100"
              >
                Duplicate flavor and steps
              </button>
            </form>
            <form action={deleteFlavor} className="mt-2">
              <input type="hidden" name="id" value={flavor.id} />
              <button className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">
                Delete Flavor
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
