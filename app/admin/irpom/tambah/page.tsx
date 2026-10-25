import { requirePengelolaPage } from "@/lib/auth-guard";
import { getWilayah } from "@/lib/admin-data";
import PageHeader from "@/components/admin/PageHeader";
import FormIrpom from "@/components/admin/FormIrpom";

export default async function TambahIrpomPage() {
  await requirePengelolaPage();
  const wilayah = await getWilayah();

  return (
    // Form dibatasi lebarnya agar mudah dibaca, diletakkan di tengah area konten.
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Tambah Unit IRPOM" description="Kolom bertanda * wajib diisi. Kolom lain boleh dilengkapi kemudian." />
      <FormIrpom id={null} wilayah={wilayah} />
    </div>
  );
}
