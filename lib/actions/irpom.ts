"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPengelola } from "@/lib/auth-guard";
import { friendlyDbError } from "@/lib/friendly-db-error";
import { validasiIrpom } from "@/lib/validasi-irpom";
import { bacaFileImpor } from "@/lib/irpom-excel";
import { STATUS_IRPOM, type StatusIrpom } from "@/lib/status-irpom";
import type { HasilValidasi, IrpomMentah } from "@/lib/validasi-irpom-types";

const TIDAK_BERWENANG = "Sesi tidak ditemukan atau akun Anda tidak aktif. Silakan login ulang.";

function revalidateIrpom() {
  revalidatePath("/admin", "layout");
  revalidatePath("/");
}

// ============ FORM TAMBAH / UBAH ============

export interface IrpomFormState {
  error: string | null;
  // Diisi bila ada peringatan dan admin belum mengonfirmasi -- form
  // menampilkan daftar ini lalu mengirim ulang dengan konfirmasi=1.
  peringatan?: string[];
}

function mentahDariForm(formData: FormData): IrpomMentah {
  const get = (k: string) => (formData.get(k) as string | null) ?? null;
  return {
    id_desa: get("id_desa") ?? "", // string = data dari form (lihat validasiIrpom)
    kelompok_tani: get("kelompok_tani"),
    ketua_poktan: get("ketua_poktan"),
    volume: get("volume"),
    luas_ha: get("luas_ha"),
    tahun_anggaran: get("tahun_anggaran"),
    sumber_dana: get("sumber_dana"),
    status: get("status"),
    latitude: get("latitude"),
    longitude: get("longitude"),
    keterangan: get("keterangan"),
  };
}

export async function simpanIrpom(id: string | null, _prev: IrpomFormState, formData: FormData): Promise<IrpomFormState> {
  if (!(await getPengelola())) return { error: TIDAK_BERWENANG };

  const [hasil] = await validasiIrpom([mentahDariForm(formData)], { abaikanId: id ?? undefined });
  if (hasil.tingkat === "ditolak" || !hasil.data) return { error: hasil.pesan.join(" ") || "Data tidak valid." };
  if (hasil.tingkat === "peringatan" && formData.get("konfirmasi") !== "1") {
    return { error: null, peringatan: hasil.pesan };
  }

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("irpom").update(hasil.data).eq("id", id)
    : await supabase.from("irpom").insert(hasil.data);
  if (error) return { error: friendlyDbError(error, "Gagal menyimpan data IRPOM.") };

  revalidateIrpom();
  redirect("/admin/irpom");
}

export async function hapusIrpom(id: string): Promise<{ error: string | null }> {
  if (!(await getPengelola())) return { error: TIDAK_BERWENANG };
  const supabase = await createClient();
  const { error } = await supabase.from("irpom").delete().eq("id", id);
  if (error) return { error: friendlyDbError(error, "Gagal menghapus data IRPOM.") };
  revalidateIrpom();
  return { error: null };
}

export async function ubahStatusIrpom(id: string, status: string): Promise<{ error: string | null }> {
  if (!(await getPengelola())) return { error: TIDAK_BERWENANG };
  if (!STATUS_IRPOM.includes(status as StatusIrpom)) return { error: "Status tidak dikenali." };
  const supabase = await createClient();
  const { error } = await supabase.from("irpom").update({ status }).eq("id", id);
  if (error) return { error: friendlyDbError(error, "Gagal mengubah status.") };
  revalidateIrpom();
  return { error: null };
}

// ============ IMPOR DENGAN PRATINJAU ============

export interface BarisPratinjau extends HasilValidasi {
  mentah: IrpomMentah;
}

export interface PratinjauState {
  error: string | null;
  id?: string; // unik per hasil pemeriksaan (key panel pratinjau)
  namaFile?: string;
  baris?: BarisPratinjau[];
}

// Langkah 1: baca & validasi file -- BELUM menyimpan apa pun.
export async function pratinjauImpor(_prev: PratinjauState, formData: FormData): Promise<PratinjauState> {
  if (!(await getPengelola())) return { error: TIDAK_BERWENANG };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Pilih file Excel (.xlsx) atau CSV terlebih dahulu." };

  const { rows, error } = await bacaFileImpor(file);
  if (error) return { error };

  const hasil = await validasiIrpom(rows);
  return { error: null, id: crypto.randomUUID(), namaFile: file.name, baris: hasil.map((h, i) => ({ ...h, mentah: rows[i] })) };
}

export interface SimpanImporResult {
  error: string | null;
  tersimpan?: number;
  dilewati?: number;
}

// Langkah 2: simpan baris yang dipilih admin. Divalidasi ULANG di server
// (data dari browser tidak dipercaya begitu saja); baris ditolak selalu dilewati.
export async function simpanImpor(rows: IrpomMentah[]): Promise<SimpanImporResult> {
  if (!(await getPengelola())) return { error: TIDAK_BERWENANG };
  if (rows.length === 0) return { error: "Tidak ada baris yang dipilih untuk disimpan." };

  const hasil = await validasiIrpom(rows);
  const siap = hasil.filter((h) => h.tingkat !== "ditolak" && h.data).map((h) => h.data!);
  const dilewati = hasil.length - siap.length;
  if (siap.length === 0) return { error: "Semua baris ditolak, tidak ada yang disimpan.", tersimpan: 0, dilewati };

  const supabase = await createClient();
  const CHUNK = 500;
  let tersimpan = 0;
  for (let i = 0; i < siap.length; i += CHUNK) {
    const { error } = await supabase.from("irpom").insert(siap.slice(i, i + CHUNK));
    if (error) {
      revalidateIrpom();
      return {
        error: `${friendlyDbError(error, "Gagal menyimpan data")} (${tersimpan} baris sudah tersimpan sebelum error ini.)`,
        tersimpan,
        dilewati,
      };
    }
    tersimpan += Math.min(CHUNK, siap.length - i);
  }

  revalidateIrpom();
  return { error: null, tersimpan, dilewati };
}
