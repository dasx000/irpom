import Link from "next/link";
import { Download, MapPinOff, Plus, Upload } from "lucide-react";
import { requirePengelolaPage } from "@/lib/auth-guard";
import { getDaftarIrpom, getOpsiTahunSumber, getWilayah, parseFilterAdmin } from "@/lib/admin-data";
import { formatHa } from "@/lib/format";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/admin/Pagination";
import IrpomFilterAdmin from "@/components/admin/IrpomFilterAdmin";
import { StatusSelect, UbahHapusButtons } from "@/components/admin/IrpomRowActions";
import PageSizeSelect from "@/components/PageSizeSelect";

const UKURAN_HALAMAN = [10, 25, 50, 100];

export default async function DataIrpomPage(props: PageProps<"/admin/irpom">) {
  await requirePengelolaPage();
  const sp = await props.searchParams;
  const filter = parseFilterAdmin(sp);
  const sizeRaw = Number(sp.size);
  const size = UKURAN_HALAMAN.includes(sizeRaw) ? sizeRaw : 25;
  const page = Math.max(1, Number(sp.page) || 1);

  const [{ rows, total }, wilayah, opsi] = await Promise.all([
    getDaftarIrpom(filter, page, size),
    getWilayah(),
    getOpsiTahunSumber(),
  ]);

  const eksporParams = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) if (v) eksporParams.set(k, v);
  const eksporHref = `/api/admin/irpom/ekspor${eksporParams.size ? `?${eksporParams}` : ""}`;

  return (
    <div>
      <PageHeader
        title="Data IRPOM"
        description="Kelola data unit pompa irigasi. Perubahan otomatis tercatat di Audit Log."
        actions={
          <>
            <a href={eksporHref} className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Download size={15} /> Ekspor Excel
            </a>
            <Link href="/admin/irpom/impor" className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Upload size={15} /> Impor
            </Link>
            <Link href="/admin/irpom/tambah" className="inline-flex items-center gap-1.5 rounded-md bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-800">
              <Plus size={15} /> Tambah Unit
            </Link>
          </>
        }
      />

      <IrpomFilterAdmin filter={filter} kecamatanList={wilayah.kecamatanList} tahunList={opsi.tahun} sumberList={opsi.sumber} size={size} />

      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="w-12 px-3 py-2.5 font-medium">No</th>
              <th className="px-3 py-2.5 font-medium">Kelompok Tani</th>
              <th className="px-3 py-2.5 font-medium">Desa / Kecamatan</th>
              <th className="px-3 py-2.5 text-right font-medium">Luas (Ha)</th>
              <th className="px-3 py-2.5 font-medium">TA / Sumber</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Koordinat</th>
              <th className="w-20 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-12 text-center text-gray-400">
                  Tidak ada data yang cocok.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={r.id} className="hover:bg-gray-50/60">
                <td className="px-3 py-2.5 tabular-nums text-gray-400">{(page - 1) * size + i + 1}</td>
                <td className="px-3 py-2.5">
                  <p className="font-medium text-gray-900">{r.kelompok_tani ?? <span className="text-amber-600">Belum diisi</span>}</p>
                  <p className="text-xs text-gray-500">{r.ketua_poktan ? `Ketua: ${r.ketua_poktan}` : "Ketua belum diisi"}</p>
                </td>
                <td className="px-3 py-2.5">
                  <p className="text-gray-800">{r.desa}</p>
                  <p className="text-xs text-gray-500">{r.kecamatan}</p>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums font-medium text-gray-900">
                  {r.luas_ha != null ? formatHa(r.luas_ha) : <span className="text-amber-600">-</span>}
                  {r.volume > 1 && <p className="text-xs font-normal text-gray-500">{r.volume} unit</p>}
                </td>
                <td className="px-3 py-2.5 text-gray-700">
                  {r.tahun_anggaran ?? <span className="text-amber-600">-</span>}
                  <p className="text-xs text-gray-500">{r.sumber_dana ?? "-"}</p>
                </td>
                <td className="px-3 py-2.5">
                  <StatusSelect key={`${r.id}-${r.status}`} id={r.id} status={r.status} />
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-gray-600">
                  {r.latitude != null && r.longitude != null ? (
                    <>
                      {r.latitude.toFixed(5)}
                      <br />
                      {r.longitude.toFixed(5)}
                    </>
                  ) : (
                    <span className="flex items-center gap-1 font-sans text-amber-600">
                      <MapPinOff size={13} /> Belum ada
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <UbahHapusButtons id={r.id} label={r.kelompok_tani ?? r.desa} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <PageSizeSelect basePath="/admin/irpom" />
        <div className="min-w-0 flex-1">
          <Pagination basePath="/admin/irpom" searchParams={sp} page={page} size={size} total={total} />
        </div>
      </div>
    </div>
  );
}
