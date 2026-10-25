// Kolom yang dianggap wajib untuk data IRPOM yang lengkap. Kolom ini boleh
// kosong saat disimpan (hasil impor / form dengan peringatan), lalu
// dilengkapi lewat menu "Belum Lengkap". Keterangan tidak termasuk.
export interface UnitKelengkapan {
  kelompok_tani: string | null;
  ketua_poktan: string | null;
  luas_ha: number | null;
  tahun_anggaran: number | null;
  sumber_dana: string | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
}

export const KOLOM_KELENGKAPAN = [
  { key: "koordinat", label: "Koordinat", kosong: (u: UnitKelengkapan) => u.latitude == null || u.longitude == null },
  { key: "status", label: "Status", kosong: (u: UnitKelengkapan) => !u.status },
  { key: "luas", label: "Luas Terairi", kosong: (u: UnitKelengkapan) => u.luas_ha == null },
  { key: "tahun", label: "Tahun Anggaran", kosong: (u: UnitKelengkapan) => u.tahun_anggaran == null },
  { key: "sumber", label: "Sumber Dana", kosong: (u: UnitKelengkapan) => !u.sumber_dana },
  { key: "poktan", label: "Kelompok Tani", kosong: (u: UnitKelengkapan) => !u.kelompok_tani?.trim() },
  { key: "ketua", label: "Ketua Poktan", kosong: (u: UnitKelengkapan) => !u.ketua_poktan?.trim() },
] as const;

export type KolomKelengkapan = (typeof KOLOM_KELENGKAPAN)[number]["key"];

export function kolomKosong(u: UnitKelengkapan): KolomKelengkapan[] {
  return KOLOM_KELENGKAPAN.filter((k) => k.kosong(u)).map((k) => k.key);
}

// Filter PostgREST untuk menghitung unit yang punya minimal satu kolom kosong.
export const FILTER_BELUM_LENGKAP =
  "latitude.is.null,longitude.is.null,status.is.null,luas_ha.is.null,tahun_anggaran.is.null," +
  "sumber_dana.is.null,kelompok_tani.is.null,kelompok_tani.eq.,ketua_poktan.is.null,ketua_poktan.eq.";
