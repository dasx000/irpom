import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  FILTER_KOSONG_PARAM,
  type IrpomPublik,
  type IrpomFilter,
  type IrpomFilterOpsi,
  type IrpomStatistik,
} from "@/lib/irpom-publik-types";

// Pengambil data halaman publik. Semua lewat RPC di
// supabase/migrations/0004_rpc_publik.sql (publik tidak membaca tabel irpom
// langsung). Konvensi parameter: tahun 0 / sumber dana "" = hanya yang kosong.

// ?tahun=2026&sumber=APBN -> filter RPC. Nilai "kosong" = data yang kolomnya
// belum diisi; parameter tidak ada / tidak valid = semua.
export function parseIrpomFilter(searchParams: Record<string, string | string[] | undefined>): IrpomFilter {
  const tahunRaw = typeof searchParams.tahun === "string" ? searchParams.tahun : "";
  const sumberRaw = typeof searchParams.sumber === "string" ? searchParams.sumber : "";

  let tahun: number | null = null;
  if (tahunRaw === FILTER_KOSONG_PARAM) tahun = 0;
  else if (/^\d{4}$/.test(tahunRaw)) tahun = Number(tahunRaw);

  let sumberDana: string | null = null;
  if (sumberRaw === FILTER_KOSONG_PARAM) sumberDana = "";
  else if (sumberRaw) sumberDana = sumberRaw;

  return { tahun, sumberDana };
}

function rpcArgs(filter: IrpomFilter) {
  return { p_tahun: filter.tahun, p_sumber_dana: filter.sumberDana };
}

const STATISTIK_KOSONG: IrpomStatistik = {
  ringkasan: { total_unit: 0, total_luas_ha: 0, jumlah_poktan: 0, jumlah_kecamatan: 0, jumlah_desa: 0 },
  per_status: [],
  per_kecamatan: [],
  top_poktan: [],
};

export async function getIrpomPublikData(filter: IrpomFilter) {
  const supabase = await createClient();

  const [statistik, rows, opsi] = await Promise.all([
    supabase.rpc("irpom_statistik_publik", rpcArgs(filter)),
    supabase.rpc("irpom_publik", rpcArgs(filter)),
    supabase.rpc("irpom_filter_opsi"),
  ]);

  if (statistik.error) console.error("irpom_statistik_publik gagal:", statistik.error.message);
  if (rows.error) console.error("irpom_publik gagal:", rows.error.message);
  if (opsi.error) console.error("irpom_filter_opsi gagal:", opsi.error.message);

  return {
    statistik: (statistik.data as IrpomStatistik | null) ?? STATISTIK_KOSONG,
    rows: (rows.data as IrpomPublik[] | null) ?? [],
    opsi: (opsi.data as IrpomFilterOpsi | null) ?? {
      tahun_anggaran: [],
      ada_tahun_kosong: false,
      sumber_dana: [],
      ada_sumber_dana_kosong: false,
    },
  };
}
