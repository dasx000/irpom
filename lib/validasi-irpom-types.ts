import type { StatusIrpom } from "@/lib/status-irpom";

// Data mentah dari form atau file impor (semua teks, belum divalidasi).
// Wilayah diisi lewat id_desa (form) ATAU nama kecamatan + desa (file).
export interface IrpomMentah {
  baris?: number; // nomor baris di file impor
  provinsi?: string | null;
  kabupaten?: string | null;
  kecamatan?: string | null;
  desa?: string | null;
  id_desa?: string | null;
  kelompok_tani?: string | null;
  ketua_poktan?: string | null;
  volume?: string | null;
  luas_ha?: string | null;
  tahun_anggaran?: string | null;
  sumber_dana?: string | null;
  status?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  keterangan?: string | null;
}

// Baris siap disimpan ke tabel irpom.
export interface IrpomBersih {
  id_desa: number;
  kelompok_tani: string | null;
  ketua_poktan: string | null;
  volume: number;
  luas_ha: number | null;
  tahun_anggaran: number | null;
  sumber_dana: string | null;
  status: StatusIrpom | null;
  latitude: number | null;
  longitude: number | null;
  keterangan: string | null;
}

export type TingkatValidasi = "valid" | "peringatan" | "ditolak";

export interface HasilValidasi {
  baris: number;
  tingkat: TingkatValidasi;
  pesan: string[];
  data: IrpomBersih | null;
  kecamatan: string | null;
  desa: string | null;
}
