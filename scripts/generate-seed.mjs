// Membuat file SQL master wilayah & seed IRPOM dari sumber datanya:
//   - public/geo/way-kanan-kecamatan.geojson  -> master_kecamatan (kode & nama)
//   - public/geo/way-kanan-desa.geojson       -> master_desa + poligon cek koordinat
//   - DATA IRPOM.csv                          -> irpom
//
// Jalankan: node scripts/generate-seed.mjs
// Hasil:    supabase/migrations/0002_master_wilayah.sql
//           supabase/migrations/0003_seed_irpom.sql
//
// Aturan validasi mengikuti PLAN.md (bagian 6, Aturan Validasi Data):
//   ditolak    -> provinsi/kabupaten/kecamatan/desa salah (skrip berhenti, tidak menulis file)
//   peringatan -> dicetak ke layar; kolom bermasalah disimpan kosong (NULL)

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const KEC_GEOJSON = path.join(ROOT, "public/geo/way-kanan-kecamatan.geojson");
const DESA_GEOJSON = path.join(ROOT, "public/geo/way-kanan-desa.geojson");
const CSV_PATH = path.join(ROOT, "DATA IRPOM.csv");
const OUT_WILAYAH = path.join(ROOT, "supabase/migrations/0002_master_wilayah.sql");
const OUT_SEED = path.join(ROOT, "supabase/migrations/0003_seed_irpom.sql");

const STATUS_VALID = ["Pemberkasan", "Pembangunan", "Pemanfaatan", "Rusak"];
const BATAS_DUPLIKASI_M = 10;

// Pencocokan nama: abaikan huruf besar/kecil dan spasi ("Argo Mulyo" = "Argomulyo").
const norm = (s) => (s ?? "").toLowerCase().replace(/\s+/g, "");
const kosong = (s) => s == null || s.trim() === "";
const sql = (v) => (v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`);

// ============ MASTER WILAYAH ============

const kecFeatures = JSON.parse(readFileSync(KEC_GEOJSON, "utf8")).features;
const desaFeatures = JSON.parse(readFileSync(DESA_GEOJSON, "utf8")).features;

const kecamatan = kecFeatures
  .map((f) => ({ id: f.properties.KDCPUM.replace(/\./g, ""), nama: f.properties.NAMOBJ.trim() }))
  .sort((a, b) => a.id.localeCompare(b.id));
const kecByNorm = new Map(kecamatan.map((k) => [norm(k.nama), k]));

// Kode KDCPUM di GeoJSON desa tidak konsisten, jadi desa dikaitkan ke
// kecamatan lewat nama kecamatan (WADMKC), bukan lewat kodenya.
const desa = desaFeatures.map((f) => {
  const kec = kecByNorm.get(norm(f.properties.WADMKC));
  if (!kec) throw new Error(`Kecamatan desa "${f.properties.NAMOBJ}" tidak dikenal: ${f.properties.WADMKC}`);
  return { kec, nama: f.properties.NAMOBJ.trim(), geometry: f.geometry };
});
desa.sort((a, b) => a.kec.id.localeCompare(b.kec.id) || a.nama.localeCompare(b.nama));
const desaByNorm = new Map(desa.map((d) => [`${d.kec.id}|${norm(d.nama)}`, d]));

// ============ GEOMETRI ============

function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inGeometry(x, y, geometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.some((p) => inRing(x, y, p[0]) && !p.slice(1).some((hole) => inRing(x, y, hole)));
}

const diWayKanan = (lat, lng) => desa.some((d) => inGeometry(lng, lat, d.geometry));

function jarakMeter(a, b) {
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

// Angka boleh memakai koma atau titik desimal ("5,95" / "-4.33").
function parseAngka(s) {
  if (kosong(s)) return null;
  const n = Number(s.trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// ============ DATA IRPOM ============

const lines = readFileSync(CSV_PATH, "utf8").replace(/^﻿/, "").replace(/\r/g, "").trim().split("\n");
const ditolak = [];
const peringatan = [];
const rows = [];

lines.slice(1).forEach((line, i) => {
  const barisFile = i + 2;
  const c = line.split(";").map((s) => s.trim());
  const [no, provinsi, kabupaten, namaKec, namaDesa, kelompok, ketua, volume, luas, tahun, sumber, status, lat, lng] = c;
  const ref = `Baris ${barisFile} (No. ${no})`;
  const warn = (msg) => peringatan.push(`${ref}: ${msg}`);

  if (norm(provinsi) !== "lampung") return ditolak.push(`${ref}: provinsi "${provinsi}" bukan Lampung`);
  if (norm(kabupaten) !== "waykanan") return ditolak.push(`${ref}: kabupaten "${kabupaten}" bukan Way Kanan`);
  const kec = kecByNorm.get(norm(namaKec));
  if (!kec) return ditolak.push(`${ref}: kecamatan "${namaKec}" tidak ada di master`);
  const ds = desaByNorm.get(`${kec.id}|${norm(namaDesa)}`);
  if (!ds) return ditolak.push(`${ref}: desa "${namaDesa}" tidak ada di Kecamatan ${kec.nama}`);

  const row = {
    ref,
    kecamatan: kec.nama,
    desa: ds.nama,
    kelompok: kosong(kelompok) ? null : kelompok,
    ketua: kosong(ketua) ? null : ketua,
    volume: parseAngka(volume) ?? 1,
    luas: parseAngka(luas),
    tahun: parseAngka(tahun),
    sumber: kosong(sumber) ? null : sumber,
    status: STATUS_VALID.find((s) => norm(s) === norm(status)) ?? null,
    lat: parseAngka(lat),
    lng: parseAngka(lng),
  };

  if (row.kelompok == null) warn("Kelompok Tani kosong");
  if (row.luas == null || row.luas <= 0) {
    warn(`luas "${luas}" kosong atau <= 0 (disimpan kosong)`);
    row.luas = null;
  }
  if (row.tahun == null) warn("Tahun Anggaran kosong");
  if (row.sumber == null) warn("Sumber Dana kosong");
  if (row.status == null) warn(`status "${status}" di luar 4 pilihan (disimpan kosong)`);
  if (row.lat == null || row.lng == null) {
    warn("koordinat kosong / tidak terbaca (disimpan kosong)");
    row.lat = row.lng = null;
  } else if (!diWayKanan(row.lat, row.lng)) {
    warn(`koordinat (${row.lat}, ${row.lng}) di luar Kabupaten Way Kanan`);
  }
  rows.push(row);
});

const berkoordinat = rows.filter((r) => r.lat != null);
for (let i = 0; i < berkoordinat.length; i++) {
  for (let j = i + 1; j < berkoordinat.length; j++) {
    const a = berkoordinat[i];
    const b = berkoordinat[j];
    const m = jarakMeter(a, b);
    if (m <= BATAS_DUPLIKASI_M) {
      peringatan.push(`${a.ref} & ${b.ref}: koordinat berjarak ${m.toFixed(1)} m (masuk Monitoring Duplikasi)`);
    }
  }
}

// ============ LAPORAN ============

console.log(`Master: ${kecamatan.length} kecamatan, ${desa.length} desa`);
console.log(`CSV: ${lines.length - 1} baris, ${rows.length} lolos, ${ditolak.length} ditolak, ${peringatan.length} peringatan`);
for (const p of peringatan) console.log(`  ⚠️  ${p}`);
for (const d of ditolak) console.log(`  ❌ ${d}`);
if (ditolak.length) {
  console.error("\nAda baris ditolak. Perbaiki CSV lalu jalankan ulang; file SQL tidak ditulis.");
  process.exit(1);
}

// ============ TULIS SQL ============

const header = (judul) =>
  `-- ${judul}\n-- FILE INI DIBUAT OTOMATIS oleh scripts/generate-seed.mjs -- jangan diedit manual.\n-- Jalankan manual lewat SQL Editor Supabase setelah file bernomor sebelumnya.\n\n`;

const wilayahSql =
  header("Master wilayah Kabupaten Way Kanan (sumber: GeoJSON batas wilayah)") +
  `begin;\n\ninsert into master_kecamatan (id_kecamatan, nama_kecamatan) values\n` +
  kecamatan.map((k) => `  (${sql(k.id)}, ${sql(k.nama)})`).join(",\n") +
  `;\n\ninsert into master_desa (id_kecamatan, nama_desa) values\n` +
  desa.map((d) => `  (${sql(d.kec.id)}, ${sql(d.nama)})`).join(",\n") +
  `;\n\ncommit;\n`;

const seedSql =
  header(`Seed data awal IRPOM dari DATA IRPOM.csv (${rows.length} unit)`) +
  `begin;\n\n` +
  `-- Data awal tidak dicatat di audit log.\nalter table irpom disable trigger trg_irpom_audit;\n\n` +
  `insert into irpom (id_desa, kelompok_tani, ketua_poktan, volume, luas_ha, tahun_anggaran, sumber_dana, status, latitude, longitude)\n` +
  `select d.id_desa, v.kelompok_tani, v.ketua_poktan, v.volume::integer, v.luas_ha::numeric, v.tahun_anggaran::smallint,\n` +
  `       v.sumber_dana, v.status::status_irpom, v.latitude::double precision, v.longitude::double precision\n` +
  `from (values\n` +
  rows
    .map(
      (r) =>
        `  (${[r.kecamatan, r.desa, r.kelompok, r.ketua, r.volume, r.luas, r.tahun, r.sumber, r.status, r.lat, r.lng]
          .map(sql)
          .join(", ")})`
    )
    .join(",\n") +
  `\n) as v (kecamatan, desa, kelompok_tani, ketua_poktan, volume, luas_ha, tahun_anggaran, sumber_dana, status, latitude, longitude)\n` +
  `join master_kecamatan k on k.nama_kecamatan = v.kecamatan\n` +
  `join master_desa d on d.id_kecamatan = k.id_kecamatan and d.nama_desa = v.desa;\n\n` +
  `alter table irpom enable trigger trg_irpom_audit;\n\n` +
  `do $$\nbegin\n  if (select count(*) from irpom) <> ${rows.length} then\n` +
  `    raise exception 'Jumlah unit IRPOM tidak sesuai: diharapkan ${rows.length}';\n  end if;\nend;\n$$;\n\ncommit;\n`;

writeFileSync(OUT_WILAYAH, wilayahSql);
writeFileSync(OUT_SEED, seedSql);
console.log(`\nDitulis: ${path.relative(ROOT, OUT_WILAYAH)}, ${path.relative(ROOT, OUT_SEED)}`);
