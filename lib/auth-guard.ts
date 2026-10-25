import "server-only";
import { redirect } from "next/navigation";
import { getCurrentProfile, type CurrentProfile } from "@/lib/get-current-profile";

// Server action & route handler bisa dipanggil langsung tanpa lewat halaman,
// jadi wewenang WAJIB dicek ulang di sana (RLS database tetap jadi lapis
// terakhir). Akun nonaktif sudah dianggap tanpa profil oleh getCurrentProfile.

export async function getPengelola(): Promise<CurrentProfile | null> {
  const { profile } = await getCurrentProfile();
  return profile;
}

export async function getSuperAdmin(): Promise<CurrentProfile | null> {
  const { profile } = await getCurrentProfile();
  return profile?.role === "super_admin" ? profile : null;
}

// Untuk halaman: alihkan ke login / dashboard admin bila tidak berwenang.
export async function requirePengelolaPage(): Promise<CurrentProfile> {
  const profile = await getPengelola();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireSuperAdminPage(): Promise<CurrentProfile> {
  const profile = await requirePengelolaPage();
  if (profile.role !== "super_admin") redirect("/admin");
  return profile;
}
