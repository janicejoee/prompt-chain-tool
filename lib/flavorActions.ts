import { createClient } from "@/lib/supabase/server";
import type { HumorFlavor, HumorFlavorStep } from "@/lib/types/humor";

type CreateHumorFlavorInput = {
  slug: string;
  description: string;
  is_pinned?: boolean;
};

export async function createHumorFlavor(
  flavor: CreateHumorFlavorInput
): Promise<HumorFlavor> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("humor_flavors")
    .insert({
      slug: flavor.slug,
      description: flavor.description || null,
      is_pinned: flavor.is_pinned || false,
    })
    .select()
    .single<HumorFlavor>();

  if (error) {
    console.error("Error creating humor flavor:", error);
    throw new Error(error.message);
  }

  return data;
}

type UpdateHumorFlavorInput = {
  id: number;
  slug: string;
  description: string;
};

export async function updateHumorFlavor(
  flavor: UpdateHumorFlavorInput
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("humor_flavors")
    .update({ slug: flavor.slug, description: flavor.description || null })
    .eq("id", flavor.id);
  if (error) throw new Error(error.message);
}

export async function deleteHumorFlavor(id: number): Promise<void> {
  const supabase = await createClient();
  const { error: stepDeleteError } = await supabase
    .from("humor_flavor_steps")
    .delete()
    .eq("humor_flavor_id", id);
  if (stepDeleteError) throw new Error(`Delete steps failed: ${stepDeleteError.message}`);

  const { error: flavorDeleteError } = await supabase
    .from("humor_flavors")
    .delete()
    .eq("id", id);
  if (flavorDeleteError) throw new Error(`Delete flavor failed: ${flavorDeleteError.message}`);
}

type CreateHumorFlavorStepInput = {
  humor_flavor_id: number;
  created_by_user_id: string;
  description: string;
  llm_system_prompt: string;
  llm_user_prompt: string;
  llm_temperature: number;
  llm_model_id: number;
  llm_input_type_id: number;
  llm_output_type_id: number;
  humor_flavor_step_type_id: number;
};

export async function createHumorFlavorStep(
  step: CreateHumorFlavorStepInput
): Promise<void> {
  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("humor_flavor_steps")
    .select("order_by")
    .eq("humor_flavor_id", step.humor_flavor_id)
    .order("order_by", { ascending: false })
    .limit(1);
  if (existingError) throw new Error(`Load existing steps failed: ${existingError.message}`);

  const nextOrder = (existing?.[0]?.order_by ?? 0) + 1;
  const { error } = await supabase.from("humor_flavor_steps").insert({
    humor_flavor_id: step.humor_flavor_id,
    created_by_user_id: step.created_by_user_id,
    order_by: nextOrder,
    description: step.description || null,
    llm_system_prompt: step.llm_system_prompt || null,
    llm_user_prompt: step.llm_user_prompt || null,
    llm_temperature: step.llm_temperature,
    llm_model_id: step.llm_model_id,
    llm_input_type_id: step.llm_input_type_id,
    llm_output_type_id: step.llm_output_type_id,
    humor_flavor_step_type_id: step.humor_flavor_step_type_id,
  });
  if (error) throw new Error(error.message);
}

type UpdateHumorFlavorStepInput = {
  id: number;
  description: string;
  llm_system_prompt: string;
  llm_user_prompt: string;
  llm_temperature: number;
  llm_model_id: number;
  llm_input_type_id: number;
  llm_output_type_id: number;
  humor_flavor_step_type_id: number;
};

export async function updateHumorFlavorStep(
  step: UpdateHumorFlavorStepInput
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("humor_flavor_steps")
    .update({
      description: step.description || null,
      llm_system_prompt: step.llm_system_prompt || null,
      llm_user_prompt: step.llm_user_prompt || null,
      llm_temperature: step.llm_temperature,
      llm_model_id: step.llm_model_id,
      llm_input_type_id: step.llm_input_type_id,
      llm_output_type_id: step.llm_output_type_id,
      humor_flavor_step_type_id: step.humor_flavor_step_type_id,
    })
    .eq("id", step.id);
  if (error) throw new Error(error.message);
}

export async function deleteHumorFlavorStep(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("humor_flavor_steps").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function moveHumorFlavorStep(
  id: number,
  flavorId: number,
  direction: "up" | "down"
): Promise<void> {
  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from("humor_flavor_steps")
    .select("id, order_by")
    .eq("id", id)
    .single<{ id: number; order_by: number }>();
  if (currentError || !current) {
    throw new Error(`Load current step failed: ${currentError?.message ?? "Step not found."}`);
  }

  const query = supabase
    .from("humor_flavor_steps")
    .select("id, order_by")
    .eq("humor_flavor_id", flavorId);
  const { data: neighbor, error: neighborError } =
    direction === "up"
      ? await query.lt("order_by", current.order_by).order("order_by", { ascending: false }).limit(1)
      : await query.gt("order_by", current.order_by).order("order_by", { ascending: true }).limit(1);
  if (neighborError) throw new Error(`Load neighboring step failed: ${neighborError.message}`);
  if (!neighbor?.length) return;

  const other = neighbor[0] as { id: number; order_by: number };
  const { error: updateAError } = await supabase
    .from("humor_flavor_steps")
    .update({ order_by: other.order_by })
    .eq("id", current.id);
  if (updateAError) throw new Error(`Reorder step failed: ${updateAError.message}`);

  const { error: updateBError } = await supabase
    .from("humor_flavor_steps")
    .update({ order_by: current.order_by })
    .eq("id", other.id);
  if (updateBError) throw new Error(`Reorder step failed: ${updateBError.message}`);
}
