import "server-only";
import ExcelJS from "exceljs";
import { STATUS_IRPOM } from "@/lib/status-irpom";
import { SUMBER_DANA } from "@/lib/sumber-dana";
import type { IrpomMentah } from "@/lib/validasi-irpom-types";

// Format kolom dipakai bersama oleh template impor, ekspor, dan backup
// (PLAN.md: format ekspor = format template impor). Judul kolom sama persis
// dengan DATA IRPOM.csv (+ Keterangan), jadi CSV asli pun bisa diimpor.

type KolomKey = keyof Omit<IrpomMentah, "baris" | "id_desa"> | "no";

export const KOLOM: { key: KolomKey; header: string; width: number }[] = [
  { key: "no", header: "No", width: 6 },
  { key: "provinsi", header: "Provinsi", width: 12 },
  { key: "kabupaten", header: "Kabupaten", width: 12 },
  { key: "kecamatan", header: "Kecamatan", width: 18 },
  { key: "desa", header: "Desa", width: 20 },
  { key: "kelompok_tani", header: "Kelompok_Tani", width: 24 },
  { key: "ketua_poktan", header: "Ketua_Poktan", width: 20 },
  { key: "volume", header: "Volume", width: 9 },
  { key: "luas_ha", header: "Luas_Terairi_Ha", width: 16 },
  { key: "tahun_anggaran", header: "Tahun_Anggaran", width: 15 },
  { key: "sumber_dana", header: "Sumber_Dana", width: 13 },
  { key: "status", header: "Status", width: 14 },
  { key: "latitude", header: "Latitude (Y)", width: 14 },
  { key: "longitude", header: "Longitude (X)", width: 14 },
  { key: "keterangan", header: "Keterangan", width: 30 },
];

const SHEET_DATA = "Data IRPOM";
const MAX_BARIS_DROPDOWN = 1000;
export const MAX_BARIS_IMPOR = 2000;

// Nama judul kolom yang dikenali saat impor (huruf kecil, tanpa spasi/simbol).
const ALIAS_HEADER: Record<string, KolomKey> = {
  no: "no",
  provinsi: "provinsi",
  kabupaten: "kabupaten",
  kecamatan: "kecamatan",
  desa: "desa",
  kampung: "desa",
  kelompoktani: "kelompok_tani",
  poktan: "kelompok_tani",
  namakelompok: "kelompok_tani",
  ketuapoktan: "ketua_poktan",
  ketua: "ketua_poktan",
  volume: "volume",
  luasterairiha: "luas_ha",
  luasterairi: "luas_ha",
  luasha: "luas_ha", // header lama, tetap diterima
  luas: "luas_ha",
  luaslahan: "luas_ha",
  tahunanggaran: "tahun_anggaran",
  tahun: "tahun_anggaran",
  sumberdana: "sumber_dana",
  status: "status",
  latitudey: "latitude",
  latitude: "latitude",
  lat: "latitude",
  lintang: "latitude",
  longitudex: "longitude",
  longitude: "longitude",
  lng: "longitude",
  lon: "longitude",
  bujur: "longitude",
  keterangan: "keterangan",
  catatan: "keterangan",
};

const normHeader = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function styleHeader(sheet: ExcelJS.Worksheet) {
  const row = sheet.getRow(1);
  row.font = { bold: true };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0F2FE" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

function addDataSheet(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet(SHEET_DATA);
  sheet.columns = KOLOM.map((k) => ({ header: k.header, key: k.key, width: k.width }));
  styleHeader(sheet);
  return sheet;
}

function columnLetter(index1: number): string {
  let n = index1;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function applyDropdown(sheet: ExcelJS.Worksheet, key: KolomKey, formula: string, prompt: string) {
  const col = columnLetter(KOLOM.findIndex((k) => k.key === key) + 1);
  for (let r = 2; r <= MAX_BARIS_DROPDOWN; r++) {
    sheet.getCell(`${col}${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [formula],
      showInputMessage: true,
      prompt,
      // Peringatan saja (bukan tolak) -- isian di luar daftar tetap bisa
      // diimpor dan akan ditandai di tabel pratinjau.
      showErrorMessage: true,
      errorStyle: "warning",
      error: "Nilai di luar daftar pilihan.",
    };
  }
}

export interface WilayahReferensi {
  kecamatan: string;
  desa: string[];
}

export async function buildTemplateImpor(wilayah: WilayahReferensi[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = addDataSheet(workbook);
  sheet.addRow({
    no: 1,
    provinsi: "Lampung",
    kabupaten: "Way Kanan",
    kecamatan: "Bahuga",
    desa: "Bumi Agung",
    kelompok_tani: "Contoh Tani Makmur",
    ketua_poktan: "Nama Ketua",
    volume: 1,
    luas_ha: 8.5,
    tahun_anggaran: new Date().getFullYear(),
    sumber_dana: "APBN",
    status: "Pemberkasan",
    latitude: -4.334236,
    longitude: 104.662797,
    keterangan: "Hapus baris contoh ini sebelum impor",
  }).font = { italic: true, color: { argb: "FF6B7280" } };

  // Referensi: status & daftar kecamatan/desa resmi (sumber dropdown).
  const ref = workbook.addWorksheet("Referensi");
  ref.columns = [
    { header: "Status", width: 16 },
    { header: "Kecamatan", width: 20 },
    { header: "Desa", width: 24 },
    { header: "Sumber Dana", width: 14 },
  ];
  styleHeader(ref);
  STATUS_IRPOM.forEach((s, i) => (ref.getCell(`A${i + 2}`).value = s));
  SUMBER_DANA.forEach((s, i) => (ref.getCell(`D${i + 2}`).value = s));
  wilayah.forEach((w, i) => (ref.getCell(`B${i + 2}`).value = w.kecamatan));
  let r = 2;
  for (const w of wilayah) {
    for (const d of w.desa) {
      ref.getCell(`C${r}`).value = `${d} (Kec. ${w.kecamatan})`;
      r++;
    }
  }
  applyDropdown(sheet, "status", `Referensi!$A$2:$A$${STATUS_IRPOM.length + 1}`, "Pilih status dari daftar.");
  applyDropdown(sheet, "sumber_dana", `Referensi!$D$2:$D$${SUMBER_DANA.length + 1}`, "Pilih sumber dana dari daftar.");
  applyDropdown(sheet, "kecamatan", `Referensi!$B$2:$B$${wilayah.length + 1}`, "Pilih kecamatan dari daftar.");

  const petunjuk = workbook.addWorksheet("Petunjuk");
  petunjuk.getColumn(1).width = 110;
  [
    "PETUNJUK PENGISIAN TEMPLATE IMPOR DATA IRPOM",
    "",
    "1. Isi data mulai baris ke-2 sheet 'Data IRPOM'. Hapus baris contoh (huruf miring abu-abu) sebelum impor.",
    "2. Provinsi = Lampung, Kabupaten = Way Kanan. Kecamatan & Desa harus sesuai daftar di sheet 'Referensi' (besar/kecil huruf dan spasi diabaikan).",
    "   Baris dengan provinsi/kabupaten/kecamatan/desa yang salah akan DITOLAK.",
    `3. Status: ${STATUS_IRPOM.join(" / ")}.`,
    `4. Luas_Terairi_Ha boleh memakai koma atau titik desimal (contoh 8,5 atau 8.5). Sumber_Dana: ${SUMBER_DANA.join(" / ")}.`,
    "5. Latitude (Y) & Longitude (X) dalam derajat desimal, contoh -4.334236 dan 104.662797. Boleh juga menempel koordinat gabungan dari Google Maps di kolom Latitude.",
    "6. Kolom lain yang kosong/tidak valid tetap bisa diimpor, tetapi ditandai PERINGATAN dan kolomnya disimpan kosong.",
    "7. Koordinat yang berjarak <= 10 m dari unit lain atau berada di luar Kabupaten Way Kanan ditandai peringatan dan masuk menu Monitoring Koordinat.",
    "8. Sebelum disimpan, sistem menampilkan tabel pratinjau: valid / peringatan / ditolak.",
    "9. Kolom No hanya nomor urut dan tidak disimpan. Impor selalu MENAMBAH data baru; untuk mengubah data yang sudah ada gunakan form Ubah.",
  ].forEach((t, i) => {
    petunjuk.getCell(`A${i + 1}`).value = t;
    if (i === 0) petunjuk.getCell("A1").font = { bold: true, size: 13 };
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export interface BarisEkspor {
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
}

function addBarisEkspor(sheet: ExcelJS.Worksheet, rows: BarisEkspor[], extra?: (r: BarisEkspor, i: number) => Record<string, unknown>) {
  rows.forEach((r, i) => {
    sheet.addRow({
      no: i + 1,
      provinsi: "Lampung",
      kabupaten: "Way Kanan",
      ...r,
      ...extra?.(r, i),
    });
  });
  const luasCol = sheet.getColumn("luas_ha");
  luasCol.numFmt = "0.00";
}

export async function buildEksporIrpom(rows: BarisEkspor[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  addBarisEkspor(addDataSheet(workbook), rows);
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// Cadangan data: 1 sheet IRPOM (+ UUID & waktu dibuat/diubah).
export async function buildBackup(rows: (BarisEkspor & { id: string; created_at: string; updated_at: string })[]) {
  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet("IRPOM");
  sheet.columns = [
    ...KOLOM.map((k) => ({ header: k.header, key: k.key, width: k.width })),
    { header: "ID (UUID)", key: "id", width: 38 },
    { header: "Dibuat", key: "created_at", width: 22 },
    { header: "Diubah", key: "updated_at", width: 22 },
  ];
  styleHeader(sheet);
  addBarisEkspor(sheet, rows);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// ============ BACA FILE IMPOR ============

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) return value.richText.map((t) => t.text).join("").trim();
    if ("text" in value) return String(value.text ?? "").trim();
    if ("result" in value) return String(value.result ?? "").trim();
    return "";
  }
  return String(value).trim();
}

// CSV sederhana: pemisah ; atau , (dideteksi dari baris judul), mendukung
// nilai dalam tanda kutip.
function parseCsv(text: string): string[][] {
  const lines = text.replace(/^﻿/, "").replace(/\r/g, "").split("\n").filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];
  const delim = (lines[0].match(/;/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  return lines.map((line) => {
    const cells: string[] = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') quoted = false;
        else cur += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === delim) {
        cells.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  });
}

export async function bacaFileImpor(file: File): Promise<{ rows: IrpomMentah[]; error: string | null }> {
  const nama = file.name.toLowerCase();
  let table: string[][];

  if (nama.endsWith(".csv")) {
    table = parseCsv(await file.text());
  } else if (nama.endsWith(".xlsx")) {
    const workbook = new ExcelJS.Workbook();
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    } catch {
      return { rows: [], error: "File tidak bisa dibaca. Pastikan formatnya .xlsx dan tidak rusak." };
    }
    const sheet = workbook.getWorksheet(SHEET_DATA) ?? workbook.worksheets[0];
    if (!sheet) return { rows: [], error: "Sheet data tidak ditemukan di file ini." };
    table = [];
    const lastCol = sheet.columnCount;
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const cells: string[] = [];
      for (let c = 1; c <= lastCol; c++) cells.push(cellText(row.getCell(c).value));
      table[rowNumber - 1] = cells;
    });
    table = Array.from(table, (r) => r ?? []);
  } else {
    return { rows: [], error: "Format file harus .xlsx atau .csv." };
  }

  const header = table[0] ?? [];
  const kolomIndex = new Map<KolomKey, number>();
  header.forEach((h, i) => {
    const key = ALIAS_HEADER[normHeader(h)];
    if (key && !kolomIndex.has(key)) kolomIndex.set(key, i);
  });

  const wajib: KolomKey[] = ["kecamatan", "desa"];
  const hilang = wajib.filter((k) => !kolomIndex.has(k));
  if (hilang.length > 0) {
    return { rows: [], error: `Kolom wajib tidak ditemukan: ${hilang.join(", ")}. Gunakan template yang disediakan.` };
  }

  const rows: IrpomMentah[] = [];
  for (let r = 1; r < table.length; r++) {
    const cells = table[r];
    if (!cells || cells.every((c) => !c)) continue;
    const get = (k: KolomKey) => {
      const idx = kolomIndex.get(k);
      return idx == null ? null : (cells[idx] ?? "");
    };
    // Baris contoh di template dilewati.
    if (get("keterangan")?.startsWith("Hapus baris contoh")) continue;
    rows.push({
      baris: r + 1,
      provinsi: get("provinsi"),
      kabupaten: get("kabupaten"),
      kecamatan: get("kecamatan"),
      desa: get("desa"),
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
    });
  }

  if (rows.length === 0) return { rows, error: "Tidak ada baris data yang terbaca. Isi data mulai baris ke-2." };
  if (rows.length > MAX_BARIS_IMPOR) return { rows: [], error: `Maksimal ${MAX_BARIS_IMPOR} baris per impor.` };
  return { rows, error: null };
}
