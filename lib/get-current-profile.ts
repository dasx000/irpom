import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type RolePengguna = "super_admin" | "admin";

export interface CurrentProfile {
  id: string;
  email: string;
  nama: string | null;
  role: RolePengguna;
}

// cache() dedupe pemanggilan dalam satu request yang sama -- layout dan
// page sama-sama butuh profil, tanpa ini jadi 2x round-trip ke Supabase.
// profile null kalau belum login, profilnya tidak ada, atau akun nonaktif.
export const getCurrentProfile = cache(async (): Promise<{ userId: string; profile: CurrentProfile | null }> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { userId: "", profile: null };

  const { data, error } = await supabase
    .from("profiles")
    .select("email, nama, role, aktif")
    .eq("id", user.id)
    .maybeSingle<{ email: string; nama: string | null; role: RolePengguna; aktif: boolean }>();

  if (error) console.error("[getCurrentProfile] gagal membaca profiles:", error.message);
  if (!data || !data.aktif) return { userId: user.id, profile: null };

  return {
    userId: user.id,
    profile: { id: user.id, email: data.email, nama: data.nama, role: data.role },
  };
});

export function isSuperAdmin(profile: CurrentProfile | null): boolean {
  return profile?.role === "super_admin";
}
