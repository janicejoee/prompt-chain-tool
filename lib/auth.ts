import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

type AdminProfile = {
  is_superadmin: boolean | null;
  is_matrix_admin: boolean | null;
};

export const getCachedAdminProfile = cache(async (): Promise<AdminProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("is_superadmin, is_matrix_admin")
    .eq("id", user.id)
    .single<AdminProfile>();

  if (error || !data) return null;
  return data;
});

export async function isCurrentUserAdmin() {
  const profile = await getCachedAdminProfile();
  return Boolean(profile?.is_superadmin || profile?.is_matrix_admin);
}
