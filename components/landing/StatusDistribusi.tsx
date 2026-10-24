import { formatAngka } from "@/lib/format";
import { STATUS_IRPOM, STATUS_KOSONG_LABEL, statusStyle } from "@/lib/status-irpom";
import type { IrpomStatistik } from "@/lib/irpom-publik-types";

// Distribusi unit per status: 4 baris batang horizontal + angka & persen.
// Dipilih ketimbang donut karena tetap terbaca saat hampir semua unit ada di
// satu status (donut 1 irisan tidak informatif). Semua 4 status selalu
// tampil (termasuk yang 0) supaya pengunjung tahu siklus lengkapnya.
export default function StatusDistribusi({ data }: { data: IrpomStatistik["per_status"] }) {
  const unitPerStatus = new Map(data.map((s) => [s.status, s.unit]));
  const total = data.reduce((sum, s) => sum + s.unit, 0);
  const kosong = unitPerStatus.get(STATUS_KOSONG_LABEL) ?? 0;

  const rows: { status: string | null; label: string; unit: number; keterangan: string }[] = [
    ...STATUS_IRPOM.map((s) => ({ status: s, label: s, unit: unitPerStatus.get(s) ?? 0, keterangan: statusStyle(s).keterangan })),
    ...(kosong > 0 ? [{ status: null, label: STATUS_KOSONG_LABEL, unit: kosong, keterangan: statusStyle(null).keterangan }] : []),
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="font-semibold text-gray-900">Distribusi Status Operasional</p>
      <p className="text-sm text-gray-500">Jumlah unit pompa per tahap siklus</p>

      <div className="mt-5 space-y-4">
        {rows.map((r) => {
          const persen = total > 0 ? (r.unit / total) * 100 : 0;
          return (
            <div key={r.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 font-medium text-gray-800">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: statusStyle(r.status).color }} />
                  {r.label}
                </span>
                <span className="tabular-nums text-gray-900">
                  <span className="font-semibold">{formatAngka(r.unit)}</span>{" "}
                  <span className="text-xs text-gray-400">
                    unit · {persen.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%
                  </span>
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${persen}%`, backgroundColor: statusStyle(r.status).color }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">{r.keterangan}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
