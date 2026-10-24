# Monitoring IRPOM

Sistem informasi & pemetaan geospasial **Irigasi Perpompaan (IRPOM) Kabupaten Way Kanan** — data unit pompa, luas lahan terairi, status, dan peta sebaran per kecamatan/desa. Halaman publik bisa diakses tanpa login; pengelolaan data khusus Admin & Super Admin. Rancangan lengkap ada di [PLAN.md](PLAN.md).

## Tech stack

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **Supabase** — Postgres, Auth, Row Level Security
- **Tailwind CSS v4**
- **Leaflet** / `react-leaflet` — peta sebaran & pemilih lokasi
- **Recharts** — grafik
- **ExcelJS** — impor/ekspor data via Excel

## Struktur

- `app/page.tsx` — halaman publik (statistik, grafik, peta sebaran, jelajah wilayah)
- `app/(auth)/login/` — halaman login (email & kata sandi)
- `app/admin/` — panel kelola data (Admin & Super Admin)
- `components/` — komponen UI, dikelompokkan per fitur
- `lib/actions/` — Next.js Server Actions
- `lib/supabase/` — inisialisasi Supabase client (`server.ts`, `client.ts`, `admin.ts`)
- `public/geo/` — GeoJSON batas kecamatan & desa Way Kanan (sumber master wilayah)
- `supabase/migrations/` — skema database, dijalankan berurutan
- `scripts/generate-seed.mjs` — membuat SQL master wilayah & seed data awal dari GeoJSON + `DATA IRPOM.csv`

## Model peran

- **Super Admin** — semua hak Admin + kelola akun admin, audit log, cadangan data.
- **Admin** — tambah/ubah/hapus data IRPOM, ubah status, impor/ekspor Excel.

Akun hanya dibuat oleh Super Admin (pendaftaran publik dimatikan). Akun yang dinonaktifkan juga diblokir di Supabase Auth.

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

Bila `DATA IRPOM.csv` atau GeoJSON berubah, buat ulang SQL seed dengan `node scripts/generate-seed.mjs`.

## Deploy

Deploy sebagai project Next.js biasa (mis. Vercel). Set 3 environment variable yang sama seperti di `.env.local` — `SUPABASE_SERVICE_ROLE_KEY` wajib ada di server (bukan `NEXT_PUBLIC_*`) untuk fitur kelola akun admin.
