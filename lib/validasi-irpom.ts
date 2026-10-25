import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getPemeriksaWilayah } from "@/lib/desa-geo-server";
import { parseCoordinateInput } from "@/lib/parse-coordinate";
import { BATAS_DUPLIKASI_M, jarakMeter, type Titik } from "@/lib/geo";
import { STATUS_IRPOM, type StatusIrpom } from "@/lib/status-irpom";
import { SUMBER_DANA, cocokSumberDana } from "@/lib/sumber-dana";
import type { HasilValidasi, IrpomBersih, IrpomMentah } from "@/lib/validasi-irpom-types";

// Modul validasi bersama untuk form tambah/ubah dan impor (PLAN.md bagian 6,
// Aturan Validasi Data). 3 tingkat:
//   ditolak    -> provinsi/kabupaten/kecamatan/desa salah; tidak bisa disimpan
//   peringatan -> masalah lain; tetap bisa disimpan, kolom bermasalah dikosongkan
//   valid      -> tanpa masalah

// Pencocokan nama: abaikan huruf besar/kecil dan spasi ("Argo Mulyo" = "Argomulyo").
const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().replace(/\s+/g, "");
const kosong = (s: string | null | undefined) => s == null || s.trim() === "";

// Angka boleh koma atau titik desimal; "1.116,11" (gaya Indonesia) juga dibaca.
export function parseAngka(raw: string | null | undefined): number | null {
  if (kosong(raw)) return null;
  let s = raw!.trim().replace(/\s/g, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Kolom lintang/bujur terpisah, tapi salah satunya boleh berisi koordinat
// gabungan hasil tempel dari Google Maps ("-4.33, 104.66"). `ditukar` = isian
// kolom terbalik (lintang di kolom bujur) dan sudah ditukar otomatis.
export function parseKoordinat(
  lat: string | null | undefined,
  lng: string | null | undefined
): (Titik & { ditukar: boolean }) | null {
  if (kosong(lat) && kosong(lng)) return null;
  if (kosong(lat) || kosong(lng)) {
    const p = parseCoordinateInput(kosong(lng) ? lat! : lng!);
    return p ? { ...p, ditukar: false } : null;
  }
  const a = parseAngka(lat);
  const b = parseAngka(lng);
  if (a == null || b == null) {
    // Format lain (derajat-menit-detik, huruf N/S/E/W) di kolom terpisah.
    const p = parseCoordinateInput(`${lat!.trim()}; ${lng!.trim()}`);
    return p ? { ...p, ditukar: false } : null;
  }
  if (Math.abs(a) > 90 && Math.abs(b) <= 90) return { lat: b, lng: a, ditukar: true };
  if (Math.abs(a) > 90 || Math.abs(b) > 180) return null;
  return { lat: a, lng: b, ditukar: false };
}

function cocokStatus(raw: string | null | undefined): StatusIrpom | null {
  const n = norm(raw).replace(/^tahap/, "");
  return STATUS_IRPOM.find((s) => norm(s) === n) ?? null;
}

export interface KonteksValidasi {
  // Unit yang sedang diubah -- diabaikan saat cek duplikasi koordinat.
  abaikanId?: string;
}

export async function validasiIrpom(rows: IrpomMentah[], konteks: KonteksValidasi = {}): Promise<HasilValidasi[]> {
  const supabase = await createClient();

  const [{ data: kecRows }, { data: desaRows }, { data: titikRows }, diWayKanan] = await Promise.all([
    supabase.from("master_kecamatan").select("id_kecamatan, nama_kecamatan"),
    supabase.from("master_desa").select("id_desa, id_kecamatan, nama_desa"),
    supabase.from("irpom").select("id, latitude, longitude").not("latitude", "is", null).not("longitude", "is", null),
    getPemeriksaWilayah(),
  ]);

  const kecamatanList = kecRows ?? [];
  const desaList = desaRows ?? [];
  const kecByNorm = new Map(kecamatanList.map((k) => [norm(k.nama_kecamatan), k]));
  const kecById = new Map(kecamatanList.map((k) => [k.id_kecamatan, k]));
  const desaById = new Map(desaList.map((d) => [d.id_desa, d]));
  const desaByNorm = new Map(desaList.map((d) => [`${d.id_kecamatan}|${norm(d.nama_desa)}`, d]));

  // Titik pembanding duplikasi: unit di database + baris sebelumnya di batch ini.
  const titikPembanding: (Titik & { label: string })[] = (titikRows ?? [])
    .filter((t) => t.id !== konteks.abaikanId)
    .map((t) => ({ lat: t.latitude as number, lng: t.longitude as number, label: "unit lain di database" }));

  return rows.map((row, i) => {
    const pesanTolak: string[] = [];
    const peringatan: string[] = [];

    if (!kosong(row.provinsi) && norm(row.provinsi) !== "lampung") pesanTolak.push(`Provinsi "${row.provinsi}" bukan Lampung.`);
    if (!kosong(row.kabupaten) && norm(row.kabupaten) !== "waykanan")
      pesanTolak.push(`Kabupaten "${row.kabupaten}" bukan Way Kanan.`);

    // Wilayah: dari form lewat id_desa (selalu berupa string, boleh kosong),
    // dari file lewat nama kecamatan + desa (id_desa tidak diisi).
    const dariForm = row.id_desa != null;
    let desa = row.id_desa ? desaById.get(Number(row.id_desa)) : undefined;
    let kec = desa ? kecById.get(desa.id_kecamatan) : undefined;
    if (dariForm && !row.id_desa) {
      pesanTolak.push("Kecamatan dan Desa wajib dipilih.");
    } else if (!dariForm) {
      kec = kecByNorm.get(norm(row.kecamatan));
      if (!kec) pesanTolak.push(kosong(row.kecamatan) ? "Kecamatan kosong." : `Kecamatan "${row.kecamatan}" tidak ada di Way Kanan.`);
      else {
        desa = desaByNorm.get(`${kec.id_kecamatan}|${norm(row.desa)}`);
        if (!desa)
          pesanTolak.push(kosong(row.desa) ? "Desa kosong." : `Desa "${row.desa}" tidak ada di Kecamatan ${kec.nama_kecamatan}.`);
      }
    } else if (!desa) {
      pesanTolak.push("Desa tidak dikenali.");
    }

    if (pesanTolak.length > 0 || !desa || !kec) {
      return { baris: row.baris ?? i + 1, tingkat: "ditolak", pesan: pesanTolak, data: null, kecamatan: row.kecamatan ?? null, desa: row.desa ?? null };
    }

    const kelompok_tani = kosong(row.kelompok_tani) ? null : row.kelompok_tani!.trim();
    if (!kelompok_tani) peringatan.push("Kelompok Tani kosong.");

    let volume = 1;
    if (!kosong(row.volume)) {
      const v = parseAngka(row.volume);
      if (v != null && Number.isInteger(v) && v >= 1) volume = v;
      else peringatan.push(`Volume "${row.volume}" tidak valid, diisi 1.`);
    }

    let luas_ha = parseAngka(row.luas_ha);
    if (luas_ha == null || luas_ha <= 0) {
      peringatan.push(kosong(row.luas_ha) ? "Luas Terairi kosong." : `Luas Terairi "${row.luas_ha}" tidak valid (disimpan kosong).`);
      luas_ha = null;
    } else {
      luas_ha = Math.round(luas_ha * 100) / 100;
    }

    let tahun_anggaran = parseAngka(row.tahun_anggaran);
    if (tahun_anggaran == null || !Number.isInteger(tahun_anggaran) || tahun_anggaran < 1990 || tahun_anggaran > 2100) {
      peringatan.push(
        kosong(row.tahun_anggaran) ? "Tahun Anggaran kosong." : `Tahun Anggaran "${row.tahun_anggaran}" tidak valid (disimpan kosong).`
      );
      tahun_anggaran = null;
    }

    const sumber_dana = cocokSumberDana(row.sumber_dana);
    if (!sumber_dana)
      peringatan.push(
        kosong(row.sumber_dana)
          ? "Sumber Dana kosong."
          : `Sumber Dana "${row.sumber_dana}" di luar pilihan (${SUMBER_DANA.join("/")}), disimpan kosong.`
      );

    const status = cocokStatus(row.status);
    if (!status)
      peringatan.push(
        kosong(row.status)
          ? "Status kosong."
          : `Status "${row.status}" di luar 4 pilihan (Pemberkasan/Pembangunan/Pemanfaatan/Rusak), disimpan kosong.`
      );

    const hasilKoordinat = parseKoordinat(row.latitude, row.longitude);
    let titik: Titik | null = hasilKoordinat;
    if (hasilKoordinat?.ditukar) peringatan.push("Latitude dan Longitude tertukar — sudah ditukar otomatis, periksa kembali.");
    if (!titik) {
      peringatan.push(
        kosong(row.latitude) && kosong(row.longitude)
          ? "Koordinat kosong (unit tidak tampil di peta)."
          : "Koordinat tidak terbaca (disimpan kosong)."
      );
    } else {
      titik = { lat: Number(titik.lat.toFixed(7)), lng: Number(titik.lng.toFixed(7)) };
      if (!diWayKanan(titik.lat, titik.lng)) {
        const tertukar = diWayKanan(titik.lng, titik.lat);
        peringatan.push(
          tertukar
            ? "Koordinat berada di luar Kabupaten Way Kanan — kemungkinan Latitude/Longitude tertukar (masuk Monitoring Koordinat)."
            : "Koordinat berada di luar Kabupaten Way Kanan — periksa tanda minus atau salah ketik angka (masuk Monitoring Koordinat)."
        );
      }
      const dekat = titikPembanding.find((t) => jarakMeter(t, titik!) <= BATAS_DUPLIKASI_M);
      if (dekat) {
        peringatan.push(
          `Koordinat berjarak ${jarakMeter(dekat, titik).toFixed(1)} m dari ${dekat.label} (≤ ${BATAS_DUPLIKASI_M} m, masuk Monitoring Koordinat).`
        );
      }
      titikPembanding.push({ ...titik, label: `baris ${row.baris ?? i + 1} di file ini` });
    }

    const data: IrpomBersih = {
      id_desa: desa.id_desa,
      kelompok_tani,
      ketua_poktan: kosong(row.ketua_poktan) ? null : row.ketua_poktan!.trim(),
      volume,
      luas_ha,
      tahun_anggaran,
      sumber_dana,
      status,
      latitude: titik?.lat ?? null,
      longitude: titik?.lng ?? null,
      keterangan: kosong(row.keterangan) ? null : row.keterangan!.trim(),
    };

    return {
      baris: row.baris ?? i + 1,
      tingkat: peringatan.length > 0 ? "peringatan" : "valid",
      pesan: peringatan,
      data,
      kecamatan: kec.nama_kecamatan,
      desa: desa.nama_desa,
    };
  });
}
