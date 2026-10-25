import { requirePengelolaPage } from "@/lib/auth-guard";
import PageHeader from "@/components/admin/PageHeader";
import ProfilForm from "@/components/admin/ProfilForm";

export default async function ProfilPage() {
  const profile = await requirePengelolaPage();
  return (
    // Form sempit diletakkan di tengah area konten, seperti halaman Ubah Unit.
    <div className="mx-auto max-w-lg">
      <PageHeader title="Profil Saya" description="Ubah nama dan kata sandi akun Anda." />
      <ProfilForm profile={profile} />
    </div>
  );
}
