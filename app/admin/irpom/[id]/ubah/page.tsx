import { notFound } from "next/navigation";
import { requirePengelolaPage } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { getOpsiTahunSumber, getWilayah, type IrpomLengkap } from "@/lib/admin-data";
import { formatTanggalWaktu } from "@/lib/format";
import PageHeader from "@/components/admin/PageHeader";
import FormIrpom from "@/components/admin/FormIrpom";

export default async function UbahIrpomPage(props: PageProps<"/admin/irpom/[id]/ubah">) {
  await requirePengelolaPage();
  const { id } = await props.params;

  const supabase = await createClient();
  const [{ data }, wilayah, opsi] = await Promise.all([
    supabase.from("irpom_lengkap").select("*").eq("id", id).maybeSingle<IrpomLengkap>(),
    getWilayah(),
    getOpsiTahunSumber(),
  ]);
  if (!data) notFound();

  return (
    <div>
      <PageHeader
        title={`Ubah Unit: ${data.kelompok_tani ?? data.desa}`}
        description={`Desa ${data.desa}, Kec. ${data.kecamatan} · terakhir diubah ${formatTanggalWaktu(data.updated_at)}`}
      />
      <FormIrpom id={id} wilayah={wilayah} sumberDanaList={opsi.sumber} initialData={data} />
    </div>
  );
}
