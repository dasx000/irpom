import { CheckCircle2, MapPin } from "lucide-react";
import { requirePengelolaPage } from "@/lib/auth-guard";
import { getKelompokDuplikasi } from "@/lib/admin-data";
import { BATAS_DUPLIKASI_M, jarakMeter } from "@/lib/geo";
import { formatAngka, formatHa, googleMapsTitikUrl } from "@/lib/format";
import { statusLabel, statusStyle } from "@/lib/status-irpom";
import PageHeader from "@/components/admin/PageHeader";
import { UbahHapusButtons } from "@/components/admin/IrpomRowActions";

export default async function DuplikasiPage() {
  await requirePengelolaPage();
  const kelompok = await getKelompokDuplikasi();

  return (
    <div>
      <PageHeader
        title="Monitoring Duplikasi"
        description={`Unit yang koordinatnya berjarak ≤ ${BATAS_DUPLIKASI_M} m satu sama lain. Pompa dari hamparan sawah berbeda tidak mungkin sedekat itu, jadi pasti ada salah input — perbaiki koordinatnya atau hapus unit ganda. Kasus hilang otomatis setelah diperbaiki.`}
      />

      {kelompok.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <CheckCircle2 size={32} className="text-green-600" />
          <p className="mt-3 font-medium text-gray-900">Tidak ada duplikasi koordinat</p>
          <p className="text-sm text-gray-500">Semua titik pompa berjarak lebih dari {BATAS_DUPLIKASI_M} m satu sama lain.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-red-700">{formatAngka(kelompok.length)} kasus</span> ·{" "}
            {formatAngka(kelompok.reduce((s, g) => s + g.length, 0))} unit terlibat
          </p>
          {kelompok.map((g, gi) => {
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
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle(u.status).badge}`}>{statusLabel(u.status)}</span>
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
      )}
    </div>
  );
}
