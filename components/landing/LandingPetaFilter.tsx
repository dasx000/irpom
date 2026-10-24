"use client";

import { useMemo, useState } from "react";
import PetaSebaranLoader from "@/components/PetaSebaranLoader";
import MarkerLegend from "@/components/MarkerLegend";
import KepadatanLegend from "@/components/KepadatanLegend";
import { formatAngka, formatHa } from "@/lib/format";
import { STATUS_IRPOM, STATUS_KOSONG_LABEL } from "@/lib/status-irpom";
import type { IrpomPublik } from "@/lib/irpom-publik-types";

const STATUS_KOSONG_VALUE = "__kosong__";

const selectClass =
  "min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:flex-none";

// Filter peta (Kecamatan & Status) murni di browser -- memfilter data yang
// sudah diambil, tanpa reload halaman. Filter Tahun Anggaran & Sumber Dana
// ada di hero dan sudah diterapkan di server sebelum data sampai ke sini.
export default function LandingPetaFilter({ units }: { units: IrpomPublik[] }) {
  const [kecamatan, setKecamatan] = useState("");
  const [status, setStatus] = useState("");

  const kecamatanOptions = useMemo(
    () => Array.from(new Set(units.map((u) => u.kecamatan))).sort((a, b) => a.localeCompare(b, "id")),
    [units]
  );
  const adaStatusKosong = units.some((u) => !u.status);

  const filtered = units.filter((u) => {
    if (kecamatan && u.kecamatan !== kecamatan) return false;
    if (status === STATUS_KOSONG_VALUE) return !u.status;
    if (status && u.status !== status) return false;
    return true;
  });
  const tanpaKoordinat = filtered.filter((u) => u.latitude == null || u.longitude == null).length;
  const luas = filtered.reduce((sum, u) => sum + (u.luas_ha ?? 0), 0);

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Kecamatan" value={kecamatan} onChange={(e) => setKecamatan(e.target.value)} className={selectClass}>
          <option value="">Semua Kecamatan</option>
          {kecamatanOptions.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>

        <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
          <option value="">Semua Status</option>
          {STATUS_IRPOM.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          {adaStatusKosong && <option value={STATUS_KOSONG_VALUE}>{STATUS_KOSONG_LABEL}</option>}
        </select>

        {(kecamatan || status) && (
          <button
            type="button"
            onClick={() => {
              setKecamatan("");
              setStatus("");
            }}
            className="px-2 text-sm font-medium text-gray-500 hover:text-red-600"
          >
            Reset
          </button>
        )}
      </div>

      <p className="mt-3 text-sm text-gray-500">
        <span className="font-semibold text-gray-800">{formatAngka(filtered.length)}</span> unit ·{" "}
        <span className="font-semibold text-gray-800">{formatHa(luas)} Ha</span> lahan terairi
        {tanpaKoordinat > 0 && <span> · {formatAngka(tanpaKoordinat)} unit belum memiliki koordinat (tidak tampil di peta)</span>}
      </p>

      <div className="mt-2 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
        <PetaSebaranLoader units={filtered} />
        <MarkerLegend adaStatusKosong={adaStatusKosong} />
        <KepadatanLegend />
      </div>
    </div>
  );
}
