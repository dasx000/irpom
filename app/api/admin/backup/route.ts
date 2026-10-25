import { getPengelola } from "@/lib/auth-guard";
import { getSemuaIrpom, keBarisEkspor } from "@/lib/admin-data";
import { buildBackup } from "@/lib/irpom-excel";
import { responsXlsx, tanggalHariIni } from "@/lib/unduh-xlsx";

// Cadangan data manual (semua pengelola): seluruh data IRPOM + UUID & waktu.
export async function GET() {
  if (!(await getPengelola())) return new Response("Tidak berwenang", { status: 403 });

  const rows = await getSemuaIrpom();
  const waktu = (iso: string) => new Date(iso).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  const ekspor = keBarisEkspor(rows);
  const buffer = await buildBackup(
    rows.map((r, i) => ({ ...ekspor[i], id: r.id, created_at: waktu(r.created_at), updated_at: waktu(r.updated_at) }))
  );
  return responsXlsx(buffer, `cadangan-irpom-${tanggalHariIni()}.xlsx`);
}
