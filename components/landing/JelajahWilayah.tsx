"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Compass, MapPin, Search } from "lucide-react";
import { formatAngka, formatHa, googleMapsRuteUrl } from "@/lib/format";
import { statusLabel, statusStyle } from "@/lib/status-irpom";
import type { IrpomPublik } from "@/lib/irpom-publik-types";

interface DesaGroup {
  desa: string;
  units: IrpomPublik[];
  luas: number;
}

interface KecamatanGroup {
  kecamatan: string;
  desaList: DesaGroup[];
  unit: number;
  luas: number;
}

function groupByWilayah(units: IrpomPublik[]): KecamatanGroup[] {
  const kecMap = new Map<string, Map<string, IrpomPublik[]>>();
  for (const u of units) {
    const desaMap = kecMap.get(u.kecamatan) ?? new Map<string, IrpomPublik[]>();
    desaMap.set(u.desa, [...(desaMap.get(u.desa) ?? []), u]);
    kecMap.set(u.kecamatan, desaMap);
  }

  const sum = (list: IrpomPublik[]) => list.reduce((s, u) => s + (u.luas_ha ?? 0), 0);

  return Array.from(kecMap, ([kecamatan, desaMap]) => {
    const desaList = Array.from(desaMap, ([desa, list]) => ({
      desa,
      units: [...list].sort((a, b) => (b.luas_ha ?? 0) - (a.luas_ha ?? 0)),
      luas: sum(list),
    })).sort((a, b) => a.desa.localeCompare(b.desa, "id"));
    const all = desaList.flatMap((d) => d.units);
    return { kecamatan, desaList, unit: all.reduce((s, u) => s + u.volume, 0), luas: sum(all) };
  }).sort((a, b) => b.luas - a.luas);
}

function cocok(u: IrpomPublik, q: string) {
  return [u.kecamatan, u.desa, u.kelompok_tani, u.ketua_poktan].some((v) => v?.toLowerCase().includes(q));
}

export default function JelajahWilayah({ units }: { units: IrpomPublik[] }) {
  const [query, setQuery] = useState("");
  const [terbuka, setTerbuka] = useState<Set<string>>(new Set());

  const q = query.trim().toLowerCase();
  const groups = useMemo(() => groupByWilayah(q ? units.filter((u) => cocok(u, q)) : units), [units, q]);
  const jumlahHasil = groups.reduce((s, g) => s + g.desaList.reduce((t, d) => t + d.units.length, 0), 0);

  function toggle(kecamatan: string) {
    setTerbuka((prev) => {
      const next = new Set(prev);
      if (next.has(kecamatan)) next.delete(kecamatan);
      else next.add(kecamatan);
      return next;
    });
  }

  return (
    <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
          <Compass size={20} />
        </span>
        <div>
          <p className="font-semibold text-gray-900">Jelajah Kecamatan, Desa & Kelompok Tani</p>
          <p className="text-sm text-gray-500">Pilih kecamatan untuk melihat rincian desa dan kelompok tani</p>
        </div>
      </div>

      <div className="relative mt-6">
        <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari desa, kecamatan, kelompok tani, atau ketua..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pr-4 pl-10 text-sm text-gray-700 outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
        />
      </div>

      {q && (
        <p className="mt-3 text-sm text-gray-500">
          {jumlahHasil === 0
            ? "Tidak ada hasil yang cocok."
            : `${formatAngka(jumlahHasil)} kelompok tani di ${formatAngka(groups.length)} kecamatan cocok dengan pencarian.`}
        </p>
      )}

      <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100">
        {groups.map((g) => {
          // Saat mencari, semua kecamatan hasil pencarian otomatis terbuka.
          const isOpen = !!q || terbuka.has(g.kecamatan);
          return (
            <div key={g.kecamatan}>
              <button
                type="button"
                onClick={() => toggle(g.kecamatan)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-gray-900">{g.kecamatan}</span>
                  <span className="block text-xs text-gray-500">
                    {formatAngka(g.desaList.length)} desa · {formatAngka(g.unit)} unit · {formatHa(g.luas)} Ha
                  </span>
                </span>
                <ChevronDown size={18} className={`shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen && (
                <div className="space-y-4 bg-gray-50/60 px-4 pt-1 pb-4">
                  {g.desaList.map((d) => (
                    <div key={d.desa}>
                      <p className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="font-semibold text-gray-800">Desa {d.desa}</span>
                        <span className="text-xs text-gray-500">{formatHa(d.luas)} Ha</span>
                      </p>
                      <ul className="mt-1.5 space-y-1.5">
                        {d.units.map((u) => (
                          <li
                            key={u.id}
                            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm"
                          >
                            <span className="min-w-0 flex-1 basis-40">
                              <span className="block font-medium text-gray-900">{u.kelompok_tani ?? "-"}</span>
                              {u.ketua_poktan && <span className="block text-xs text-gray-500">Ketua: {u.ketua_poktan}</span>}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyle(u.status).badge}`}
                            >
                              {statusLabel(u.status)}
                            </span>
                            <span className="tabular-nums font-semibold text-gray-900">
                              {u.luas_ha != null ? `${formatHa(u.luas_ha)} Ha` : "-"}
                            </span>
                            {u.latitude != null && u.longitude != null ? (
                              <a
                                href={googleMapsRuteUrl(u.latitude, u.longitude)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-sky-700 hover:underline"
                                title="Buka rute di Google Maps"
                              >
                                <MapPin size={12} />
                                {u.latitude.toFixed(5)}, {u.longitude.toFixed(5)}
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400">Belum ada koordinat</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
