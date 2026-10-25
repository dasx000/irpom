import type { NextRequest } from "next/server";
import { getPengelola } from "@/lib/auth-guard";
import { getSemuaIrpom, keBarisEkspor, parseFilterAdmin } from "@/lib/admin-data";
import { buildEksporIrpom } from "@/lib/irpom-excel";
import { responsXlsx, tanggalHariIni } from "@/lib/unduh-xlsx";

// Ekspor data IRPOM sesuai filter tabel admin. Formatnya sama dengan
// template impor (lib/irpom-excel.ts).
export async function GET(request: NextRequest) {
  if (!(await getPengelola())) return new Response("Tidak berwenang", { status: 401 });

  const filter = parseFilterAdmin(Object.fromEntries(request.nextUrl.searchParams));
  const rows = await getSemuaIrpom(filter);
  const buffer = await buildEksporIrpom(keBarisEkspor(rows));
  return responsXlsx(buffer, `data-irpom-${tanggalHariIni()}.xlsx`);
}
