"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCachedClient } from "@/lib/supabase/server";

function asNumber(value: FormDataEntryValue | null, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function withError(path: string, message: string) {
  return `${path}?error=${encodeURIComponent(message)}`;
}

export async function createFlavor(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!slug) {
    redirect(withError("/admin/flavors", "Slug is required."));
  }

  const supabase = await getCachedClient();
  const { error } = await supabase.from("humor_flavors").insert({
    slug,
    description: description || null,
  });
  if (error) {
    redirect(withError("/admin/flavors", `Create flavor failed: ${error.message}`));
  }
  revalidatePath("/admin/flavors");
}

export async function updateFlavor(formData: FormData) {
  const id = asNumber(formData.get("id"));
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!id || !slug) {
    redirect(withError("/admin/flavors", "Flavor id and slug are required."));
  }

  const supabase = await getCachedClient();
  const { error } = await supabase
    .from("humor_flavors")
    .update({ slug, description: description || null })
    .eq("id", id);
  if (error) {
    redirect(withError("/admin/flavors", `Update flavor failed: ${error.message}`));
  }

  revalidatePath("/admin/flavors");
  revalidatePath(`/admin/flavors/${id}`);
}

export async function deleteFlavor(formData: FormData) {
  const id = asNumber(formData.get("id"));
  if (!id) {
    redirect(withError("/admin/flavors", "Flavor id is required."));
  }

  const supabase = await getCachedClient();
  const { error: stepDeleteError } = await supabase
    .from("humor_flavor_steps")
    .delete()
    .eq("humor_flavor_id", id);
  if (stepDeleteError) {
    redirect(withError("/admin/flavors", `Delete steps failed: ${stepDeleteError.message}`));
  }
  const { error: flavorDeleteError } = await supabase
    .from("humor_flavors")
    .delete()
    .eq("id", id);
  if (flavorDeleteError) {
    redirect(withError("/admin/flavors", `Delete flavor failed: ${flavorDeleteError.message}`));
  }

  revalidatePath("/admin/flavors");
}

export async function createStep(formData: FormData) {
  const flavorId = asNumber(formData.get("humor_flavor_id"));
  if (!flavorId) {
    redirect(withError("/admin/flavors", "Flavor id is required for creating a step."));
  }

  const supabase = await getCachedClient();
  const { data: existing, error: existingError } = await supabase
    .from("humor_flavor_steps")
    .select("order_by")
    .eq("humor_flavor_id", flavorId)
    .order("order_by", { ascending: false })
    .limit(1);
  if (existingError) {
    redirect(
      withError(`/admin/flavors/${flavorId}`, `Load existing steps failed: ${existingError.message}`)
    );
  }
  const nextOrder = (existing?.[0]?.order_by ?? 0) + 1;

  const { error } = await supabase.from("humor_flavor_steps").insert({
    humor_flavor_id: flavorId,
    order_by: nextOrder,
    description: String(formData.get("description") ?? "").trim() || null,
    llm_system_prompt: String(formData.get("llm_system_prompt") ?? "").trim() || null,
    llm_user_prompt: String(formData.get("llm_user_prompt") ?? "").trim() || null,
    llm_temperature: asNumber(formData.get("llm_temperature"), 0.7),
    llm_model_id: asNumber(formData.get("llm_model_id"), 1),
    llm_input_type_id: asNumber(formData.get("llm_input_type_id"), 1),
    llm_output_type_id: asNumber(formData.get("llm_output_type_id"), 1),
    humor_flavor_step_type_id: asNumber(formData.get("humor_flavor_step_type_id"), 1),
  });
  if (error) {
    redirect(withError(`/admin/flavors/${flavorId}`, `Create step failed: ${error.message}`));
  }

  revalidatePath(`/admin/flavors/${flavorId}`);
}

export async function updateStep(formData: FormData) {
  const id = asNumber(formData.get("id"));
  const flavorId = asNumber(formData.get("humor_flavor_id"));
  if (!id || !flavorId) {
    redirect(withError("/admin/flavors", "Step id and flavor id are required."));
  }

  const supabase = await getCachedClient();
  const { error } = await supabase
    .from("humor_flavor_steps")
    .update({
      description: String(formData.get("description") ?? "").trim() || null,
      llm_system_prompt: String(formData.get("llm_system_prompt") ?? "").trim() || null,
      llm_user_prompt: String(formData.get("llm_user_prompt") ?? "").trim() || null,
      llm_temperature: asNumber(formData.get("llm_temperature"), 0.7),
      llm_model_id: asNumber(formData.get("llm_model_id"), 1),
      llm_input_type_id: asNumber(formData.get("llm_input_type_id"), 1),
      llm_output_type_id: asNumber(formData.get("llm_output_type_id"), 1),
      humor_flavor_step_type_id: asNumber(formData.get("humor_flavor_step_type_id"), 1),
    })
    .eq("id", id);
  if (error) {
    redirect(withError(`/admin/flavors/${flavorId}`, `Update step failed: ${error.message}`));
  }

  revalidatePath(`/admin/flavors/${flavorId}`);
}

export async function deleteStep(formData: FormData) {
  const id = asNumber(formData.get("id"));
  const flavorId = asNumber(formData.get("humor_flavor_id"));
  if (!id || !flavorId) {
    redirect(withError("/admin/flavors", "Step id and flavor id are required."));
  }

  const supabase = await getCachedClient();
  const { error } = await supabase.from("humor_flavor_steps").delete().eq("id", id);
  if (error) {
    redirect(withError(`/admin/flavors/${flavorId}`, `Delete step failed: ${error.message}`));
  }
  revalidatePath(`/admin/flavors/${flavorId}`);
}

export async function moveStep(formData: FormData) {
  const id = asNumber(formData.get("id"));
  const flavorId = asNumber(formData.get("humor_flavor_id"));
  const direction = String(formData.get("direction") ?? "up");
  if (!id || !flavorId) {
    redirect(withError("/admin/flavors", "Step id and flavor id are required."));
  }

  const supabase = await getCachedClient();
  const { data: current, error: currentError } = await supabase
    .from("humor_flavor_steps")
    .select("id, order_by")
    .eq("id", id)
    .single<{ id: number; order_by: number }>();
  if (currentError || !current) {
    redirect(
      withError(
        `/admin/flavors/${flavorId}`,
        `Load current step failed: ${currentError?.message ?? "Step not found."}`
      )
    );
  }

  const query = supabase
    .from("humor_flavor_steps")
    .select("id, order_by")
    .eq("humor_flavor_id", flavorId);
  const { data: neighbor, error: neighborError } =
    direction === "up"
      ? await query.lt("order_by", current.order_by).order("order_by", { ascending: false }).limit(1)
      : await query.gt("order_by", current.order_by).order("order_by", { ascending: true }).limit(1);
  if (neighborError) {
    redirect(
      withError(`/admin/flavors/${flavorId}`, `Load neighboring step failed: ${neighborError.message}`)
    );
  }

  if (!neighbor?.length) return;

  const other = neighbor[0] as { id: number; order_by: number };
  const { error: updateAError } = await supabase
    .from("humor_flavor_steps")
    .update({ order_by: other.order_by })
    .eq("id", current.id);
  if (updateAError) {
    redirect(withError(`/admin/flavors/${flavorId}`, `Reorder step failed: ${updateAError.message}`));
  }
  const { error: updateBError } = await supabase
    .from("humor_flavor_steps")
    .update({ order_by: current.order_by })
    .eq("id", other.id);
  if (updateBError) {
    redirect(withError(`/admin/flavors/${flavorId}`, `Reorder step failed: ${updateBError.message}`));
  }

  revalidatePath(`/admin/flavors/${flavorId}`);
}
