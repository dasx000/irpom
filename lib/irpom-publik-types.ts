// Bentuk data dari RPC publik (supabase/migrations/0004_rpc_publik.sql).
// File terpisah dari lib/irpom-publik.ts supaya bisa diimpor client component.

export interface IrpomPublik {
  id: string;
  id_kecamatan: string;
  kecamatan: string;
  desa: string;
  kelompok_tani: string | null;
  ketua_poktan: string | null;
  volume: number;
  luas_ha: number | null;
  tahun_anggaran: number | null;
  sumber_dana: string | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface IrpomStatistik {
  ringkasan: {
    total_unit: number;
    total_luas_ha: number;
    jumlah_poktan: number;
    jumlah_kecamatan: number;
    jumlah_desa: number;
  };
  per_status: { status: string; unit: number }[];
  per_kecamatan: { id_kecamatan: string; kecamatan: string; unit: number; luas_ha: number }[];
}

export interface IrpomFilterOpsi {
  tahun_anggaran: number[];
  ada_tahun_kosong: boolean;
  sumber_dana: string[];
  ada_sumber_dana_kosong: boolean;
}

// Nilai parameter URL (?tahun=kosong / ?sumber=kosong) untuk data yang
// kolomnya belum diisi.
export const FILTER_KOSONG_PARAM = "kosong";

// null = semua; tahun 0 / sumberDana "" = hanya yang kolomnya kosong.
export interface IrpomFilter {
  tahun: number | null;
  sumberDana: string | null;
}
