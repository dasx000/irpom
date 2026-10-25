import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requirePengelolaPage } from "@/lib/auth-guard";
import { getSemuaIrpom, getWilayah } from "@/lib/admin-data";
import { formatAngka } from "@/lib/format";
import { KOLOM_KELENGKAPAN, kolomKosong, type KolomKelengkapan } from "@/lib/kelengkapan";
import PageHeader from "@/components/admin/PageHeader";
import { UbahHapusButtons } from "@/components/admin/IrpomRowActions";
import FilterWilayahAdmin from "@/components/admin/FilterWilayahAdmin";

export default async function KelengkapanPage(props: PageProps<"/admin/kelengkapan">) {
  await requirePengelolaPage();
  const sp = await props.searchParams;
  const [semua, wilayah] = await Promise.all([getSemuaIrpom(), getWilayah()]);

  const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const kecamatan = str(sp.kecamatan);
  const desa = kecamatan ? str(sp.desa) : "";
  const kolomAktif = KOLOM_KELENGKAPAN.find((k) => k.key === sp.kolom)?.key ?? null;

  const semuaBelumLengkap = semua.map((u) => ({ ...u, kosong: kolomKosong(u) })).filter((u) => u.kosong.length > 0);
  // Jumlah per kolom mengikuti wilayah yang dipilih.
  const daftar = semuaBelumLengkap.filter(
    (u) => (!kecamatan || u.id_kecamatan === kecamatan) && (!desa || String(u.id_desa) === desa)
  );

  // Link chip kolom tetap membawa filter wilayah.
  const hrefKolom = (kolom: string | null) => {
    const params = new URLSearchParams();
    if (kolom) params.set("kolom", kolom);
    if (kecamatan) params.set("kecamatan", kecamatan);
    if (desa) params.set("desa", desa);
    const qs = params.toString();
    return qs ? `/admin/kelengkapan?${qs}` : "/admin/kelengkapan";
  };
  const tampil = kolomAktif ? daftar.filter((u) => u.kosong.includes(kolomAktif)) : daftar;
  const jumlahPerKolom = new Map<KolomKelengkapan, number>(
    KOLOM_KELENGKAPAN.map((k) => [k.key, daftar.filter((u) => u.kosong.includes(k.key)).length])
  );

  const chip = (aktif: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
      aktif ? "border-amber-500 bg-amber-50 text-amber-900" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
    }`;

  return (
    <div>
      <PageHeader
        title="Data Belum Lengkap"
        description="Unit yang masih punya kolom kosong. Klik ikon pensil untuk melengkapi; unit hilang dari daftar ini setelah semua kolomnya terisi."
      />

      {semuaBelumLengkap.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <CheckCircle2 size={32} className="text-green-600" />
          <p className="mt-3 font-medium text-gray-900">Semua data sudah lengkap</p>
          <p className="text-sm text-gray-500">Tidak ada unit dengan kolom yang kosong.</p>
        </div>
      ) : (
        <>
          <div className="mb-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <FilterWilayahAdmin kecamatan={kecamatan} desa={desa} kecamatanList={wilayah.kecamatanList} desaList={wilayah.desaList} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={hrefKolom(null)} className={chip(!kolomAktif)}>
              Semua <span className="tabular-nums text-gray-500">{formatAngka(daftar.length)}</span>
            </Link>
            {KOLOM_KELENGKAPAN.map((k) => {
              const n = jumlahPerKolom.get(k.key) ?? 0;
              if (n === 0) return null;
              return (
                <Link key={k.key} href={hrefKolom(k.key)} className={chip(kolomAktif === k.key)}>
                  {k.label} kosong <span className="tabular-nums text-amber-700">{formatAngka(n)}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="w-12 px-3 py-2.5 font-medium">No</th>
                  <th className="px-3 py-2.5 font-medium">Kelompok Tani</th>
                  <th className="px-3 py-2.5 font-medium">Desa / Kecamatan</th>
                  <th className="px-3 py-2.5 font-medium">Kolom yang belum diisi</th>
                  <th className="w-20 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tampil.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-12 text-center text-gray-400">
                      Tidak ada data belum lengkap di wilayah ini.
                    </td>
                  </tr>
                )}
                {tampil.map((u, i) => (
                  <tr key={u.id} className="hover:bg-gray-50/60">
                    <td className="px-3 py-2.5 tabular-nums text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-gray-900">{u.kelompok_tani || <span className="text-amber-600">Belum diisi</span>}</p>
                      {u.ketua_poktan && <p className="text-xs text-gray-500">Ketua: {u.ketua_poktan}</p>}
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-gray-800">{u.desa}</p>
                      <p className="text-xs text-gray-500">{u.kecamatan}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {KOLOM_KELENGKAPAN.filter((k) => u.kosong.includes(k.key)).map((k) => (
                          <span
                            key={k.key}
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              k.key === kolomAktif ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                            }`}
                          >
                            {k.label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <UbahHapusButtons id={u.id} label={u.kelompok_tani || u.desa} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
