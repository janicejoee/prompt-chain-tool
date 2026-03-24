import Link from "next/link";
import { notFound } from "next/navigation";
import { getCachedClient } from "@/lib/supabase/server";
import { createStep, deleteStep, moveStep, updateStep } from "../actions";
import type { HumorFlavor, HumorFlavorStep } from "@/lib/types/humor";

export const dynamic = "force-dynamic";

export default async function FlavorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ flavorId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { flavorId } = await params;
  const { error: actionError } = await searchParams;
  const id = Number(flavorId);
  if (!Number.isFinite(id)) notFound();

  const supabase = await getCachedClient();
  const [{ data: flavor }, { data: steps }] = await Promise.all([
    supabase
      .from("humor_flavors")
      .select("id, slug, description, created_datetime_utc")
      .eq("id", id)
      .single<HumorFlavor>(),
    supabase
      .from("humor_flavor_steps")
      .select(
        "id, humor_flavor_id, order_by, description, llm_system_prompt, llm_user_prompt, llm_temperature, llm_model_id, llm_input_type_id, llm_output_type_id, humor_flavor_step_type_id"
      )
      .eq("humor_flavor_id", id)
      .order("order_by", { ascending: true }),
  ]);

  if (!flavor) notFound();

  return (
    <div className="space-y-6">
      {actionError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Flavor #{flavor.id}: {flavor.slug}</h2>
          <p className="text-sm text-zinc-600">{flavor.description || "No description"}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/flavors/${id}/captions`}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
          >
            View Captions
          </Link>
          <Link
            href={`/admin/flavors/${id}/test`}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
          >
            Test Flavor
          </Link>
        </div>
      </div>

      <form action={createStep} className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <input type="hidden" name="humor_flavor_id" value={id} />
        <h3 className="font-medium">Create Step</h3>
        <input
          name="description"
          placeholder="Step description"
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2"
        />
        <textarea
          name="llm_system_prompt"
          placeholder="System prompt"
          className="h-24 w-full rounded border border-zinc-300 bg-white px-3 py-2"
        />
        <textarea
          name="llm_user_prompt"
          placeholder="User prompt"
          className="h-24 w-full rounded border border-zinc-300 bg-white px-3 py-2"
        />
        <div className="grid gap-2 md:grid-cols-5">
          <input name="llm_temperature" defaultValue="0.7" className="rounded border border-zinc-300 bg-white px-3 py-2" />
          <input name="llm_model_id" defaultValue="1" className="rounded border border-zinc-300 bg-white px-3 py-2" />
          <input name="llm_input_type_id" defaultValue="1" className="rounded border border-zinc-300 bg-white px-3 py-2" />
          <input name="llm_output_type_id" defaultValue="1" className="rounded border border-zinc-300 bg-white px-3 py-2" />
          <input
            name="humor_flavor_step_type_id"
            defaultValue="1"
            className="rounded border border-zinc-300 bg-white px-3 py-2"
          />
        </div>
        <button className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700">
          Add Step
        </button>
      </form>

      <div className="space-y-3">
        {(steps as HumorFlavorStep[] | null)?.map((step) => (
          <div key={step.id} className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium">Step {step.order_by}</p>
              <div className="flex gap-2">
                <form action={moveStep}>
                  <input type="hidden" name="id" value={step.id} />
                  <input type="hidden" name="humor_flavor_id" value={id} />
                  <input type="hidden" name="direction" value="up" />
                  <button className="rounded border border-zinc-300 px-2 py-1 text-sm hover:bg-zinc-100">Up</button>
                </form>
                <form action={moveStep}>
                  <input type="hidden" name="id" value={step.id} />
                  <input type="hidden" name="humor_flavor_id" value={id} />
                  <input type="hidden" name="direction" value="down" />
                  <button className="rounded border border-zinc-300 px-2 py-1 text-sm hover:bg-zinc-100">Down</button>
                </form>
              </div>
            </div>
            <form action={updateStep} className="space-y-2">
              <input type="hidden" name="id" value={step.id} />
              <input type="hidden" name="humor_flavor_id" value={id} />
              <input
                name="description"
                defaultValue={step.description ?? ""}
                className="w-full rounded border border-zinc-300 bg-white px-3 py-2"
              />
              <textarea
                name="llm_system_prompt"
                defaultValue={step.llm_system_prompt ?? ""}
                className="h-20 w-full rounded border border-zinc-300 bg-white px-3 py-2"
              />
              <textarea
                name="llm_user_prompt"
                defaultValue={step.llm_user_prompt ?? ""}
                className="h-20 w-full rounded border border-zinc-300 bg-white px-3 py-2"
              />
              <div className="grid gap-2 md:grid-cols-5">
                <input
                  name="llm_temperature"
                  defaultValue={step.llm_temperature ?? 0.7}
                  className="rounded border border-zinc-300 bg-white px-3 py-2"
                />
                <input
                  name="llm_model_id"
                  defaultValue={step.llm_model_id ?? 1}
                  className="rounded border border-zinc-300 bg-white px-3 py-2"
                />
                <input
                  name="llm_input_type_id"
                  defaultValue={step.llm_input_type_id ?? 1}
                  className="rounded border border-zinc-300 bg-white px-3 py-2"
                />
                <input
                  name="llm_output_type_id"
                  defaultValue={step.llm_output_type_id ?? 1}
                  className="rounded border border-zinc-300 bg-white px-3 py-2"
                />
                <input
                  name="humor_flavor_step_type_id"
                  defaultValue={step.humor_flavor_step_type_id ?? 1}
                  className="rounded border border-zinc-300 bg-white px-3 py-2"
                />
              </div>
              <div className="flex gap-2">
                <button className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100">
                  Save Step
                </button>
              </div>
            </form>
            <form action={deleteStep} className="mt-2">
              <input type="hidden" name="id" value={step.id} />
              <input type="hidden" name="humor_flavor_id" value={id} />
              <button className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">
                Delete Step
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
