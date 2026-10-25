# Monitoring IRPOM

Sistem informasi & pemetaan geospasial **Irigasi Perpompaan (IRPOM) Kabupaten Way Kanan** — Dinas Tanaman Pangan, Hortikultura, dan Peternakan. Berisi data unit pompa, luas lahan terairi, status, dan peta sebaran per kecamatan/desa. Halaman publik bisa diakses tanpa login; pengelolaan data khusus Admin & Super Admin. Rancangan lengkap ada di [PLAN.md](PLAN.md).

## Tech stack

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **Supabase** — Postgres, Auth, Row Level Security
- **Tailwind CSS v4**
- **Leaflet** / `react-leaflet` — peta sebaran, choropleth, & pemilih lokasi
- **Recharts** — grafik
- **ExcelJS** — template, impor, ekspor, & cadangan Excel

## Fitur

### Halaman publik (`/`)

- Kartu ringkasan: luas lahan terairi, jumlah unit, kelompok tani, kecamatan/desa, dan jumlah unit per status.
- Filter global **Tahun Anggaran** & **Sumber Dana** (tersimpan di URL, bisa dibagikan).
- Grafik luas terairi per kecamatan & distribusi status operasional.
- Peta sebaran: titik pompa berwarna sesuai status (ukuran = luas terairi), choropleth luas per kecamatan, popup detail + tautan lokasi di Google Maps.
- Jelajah wilayah: kecamatan → desa → kelompok tani, dengan pencarian.
- Hanya-lihat: tidak ada unduhan; kolom Keterangan tidak ditampilkan.

### Panel admin (`/admin`)

| Menu | Isi | Akses |
|---|---|---|
| Dashboard | Ringkasan, unit per status, kelengkapan data, peringatan koordinat | Semua |
| Data IRPOM | Tabel + cari + filter (kecamatan → desa, status, tahun, sumber dana), tambah/ubah/hapus, ubah status langsung, ekspor & impor Excel | Semua |
| Belum Lengkap | Unit dengan kolom kosong (koordinat, status, luas terairi, tahun, sumber dana, poktan, ketua), filter per kolom & wilayah | Semua |
| Monitoring Koordinat | Tab **Duplikasi** (titik berjarak ≤ 10 m) & tab **Di luar Way Kanan** (perkiraan penyebab: lat/lng tertukar atau salah ketik) | Semua |
| Pengguna | Tambah akun, ubah nama/role, nonaktifkan (diblokir di Supabase Auth) | Super Admin |
| Audit Log | Riwayat tambah/ubah/hapus data (dicatat trigger database) | Super Admin |
| Cadangan | Unduh seluruh data sebagai 1 file Excel (1 sheet) | Semua |
| Profil | Ubah nama & kata sandi sendiri | Semua |

### Aturan data

- **Status:** Pemberkasan / Pembangunan / Pemanfaatan / Rusak (unit baru default Pemberkasan).
- **Luas lahan terairi** (KPI, grafik, choropleth, total per kecamatan/desa) hanya menjumlahkan unit berstatus **Pemanfaatan**. Luas 0 boleh untuk status selain Pemanfaatan.
- **Sumber Dana:** APBN / APBD / Lainnya.
- **Identitas unit:** UUID saja (tanpa nomor urut / kode unit). Satu poktan boleh punya lebih dari 1 unit.
- **Validasi (form & impor), 3 tingkat:**
  - ❌ **Ditolak** — provinsi, kabupaten, kecamatan, atau desa tidak sesuai master wilayah, atau Kelompok Tani kosong.
  - ⚠️ **Peringatan** — kolom lain kosong/tidak valid (disimpan kosong), koordinat di luar Way Kanan, atau berjarak ≤ 10 m dari unit lain. Lat/lng yang tertukar ditukar otomatis.
  - ✅ **Valid** — selain itu.
- **Impor** selalu menambah data baru, dengan tabel pratinjau (✅/⚠️/❌) sebelum disimpan; baris peringatan bisa dikecualikan. Format template = format ekspor; hanya sheet `Data IRPOM` yang dibaca.

## Struktur

- `app/page.tsx` — halaman publik
- `app/(auth)/login/` — halaman login (email & kata sandi)
- `app/admin/` — panel kelola data
- `app/api/admin/` — unduhan Excel (template, ekspor, cadangan)
- `components/` — komponen UI (`landing/`, `admin/`, peta, dll.)
- `lib/actions/` — Next.js Server Actions
- `lib/validasi-irpom.ts` — validasi bersama untuk form & impor
- `lib/irpom-excel.ts` — template, ekspor, cadangan, & pembaca file impor
- `lib/kelengkapan.ts`, `lib/sumber-dana.ts`, `lib/status-irpom.ts`, `lib/geo.ts` — aturan data (kolom wajib, pilihan baku, batas duplikasi 10 m)
- `lib/supabase/` — Supabase client (`server.ts`, `client.ts`, `admin.ts`)
- `public/geo/` — GeoJSON batas kecamatan & desa Way Kanan (sumber master wilayah & cek batas kabupaten)
- `supabase/migrations/` — skema database, dijalankan berurutan
- `scripts/generate-seed.mjs` — membuat SQL master wilayah & seed data awal dari GeoJSON + `DATA IRPOM.csv`

## Database (migrasi)

| File | Isi |
|---|---|
| `0001_skema_irpom.sql` | Enum, tabel `master_kecamatan`, `master_desa`, `irpom`, `profiles`, `irpom_audit_log`, trigger audit, RLS |
| `0002_master_wilayah.sql` | Data master kecamatan & desa (dibuat oleh `generate-seed.mjs`) |
| `0003_seed_irpom.sql` | Data awal 127 unit (dibuat oleh `generate-seed.mjs`) |
| `0004_rpc_publik.sql` | RPC halaman publik: `irpom_publik`, `irpom_statistik_publik`, `irpom_filter_opsi` |
| `0005_view_irpom_lengkap.sql` | View `irpom_lengkap` untuk panel admin (`security_invoker`) |
| `0006_hapus_top_poktan.sql` | Memperbarui `irpom_statistik_publik` (tanpa data peringkat poktan) |
| `0007_luas_terairi_pemanfaatan.sql` | `irpom_statistik_publik`: luas terairi hanya dari unit berstatus Pemanfaatan |

## Setup

1. Buat project di [supabase.com](https://supabase.com), matikan *Allow new users to sign up* (Authentication → Sign In / Providers).
2. Jalankan file di `supabase/migrations/` **berurutan** (0001, 0002, ...) lewat SQL Editor.
3. Buat akun Super Admin pertama (Authentication → Users → Add user, centang *Auto Confirm User*), lalu jalankan:
   ```sql
   update profiles set role = 'super_admin', nama = 'Nama Anda' where email = 'email@anda';
   ```
4. Salin `.env.local.example` ke `.env.local`, isi 3 variabelnya (Project Settings → API Keys).
5. `npm install`
6. `npm run dev` lalu buka [http://localhost:3000](http://localhost:3000)

Bila `DATA IRPOM.csv` atau GeoJSON berubah, buat ulang SQL seed dengan `node scripts/generate-seed.mjs`. File data mentah (`*.csv`, `*.xlsx`) di root project tidak ikut di-commit (lihat `.gitignore`) — jangan menaruh data pribadi (NIK, nomor HP, rekening) di file yang di-commit.

## Deploy

Deploy sebagai project Next.js biasa (mis. Vercel). Set 3 environment variable yang sama seperti di `.env.local` — `SUPABASE_SERVICE_ROLE_KEY` wajib ada di server (bukan `NEXT_PUBLIC_*`) untuk fitur kelola akun admin.
