import { getPengelola } from "@/lib/auth-guard";
import { getWilayah } from "@/lib/admin-data";
import { buildTemplateImpor } from "@/lib/irpom-excel";
import { responsXlsx } from "@/lib/unduh-xlsx";

export async function GET() {
  if (!(await getPengelola())) return new Response("Tidak berwenang", { status: 401 });

  const { kecamatanList, desaList } = await getWilayah();
  const wilayah = kecamatanList.map((k) => ({
    kecamatan: k.nama_kecamatan,
    desa: desaList.filter((d) => d.id_kecamatan === k.id_kecamatan).map((d) => d.nama_desa),
  }));
  return responsXlsx(await buildTemplateImpor(wilayah), "template-impor-irpom.xlsx");
}
