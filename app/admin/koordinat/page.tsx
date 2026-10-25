import Link from "next/link";
import { CheckCircle2, MapPin } from "lucide-react";
import { requirePengelolaPage } from "@/lib/auth-guard";
import { getMonitoringKoordinat } from "@/lib/admin-data";
import { BATAS_DUPLIKASI_M, jarakMeter } from "@/lib/geo";
import { formatAngka, formatHa, googleMapsTitikUrl } from "@/lib/format";
import { statusLabel, statusStyle } from "@/lib/status-irpom";
import PageHeader from "@/components/admin/PageHeader";
import { UbahHapusButtons } from "@/components/admin/IrpomRowActions";

const TAB = [
  { key: "duplikasi", label: `Duplikasi (≤ ${BATAS_DUPLIKASI_M} m)` },
  { key: "luar", label: "Di luar Way Kanan" },
] as const;

function Kosong({ judul, keterangan }: { judul: string; keterangan: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
      <CheckCircle2 size={32} className="text-green-600" />
      <p className="mt-3 font-medium text-gray-900">{judul}</p>
      <p className="text-sm text-gray-500">{keterangan}</p>
    </div>
  );
}

export default async function MonitoringKoordinatPage(props: PageProps<"/admin/koordinat">) {
  await requirePengelolaPage();
  const sp = await props.searchParams;
  const { duplikasi, diLuar } = await getMonitoringKoordinat();
  const tab = sp.tab === "luar" ? "luar" : "duplikasi";
  const jumlah = { duplikasi: duplikasi.length, luar: diLuar.length };

  return (
    <div>
      <PageHeader
        title="Monitoring Koordinat"
        description="Titik pompa yang perlu diperiksa: duplikasi atau berada di luar Kabupaten Way Kanan. Perbaiki lewat tombol Ubah (geser pin di peta) atau hapus unit ganda. Kasus hilang otomatis setelah diperbaiki."
      />

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-gray-200 text-sm">
        {TAB.map((t) => {
          const aktif = tab === t.key;
          return (
            <Link
              key={t.key}
              href={t.key === "duplikasi" ? "/admin/koordinat" : "/admin/koordinat?tab=luar"}
              className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 font-medium ${
                aktif ? "border-sky-600 text-sky-800" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 text-[11px] font-semibold ${
                  jumlah[t.key] > 0 ? "bg-red-600 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {jumlah[t.key]}
              </span>
            </Link>
          );
        })}
      </div>

      {tab === "duplikasi" &&
        (duplikasi.length === 0 ? (
          <Kosong judul="Tidak ada duplikasi koordinat" keterangan={`Semua titik pompa berjarak lebih dari ${BATAS_DUPLIKASI_M} m satu sama lain.`} />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Pompa dari hamparan sawah berbeda tidak mungkin berjarak ≤ {BATAS_DUPLIKASI_M} m, jadi pasti ada salah input.{" "}
              <span className="font-semibold text-red-700">{formatAngka(duplikasi.length)} kasus</span> ·{" "}
              {formatAngka(duplikasi.reduce((s, g) => s + g.length, 0))} unit terlibat
            </p>
            {duplikasi.map((g, gi) => {
              const acuan = g[0];
              const jarakMaks = Math.max(...g.map((u) => jarakMeter(acuan, u)));
              return (
                <div key={acuan.id} className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-100 bg-red-50 px-4 py-2.5 text-sm">
                    <p className="font-semibold text-red-900">
                      Kasus {gi + 1}: {g.length} unit {jarakMaks < 0.05 ? "di koordinat yang sama persis" : `dalam radius ${jarakMaks.toFixed(1)} m`}
                    </p>
                    <a
                      href={googleMapsTitikUrl(acuan.lat, acuan.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-mono text-xs text-sky-700 hover:underline"
                    >
                      <MapPin size={12} /> {acuan.lat.toFixed(6)}, {acuan.lng.toFixed(6)}
                    </a>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                      <tbody className="divide-y divide-gray-100">
                        {g.map((u) => (
                          <tr key={u.id}>
                            <td className="px-4 py-2.5">
                              <p className="font-medium text-gray-900">{u.kelompok_tani ?? "-"}</p>
                              <p className="text-xs text-gray-500">
                                Desa {u.desa}, Kec. {u.kecamatan}
                              </p>
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{u.luas_ha != null ? `${formatHa(u.luas_ha)} Ha` : "-"}</td>
                            <td className="px-3 py-2.5">
                              <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle(u.status).badge}`}>
                                {statusLabel(u.status)}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-mono text-xs text-gray-600">
                              {u.lat.toFixed(6)}, {u.lng.toFixed(6)}
                            </td>
                            <td className="px-3 py-2.5 text-right text-xs text-gray-500">
                              {u === acuan ? "acuan" : `${jarakMeter(acuan, u).toFixed(1)} m`}
                            </td>
                            <td className="px-3 py-2.5">
                              <UbahHapusButtons id={u.id} label={u.kelompok_tani ?? u.desa} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {tab === "luar" &&
        (diLuar.length === 0 ? (
          <Kosong judul="Semua titik berada di Way Kanan" keterangan="Tidak ada unit yang koordinatnya di luar batas kabupaten." />
        ) : (
          <div>
            <p className="mb-3 text-sm text-gray-600">
              Titik pompa berada di luar batas Kabupaten Way Kanan, biasanya karena salah ketik, tanda minus hilang, atau Latitude/Longitude tertukar.{" "}
              <span className="font-semibold text-red-700">{formatAngka(diLuar.length)} unit</span>
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-2.5 font-medium">Kelompok Tani</th>
                    <th className="px-3 py-2.5 font-medium">Koordinat tersimpan</th>
                    <th className="px-3 py-2.5 font-medium">Kemungkinan penyebab</th>
                    <th className="w-20 px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {diLuar.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-gray-900">{u.kelompok_tani ?? "-"}</p>
                        <p className="text-xs text-gray-500">
                          Desa {u.desa}, Kec. {u.kecamatan}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        <a
                          href={googleMapsTitikUrl(u.lat, u.lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 font-mono text-xs text-sky-700 hover:underline"
                          title="Lihat titik di Google Maps"
                        >
                          <MapPin size={12} /> {u.lat.toFixed(6)}, {u.lng.toFixed(6)}
                        </a>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                          {u.kemungkinanTertukar ? "Latitude/Longitude tertukar" : "Salah ketik / tanda minus"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <UbahHapusButtons id={u.id} label={u.kelompok_tani ?? u.desa} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
    </div>
  );
}
