import "server-only";
import { createClient } from "@/lib/supabase/server";
import { kelompokDuplikasi } from "@/lib/geo";
import { STATUS_IRPOM } from "@/lib/status-irpom";
import { FILTER_BELUM_LENGKAP } from "@/lib/kelengkapan";

// Baris view irpom_lengkap (0005_view_irpom_lengkap.sql).
export interface IrpomLengkap {
  id: string;
  id_desa: number;
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
  keterangan: string | null;
  created_at: string;
  updated_at: string;
}

export interface FilterAdmin {
  q: string;
  kecamatan: string; // id_kecamatan
  desa: string; // id_desa (hanya berlaku bersama kecamatan)
  status: string; // salah satu STATUS_IRPOM
  tahun: string; // "2026"
  sumber: string; // nama sumber dana
}

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim() : "");

export function parseFilterAdmin(sp: Record<string, string | string[] | undefined>): FilterAdmin {
  return {
    q: str(sp.q),
    kecamatan: str(sp.kecamatan),
    desa: str(sp.desa),
    status: str(sp.status),
    tahun: str(sp.tahun),
    sumber: str(sp.sumber),
  };
}

// Dipakai bersama tabel & ekspor. Query builder Supabase tidak punya tipe
// umum yang praktis untuk dioper antarfungsi, jadi di dalam sini dilonggarkan.
function terapkanFilter<Q>(query: Q, f: FilterAdmin): Q {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = query as any;
  if (f.kecamatan) q = q.eq("id_kecamatan", f.kecamatan);
  if (f.kecamatan && /^\d+$/.test(f.desa)) q = q.eq("id_desa", Number(f.desa));
  if (STATUS_IRPOM.includes(f.status as (typeof STATUS_IRPOM)[number])) q = q.eq("status", f.status);
  if (/^\d{4}$/.test(f.tahun)) q = q.eq("tahun_anggaran", Number(f.tahun));
  if (f.sumber) q = q.eq("sumber_dana", f.sumber);
  if (f.q) {
    // Karakter khusus sintaks filter PostgREST dibuang dari kata kunci.
    const kata = f.q.replace(/[,()*%\\]/g, " ").trim();
    if (kata) {
      const pola = `%${kata}%`;
      q = q.or(`kelompok_tani.ilike.${pola},ketua_poktan.ilike.${pola},desa.ilike.${pola},kecamatan.ilike.${pola}`);
    }
  }
  return q;
}

export async function getDaftarIrpom(f: FilterAdmin, page: number, size: number) {
  const supabase = await createClient();
  const from = (page - 1) * size;
  const query = terapkanFilter(supabase.from("irpom_lengkap").select("*", { count: "exact" }), f)
    .order("kecamatan")
    .order("desa")
    .order("kelompok_tani")
    .range(from, from + size - 1);
  const { data, count, error } = await query;
  if (error) console.error("getDaftarIrpom gagal:", error.message);
  return { rows: (data as IrpomLengkap[] | null) ?? [], total: count ?? 0 };
}

// Jumlah unit yang masih punya kolom kosong (badge menu "Belum Lengkap").
export async function getJumlahBelumLengkap(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase.from("irpom").select("id", { count: "exact", head: true }).or(FILTER_BELUM_LENGKAP);
  if (error) console.error("getJumlahBelumLengkap gagal:", error.message);
  return count ?? 0;
}

// Semua baris hasil filter (untuk ekspor), dibaca per 1000 baris.
export async function getSemuaIrpom(f?: FilterAdmin): Promise<IrpomLengkap[]> {
  const supabase = await createClient();
  const hasil: IrpomLengkap[] = [];
  for (let from = 0; ; from += 1000) {
    const base = supabase.from("irpom_lengkap").select("*");
    const { data, error } = await (f ? terapkanFilter(base, f) : base)
      .order("kecamatan")
      .order("desa")
      .order("kelompok_tani")
      .range(from, from + 999);
    if (error) {
      console.error("getSemuaIrpom gagal:", error.message);
      break;
    }
    hasil.push(...((data as IrpomLengkap[]) ?? []));
    if (!data || data.length < 1000) break;
  }
  return hasil;
}

export interface UnitDuplikasi {
  id: string;
  lat: number;
  lng: number;
  kecamatan: string;
  desa: string;
  kelompok_tani: string | null;
  luas_ha: number | null;
  status: string | null;
}

// Kelompok unit yang koordinatnya berjarak <= 10 m (dihitung langsung dari
// data, tanpa tabel tambahan -- kasus hilang begitu diperbaiki/dihapus).
export async function getKelompokDuplikasi(): Promise<UnitDuplikasi[][]> {
  const semua = await getSemuaIrpom();
  const bertitik: UnitDuplikasi[] = semua
    .filter((u) => u.latitude != null && u.longitude != null)
    .map((u) => ({
      id: u.id,
      lat: u.latitude!,
      lng: u.longitude!,
      kecamatan: u.kecamatan,
      desa: u.desa,
      kelompok_tani: u.kelompok_tani,
      luas_ha: u.luas_ha,
      status: u.status,
    }));
  return kelompokDuplikasi(bertitik);
}

export interface WilayahOption {
  kecamatanList: { id_kecamatan: string; nama_kecamatan: string }[];
  desaList: { id_desa: number; id_kecamatan: string; nama_desa: string }[];
}

export async function getWilayah(): Promise<WilayahOption> {
  const supabase = await createClient();
  const [{ data: kec }, { data: desa }] = await Promise.all([
    supabase.from("master_kecamatan").select("id_kecamatan, nama_kecamatan").order("nama_kecamatan"),
    supabase.from("master_desa").select("id_desa, id_kecamatan, nama_desa").order("nama_desa"),
  ]);
  return { kecamatanList: kec ?? [], desaList: desa ?? [] };
}

// Pilihan filter tahun & sumber dana dari data yang ada (RPC publik).
export async function getOpsiTahunSumber(): Promise<{ tahun: number[]; sumber: string[] }> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("irpom_filter_opsi");
  const opsi = data as { tahun_anggaran: number[]; sumber_dana: string[] } | null;
  return { tahun: opsi?.tahun_anggaran ?? [], sumber: opsi?.sumber_dana ?? [] };
}

export function keBarisEkspor(rows: IrpomLengkap[]) {
  return rows.map((r) => ({
    kecamatan: r.kecamatan,
    desa: r.desa,
    kelompok_tani: r.kelompok_tani,
    ketua_poktan: r.ketua_poktan,
    volume: r.volume,
    luas_ha: r.luas_ha,
    tahun_anggaran: r.tahun_anggaran,
    sumber_dana: r.sumber_dana,
    status: r.status,
    latitude: r.latitude,
    longitude: r.longitude,
    keterangan: r.keterangan,
  }));
}
