-- "Luas lahan terairi" hanya menghitung unit berstatus Pemanfaatan (pompa
-- yang sudah mengairi sawah). Unit Pemberkasan / Pembangunan / Rusak tetap
-- dihitung jumlah unitnya, tetapi luasnya tidak ikut dijumlahkan -- baik di
-- total (kartu KPI) maupun per kecamatan (grafik & choropleth).
-- create or replace mempertahankan hak akses (grant) yang sudah ada.

-- Ringkasan untuk kartu KPI, grafik, dan choropleth.
-- Total unit = jumlah kolom volume; poktan unik dihitung per Nama Poktan + Desa;
-- nilai kosong tidak ikut dihitung (status kosong tampil sebagai "Belum diisi").
create or replace function irpom_statistik_publik(p_tahun integer default null, p_sumber_dana text default null)
returns jsonb
language sql stable security definer set search_path = public as $$
  with data as (
    select * from irpom_publik(p_tahun, p_sumber_dana)
  )
  select jsonb_build_object(
    'ringkasan', (
      select jsonb_build_object(
        'total_unit', coalesce(sum(volume), 0),
        'total_luas_ha', coalesce(sum(luas_ha) filter (where status = 'Pemanfaatan'), 0),
        'jumlah_poktan', count(distinct (lower(trim(kelompok_tani)), desa, kecamatan)) filter (where kelompok_tani is not null),
        'jumlah_kecamatan', count(distinct kecamatan),
        'jumlah_desa', count(distinct (kecamatan, desa))
      )
      from data
    ),
    'per_status', coalesce((
      select jsonb_agg(jsonb_build_object('status', s.status, 'unit', s.unit) order by s.urutan)
      from (
        select coalesce(status::text, 'Belum diisi') as status,
               coalesce(array_position(enum_range(null::status_irpom), status), 99) as urutan,
               sum(volume) as unit
        from data
        group by status
      ) s
    ), '[]'::jsonb),
    'per_kecamatan', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id_kecamatan', k.id_kecamatan, 'kecamatan', k.kecamatan,
               'unit', k.unit, 'luas_ha', k.luas_ha
             ) order by k.luas_ha desc, k.kecamatan)
      from (
        select id_kecamatan, kecamatan, sum(volume) as unit,
               coalesce(sum(luas_ha) filter (where status = 'Pemanfaatan'), 0) as luas_ha
        from data
        group by id_kecamatan, kecamatan
      ) k
    ), '[]'::jsonb)
  );
$$;
