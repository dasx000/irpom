import { requireSuperAdminPage } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/admin/PageHeader";
import PenggunaManager, { type Pengguna } from "@/components/admin/PenggunaManager";

export default async function PenggunaPage() {
  const me = await requireSuperAdminPage();

  // RLS profiles: Super Admin boleh membaca semua akun.
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, email, nama, role, aktif, created_at").order("created_at");

  return (
    <div>
      <PageHeader
        title="Pengguna"
        description="Akun pengelola data. Pendaftaran publik dimatikan — akun hanya dibuat di sini. Akun nonaktif diblokir dan tidak bisa login."
      />
      <PenggunaManager users={(data as Pengguna[] | null) ?? []} currentUserId={me.id} />
    </div>
  );
}
