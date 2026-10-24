import { getMarkerIconHtml } from "@/lib/marker-icon";
import { STATUS_IRPOM, STATUS_KOSONG_LABEL } from "@/lib/status-irpom";

// Menjelaskan arti ikon marker peta: warna = status, ukuran = luas lahan.
// Ikon dirender dari fungsi yang sama persis dengan marker asli
// (lib/marker-icon.ts) supaya legenda tidak pernah beda dari yang tampil.
export default function MarkerLegend({ adaStatusKosong = false }: { adaStatusKosong?: boolean }) {
  const statusList: (string | null)[] = [...STATUS_IRPOM, ...(adaStatusKosong ? [null] : [])];

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
        <span className="font-medium text-gray-600">Status (warna):</span>
        {statusList.map((status) => (
          <span key={status ?? "kosong"} className="flex items-center gap-1.5">
            <span
              className="inline-flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: getMarkerIconHtml(status, 18) }}
            />
            {status ?? STATUS_KOSONG_LABEL}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-600">Ukuran:</span>
        <span className="inline-flex items-end gap-1">
          <span dangerouslySetInnerHTML={{ __html: getMarkerIconHtml("Pemanfaatan", 16) }} />
          <span dangerouslySetInnerHTML={{ __html: getMarkerIconHtml("Pemanfaatan", 26) }} />
        </span>
        <span>Luas lahan kecil → besar</span>
      </div>
    </div>
  );
}
