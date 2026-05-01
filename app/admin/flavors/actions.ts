"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createReadOnlyClient } from "@/lib/supabase/server";
import {
  createHumorFlavor,
  createHumorFlavorStep,
  deleteHumorFlavor,
  deleteHumorFlavorStep,
  duplicateHumorFlavorWithSteps,
  moveHumorFlavorStep,
  updateHumorFlavor,
  updateHumorFlavorStep,
} from "@/lib/flavorActions";

function asNumber(value: FormDataEntryValue | null, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function withError(path: string, message: string) {
  return `${path}?error=${encodeURIComponent(message)}`;
}

function safeFlavorErrorPath(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("/admin/flavors")) return t;
  return "/admin/flavors";
}

function getSubmittedUserId(formData: FormData): string | null {
  const raw = String(formData.get("created_by_user_id") ?? "").trim();
  return raw || null;
}

export async function createFlavor(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const isPinned = formData.get("is_pinned") === "on";
  if (!slug) {
    redirect(withError("/admin/flavors", "Slug is required."));
  }

  try {
    await createHumorFlavor({ slug, description, is_pinned: isPinned });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create flavor failed.";
    redirect(withError("/admin/flavors", `Create flavor failed: ${message}`));
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

  try {
    await updateHumorFlavor({ id, slug, description });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update flavor failed.";
    redirect(withError("/admin/flavors", `Update flavor failed: ${message}`));
  }

  revalidatePath("/admin/flavors");
  revalidatePath(`/admin/flavors/${id}`);
}

export async function deleteFlavor(formData: FormData) {
  const id = asNumber(formData.get("id"));
  if (!id) {
    redirect(withError("/admin/flavors", "Flavor id is required."));
  }

  try {
    await deleteHumorFlavor(id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete flavor failed.";
    redirect(withError("/admin/flavors", message));
  }

  revalidatePath("/admin/flavors");
}

export async function duplicateFlavor(formData: FormData) {
  const sourceId = asNumber(formData.get("source_id"));
  const newSlug = String(formData.get("new_slug") ?? "").trim();
  const errorPath = safeFlavorErrorPath(String(formData.get("error_path") ?? "/admin/flavors"));

  if (!sourceId || !newSlug) {
    redirect(withError(errorPath, "Source flavor and a new unique slug are required."));
  }

  const supabase = await createReadOnlyClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(withError("/auth/login", "Please log in again."));
  }

  let newFlavorId: number;
  try {
    const created = await duplicateHumorFlavorWithSteps({
      sourceFlavorId: sourceId,
      newSlug,
      createdByUserId: user.id,
    });
    newFlavorId = created.id;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Duplicate flavor failed.";
    redirect(withError(errorPath, message));
  }

  revalidatePath("/admin/flavors");
  revalidatePath(`/admin/flavors/${newFlavorId}`);
  redirect(`/admin/flavors/${newFlavorId}`);
}

export async function createStep(formData: FormData) {
  const flavorId = asNumber(formData.get("humor_flavor_id"));
  if (!flavorId) {
    redirect(withError("/admin/flavors", "Flavor id is required for creating a step."));
  }

  const userId = getSubmittedUserId(formData);
  if (!userId) {
    redirect(withError("/auth/login", "Please log in again."));
  }
  try {
    await createHumorFlavorStep({
      humor_flavor_id: flavorId,
      created_by_user_id: userId,
      description: String(formData.get("description") ?? "").trim(),
      llm_system_prompt: String(formData.get("llm_system_prompt") ?? "").trim(),
      llm_user_prompt: String(formData.get("llm_user_prompt") ?? "").trim(),
      llm_temperature: asNumber(formData.get("llm_temperature"), 0.7),
      llm_model_id: asNumber(formData.get("llm_model_id"), 1),
      llm_input_type_id: asNumber(formData.get("llm_input_type_id"), 1),
      llm_output_type_id: asNumber(formData.get("llm_output_type_id"), 1),
      humor_flavor_step_type_id: asNumber(formData.get("humor_flavor_step_type_id"), 1),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create step failed.";
    redirect(withError(`/admin/flavors/${flavorId}`, `Create step failed: ${message}`));
  }

  revalidatePath(`/admin/flavors/${flavorId}`);
}

export async function updateStep(formData: FormData) {
  const id = asNumber(formData.get("id"));
  const flavorId = asNumber(formData.get("humor_flavor_id"));
  if (!id || !flavorId) {
    redirect(withError("/admin/flavors", "Step id and flavor id are required."));
  }

  try {
    await updateHumorFlavorStep({
      id,
      description: String(formData.get("description") ?? "").trim(),
      llm_system_prompt: String(formData.get("llm_system_prompt") ?? "").trim(),
      llm_user_prompt: String(formData.get("llm_user_prompt") ?? "").trim(),
      llm_temperature: asNumber(formData.get("llm_temperature"), 0.7),
      llm_model_id: asNumber(formData.get("llm_model_id"), 1),
      llm_input_type_id: asNumber(formData.get("llm_input_type_id"), 1),
      llm_output_type_id: asNumber(formData.get("llm_output_type_id"), 1),
      humor_flavor_step_type_id: asNumber(formData.get("humor_flavor_step_type_id"), 1),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update step failed.";
    redirect(withError(`/admin/flavors/${flavorId}`, `Update step failed: ${message}`));
  }

  revalidatePath(`/admin/flavors/${flavorId}`);
}

export async function deleteStep(formData: FormData) {
  const id = asNumber(formData.get("id"));
  const flavorId = asNumber(formData.get("humor_flavor_id"));
  if (!id || !flavorId) {
    redirect(withError("/admin/flavors", "Step id and flavor id are required."));
  }

  try {
    await deleteHumorFlavorStep(id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete step failed.";
    redirect(withError(`/admin/flavors/${flavorId}`, `Delete step failed: ${message}`));
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

  try {
    await moveHumorFlavorStep(id, flavorId, direction === "up" ? "up" : "down");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reorder step failed.";
    redirect(withError(`/admin/flavors/${flavorId}`, message));
  }

  revalidatePath(`/admin/flavors/${flavorId}`);
}
