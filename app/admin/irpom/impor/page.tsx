import { requirePengelolaPage } from "@/lib/auth-guard";
import PageHeader from "@/components/admin/PageHeader";
import ImporIrpom from "@/components/admin/ImporIrpom";

export default async function ImporIrpomPage() {
  await requirePengelolaPage();
  return (
    <div>
      <PageHeader
        title="Impor Data IRPOM"
        description="File diperiksa dulu: valid, peringatan (tetap bisa disimpan), atau ditolak (wilayah salah). Data baru tersimpan setelah Anda menekan Simpan."
      />
      <ImporIrpom />
    </div>
  );
}
