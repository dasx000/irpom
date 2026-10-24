-- RPC data publik (tanpa login) untuk halaman publik Monitoring IRPOM.
-- Publik tidak membaca tabel irpom langsung; semua lewat fungsi di bawah,
-- yang tidak memuat kolom keterangan (catatan internal admin).
--
-- Parameter filter dipakai bersama oleh semua fungsi:
--   p_tahun        null = semua tahun,       0  = hanya yang Tahun Anggaran-nya kosong
--   p_sumber_dana  null = semua sumber dana, '' = hanya yang Sumber Dana-nya kosong

create function irpom_publik(p_tahun integer default null, p_sumber_dana text default null)
returns table (
  id uuid,
  id_kecamatan text,
  kecamatan text,
  desa text,
  kelompok_tani text,
  ketua_poktan text,
  volume integer,
  luas_ha numeric,
  tahun_anggaran smallint,
  sumber_dana text,
  status status_irpom,
  latitude double precision,
  longitude double precision
)
language sql stable security definer set search_path = public as $$
  select i.id, k.id_kecamatan, k.nama_kecamatan, d.nama_desa, i.kelompok_tani, i.ketua_poktan,
         i.volume, i.luas_ha, i.tahun_anggaran, i.sumber_dana, i.status, i.latitude, i.longitude
  from irpom i
  join master_desa d on d.id_desa = i.id_desa
  join master_kecamatan k on k.id_kecamatan = d.id_kecamatan
  where (p_tahun is null or (p_tahun = 0 and i.tahun_anggaran is null) or i.tahun_anggaran = p_tahun)
    and (p_sumber_dana is null or (p_sumber_dana = '' and i.sumber_dana is null) or i.sumber_dana = p_sumber_dana);
$$;

-- Ringkasan untuk kartu KPI, grafik, choropleth, dan tabel poktan terluas.
-- Total unit = jumlah kolom volume; poktan unik dihitung per Nama Poktan + Desa;
-- nilai kosong tidak ikut dihitung (status kosong tampil sebagai "Belum diisi").
create function irpom_statistik_publik(p_tahun integer default null, p_sumber_dana text default null)
returns jsonb
language sql stable security definer set search_path = public as $$
  with data as (
    select * from irpom_publik(p_tahun, p_sumber_dana)
  )
  select jsonb_build_object(
    'ringkasan', (
      select jsonb_build_object(
        'total_unit', coalesce(sum(volume), 0),
        'total_luas_ha', coalesce(sum(luas_ha), 0),
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
        select id_kecamatan, kecamatan, sum(volume) as unit, coalesce(sum(luas_ha), 0) as luas_ha
        from data
        group by id_kecamatan, kecamatan
      ) k
    ), '[]'::jsonb),
    'top_poktan', coalesce((
      select jsonb_agg(jsonb_build_object(
               'kelompok_tani', t.kelompok_tani, 'desa', t.desa, 'kecamatan', t.kecamatan, 'luas_ha', t.luas_ha
             ) order by t.luas_ha desc)
      from (
        select kelompok_tani, desa, kecamatan, luas_ha
        from data
        where luas_ha is not null and kelompok_tani is not null
        order by luas_ha desc
        limit 5
      ) t
    ), '[]'::jsonb)
  );
$$;

-- Pilihan filter Tahun Anggaran & Sumber Dana, diambil dari data yang ada.
create function irpom_filter_opsi()
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'tahun_anggaran', coalesce((
      select jsonb_agg(t order by t desc) from (select distinct tahun_anggaran as t from irpom where tahun_anggaran is not null) x
    ), '[]'::jsonb),
    'ada_tahun_kosong', exists (select 1 from irpom where tahun_anggaran is null),
    'sumber_dana', coalesce((
      select jsonb_agg(s order by s) from (select distinct sumber_dana as s from irpom where sumber_dana is not null) x
    ), '[]'::jsonb),
    'ada_sumber_dana_kosong', exists (select 1 from irpom where sumber_dana is null)
  );
$$;

revoke execute on function irpom_publik(integer, text) from public;
revoke execute on function irpom_statistik_publik(integer, text) from public;
revoke execute on function irpom_filter_opsi() from public;
grant execute on function irpom_publik(integer, text) to anon, authenticated;
grant execute on function irpom_statistik_publik(integer, text) to anon, authenticated;
grant execute on function irpom_filter_opsi() to anon, authenticated;
