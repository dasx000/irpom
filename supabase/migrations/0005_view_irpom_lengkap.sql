-- View untuk panel admin: data irpom + nama kecamatan & desa, supaya
-- pencarian, filter, dan pengurutan di tabel admin cukup satu query.
-- security_invoker = true: RLS tabel irpom tetap berlaku (hanya pengelola
-- aktif yang bisa membaca; publik tetap lewat RPC di 0004_rpc_publik.sql).

create view irpom_lengkap
with (security_invoker = true) as
select
  i.*,
  k.id_kecamatan,
  k.nama_kecamatan as kecamatan,
  d.nama_desa as desa
from irpom i
join master_desa d on d.id_desa = i.id_desa
join master_kecamatan k on k.id_kecamatan = d.id_kecamatan;

revoke all on irpom_lengkap from anon;
grant select on irpom_lengkap to authenticated;
