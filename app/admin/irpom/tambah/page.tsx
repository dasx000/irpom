import { requirePengelolaPage } from "@/lib/auth-guard";
import { getOpsiTahunSumber, getWilayah } from "@/lib/admin-data";
import PageHeader from "@/components/admin/PageHeader";
import FormIrpom from "@/components/admin/FormIrpom";

export default async function TambahIrpomPage() {
  await requirePengelolaPage();
  const [wilayah, opsi] = await Promise.all([getWilayah(), getOpsiTahunSumber()]);

  return (
    <div>
      <PageHeader title="Tambah Unit IRPOM" description="Kolom bertanda * wajib diisi. Kolom lain boleh dilengkapi kemudian." />
      <FormIrpom id={null} wilayah={wilayah} sumberDanaList={opsi.sumber} />
    </div>
  );
}
