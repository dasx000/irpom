import { Trophy } from "lucide-react";
import { formatHa } from "@/lib/format";
import type { IrpomStatistik } from "@/lib/irpom-publik-types";

export default function TopPoktanTable({ data }: { data: IrpomStatistik["top_poktan"] }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
          <Trophy size={18} />
        </span>
        <div>
          <p className="font-semibold text-gray-900">5 Kelompok Tani dengan Hamparan Terluas</p>
          <p className="text-sm text-gray-500">Poktan pengelola lahan terairi terbesar</p>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">Belum ada data.</p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="w-10 py-2 pr-3 font-medium">#</th>
                <th className="py-2 pr-3 font-medium">Kelompok Tani</th>
                <th className="py-2 pr-3 font-medium">Desa / Kecamatan</th>
                <th className="py-2 text-right font-medium">Luas (Ha)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={`${d.kelompok_tani}-${d.desa}-${i}`} className="border-b border-gray-100 last:border-0">
                  <td className="py-2.5 pr-3 font-semibold text-gray-400">{i + 1}</td>
                  <td className="py-2.5 pr-3 font-medium text-gray-900">{d.kelompok_tani}</td>
                  <td className="py-2.5 pr-3 text-gray-600">
                    {d.desa}
                    <span className="text-gray-400"> · {d.kecamatan}</span>
                  </td>
                  <td className="py-2.5 text-right tabular-nums font-semibold text-gray-900">{formatHa(d.luas_ha)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
