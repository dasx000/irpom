"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { friendlyDbError } from "@/lib/friendly-db-error";

export interface ProfilActionState {
  error: string | null;
  success?: boolean;
}

// Edit profil sendiri -- cuma nama & kata sandi. Role/status akun tidak bisa
// diubah lewat sini (database hanya mengizinkan kolom nama diubah sendiri),
// jadi tidak ada risiko eskalasi hak akses lewat halaman ini.
export async function updateProfilSendiri(
  _prevState: ProfilActionState,
  formData: FormData
): Promise<ProfilActionState> {
  const { profile } = await getCurrentProfile();
  if (!profile) return { error: "Sesi tidak ditemukan, silakan login ulang." };

  const nama = (formData.get("nama") as string)?.trim() || null;
  const password = formData.get("password") as string;

  if (password && password.length < 6) return { error: "Kata sandi baru minimal 6 karakter." };

  const supabase = await createClient();

  const { error: profileError } = await supabase.from("profiles").update({ nama }).eq("id", profile.id);
  if (profileError) return { error: friendlyDbError(profileError, "Gagal menyimpan perubahan profil.") };

  if (password) {
    const { error: passwordError } = await supabase.auth.updateUser({ password });
    if (passwordError) return { error: `Profil disimpan, tapi gagal mengganti kata sandi: ${passwordError.message}` };
  }

  revalidatePath("/admin/profil");
  return { error: null, success: true };
}
