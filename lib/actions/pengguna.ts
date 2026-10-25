"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSuperAdmin } from "@/lib/auth-guard";
import { friendlyDbError } from "@/lib/friendly-db-error";
import type { RolePengguna } from "@/lib/get-current-profile";

export interface PenggunaActionState {
  error: string | null;
  success?: boolean;
}

const BUKAN_SUPER_ADMIN = "Hanya Super Admin yang boleh mengelola akun.";
const ROLE_VALID: RolePengguna[] = ["super_admin", "admin"];
// Durasi blokir Supabase Auth untuk akun nonaktif (~100 tahun).
const BAN_NONAKTIF = "876000h";

type AdminClient = ReturnType<typeof createAdminClient>;

// Pengaman: harus selalu tersisa minimal 1 Super Admin aktif.
async function sisaSuperAdminAktifSelain(admin: AdminClient, id: string): Promise<number> {
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin")
    .eq("aktif", true)
    .neq("id", id);
  return count ?? 0;
}

export async function tambahPengguna(_prev: PenggunaActionState, formData: FormData): Promise<PenggunaActionState> {
  if (!(await getSuperAdmin())) return { error: BUKAN_SUPER_ADMIN };

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const nama = (formData.get("nama") as string)?.trim() || null;
  const password = formData.get("password") as string;
  const role = formData.get("role") as RolePengguna;

  if (!email || !password) return { error: "Email dan kata sandi wajib diisi." };
  if (password.length < 6) return { error: "Kata sandi minimal 6 karakter." };
  if (!ROLE_VALID.includes(role)) return { error: "Role tidak dikenali." };

  const admin = createAdminClient();
  // email_confirm: akun langsung aktif -- dibuat Super Admin, bukan daftar sendiri.
  // Baris profiles dibuat trigger handle_new_user (nama dari user_metadata).
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nama },
  });
  if (error) {
    return { error: error.message.includes("already been registered") ? "Email ini sudah terdaftar." : error.message };
  }

  const { error: profileError } = await admin.from("profiles").update({ role, nama }).eq("id", created.user.id);
  if (profileError) return { error: friendlyDbError(profileError, "Akun dibuat, tapi gagal menyimpan role.") };

  revalidatePath("/admin/pengguna");
  return { error: null, success: true };
}

export async function ubahPengguna(id: string, _prev: PenggunaActionState, formData: FormData): Promise<PenggunaActionState> {
  const me = await getSuperAdmin();
  if (!me) return { error: BUKAN_SUPER_ADMIN };

  const nama = (formData.get("nama") as string)?.trim() || null;
  const role = formData.get("role") as RolePengguna;
  const password = formData.get("password") as string;

  if (!ROLE_VALID.includes(role)) return { error: "Role tidak dikenali." };
  if (password && password.length < 6) return { error: "Kata sandi baru minimal 6 karakter." };

  const admin = createAdminClient();
  if (role !== "super_admin") {
    if (id === me.id) return { error: "Tidak bisa menurunkan role akun sendiri." };
    if ((await sisaSuperAdminAktifSelain(admin, id)) === 0) return { error: "Harus tersisa minimal 1 Super Admin aktif." };
  }

  const { error } = await admin.from("profiles").update({ nama, role }).eq("id", id);
  if (error) return { error: friendlyDbError(error, "Gagal menyimpan perubahan akun.") };

  if (password) {
    const { error: pwError } = await admin.auth.admin.updateUserById(id, { password });
    if (pwError) return { error: `Perubahan disimpan, tapi gagal mereset kata sandi: ${pwError.message}` };
  }

  revalidatePath("/admin/pengguna");
  return { error: null, success: true };
}

// Nonaktif = profiles.aktif false + diblokir di Supabase Auth (sesi yang
// sedang login ikut terputus saat token diperbarui, dan tidak bisa login lagi).
export async function setAktifPengguna(id: string, aktif: boolean): Promise<PenggunaActionState> {
  const me = await getSuperAdmin();
  if (!me) return { error: BUKAN_SUPER_ADMIN };
  if (!aktif && id === me.id) return { error: "Tidak bisa menonaktifkan akun sendiri." };

  const admin = createAdminClient();
  if (!aktif) {
    const { data: target } = await admin.from("profiles").select("role").eq("id", id).maybeSingle();
    if (target?.role === "super_admin" && (await sisaSuperAdminAktifSelain(admin, id)) === 0) {
      return { error: "Harus tersisa minimal 1 Super Admin aktif." };
    }
  }

  const { error: banError } = await admin.auth.admin.updateUserById(id, { ban_duration: aktif ? "none" : BAN_NONAKTIF });
  if (banError) return { error: `Gagal ${aktif ? "membuka blokir" : "memblokir"} akun: ${banError.message}` };

  const { error } = await admin.from("profiles").update({ aktif }).eq("id", id);
  if (error) return { error: friendlyDbError(error, "Gagal mengubah status akun.") };

  revalidatePath("/admin/pengguna");
  return { error: null, success: true };
}
