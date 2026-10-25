import { requirePengelolaPage } from "@/lib/auth-guard";
import PageHeader from "@/components/admin/PageHeader";
import ProfilForm from "@/components/admin/ProfilForm";

export default async function ProfilPage() {
  const profile = await requirePengelolaPage();
  return (
    <div>
      <PageHeader title="Profil Saya" description="Ubah nama dan kata sandi akun Anda." />
      <ProfilForm profile={profile} />
    </div>
  );
}
