"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Compass, MapPin, MapPinOff, Search } from "lucide-react";
import { formatAngka, formatHa, googleMapsTitikUrl } from "@/lib/format";
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
  // Hanya satu kecamatan yang terbuka; membuka yang lain menutup sebelumnya.
  const [terbuka, setTerbuka] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const groups = useMemo(() => groupByWilayah(q ? units.filter((u) => cocok(u, q)) : units), [units, q]);
  const jumlahHasil = groups.reduce((s, g) => s + g.desaList.reduce((t, d) => t + d.units.length, 0), 0);

  function toggle(kecamatan: string, tombol: HTMLButtonElement) {
    const buka = terbuka !== kecamatan;
    setTerbuka(buka ? kecamatan : null);
    // Kecamatan lain di atasnya ikut menutup sehingga posisi tombol bergeser;
    // gulir supaya kecamatan yang baru dibuka tetap terlihat.
    if (buka) requestAnimationFrame(() => tombol.scrollIntoView({ block: "nearest", behavior: "smooth" }));
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
          placeholder="Cari wilayah, kelompok tani, atau ketua..."
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

      <div className="mt-4 divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200">
        {groups.map((g) => {
          // Saat mencari, semua kecamatan hasil pencarian otomatis terbuka.
          const isOpen = !!q || terbuka === g.kecamatan;
          return (
            <div key={g.kecamatan}>
              <button
                type="button"
                onClick={(e) => toggle(g.kecamatan, e.currentTarget)}
                aria-expanded={isOpen}
                className={`flex w-full scroll-mt-28 items-center gap-3 px-4 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-inset ${
                  isOpen ? "bg-sky-50" : "hover:bg-gray-50"
                }`}
              >
                <span className={`h-8 w-1 shrink-0 rounded-full ${isOpen ? "bg-sky-600" : "bg-gray-200"}`} />
                <span className="min-w-0 flex-1">
                  <span className={`block font-medium ${isOpen ? "text-sky-900" : "text-gray-900"}`}>Kecamatan {g.kecamatan}</span>
                  <span className="block text-xs text-gray-500">
                    {formatAngka(g.desaList.length)} desa · {formatAngka(g.unit)} unit · {formatHa(g.luas)} Ha
                  </span>
                </span>
                <ChevronDown size={18} className={`shrink-0 transition-transform ${isOpen ? "rotate-180 text-sky-600" : "text-gray-400"}`} />
              </button>

              {isOpen && (
                <div className="space-y-4 border-t border-sky-100 bg-slate-50 px-4 pt-3 pb-4">
                  {g.desaList.map((d) => (
                    <div key={d.desa}>
                      <div className="flex items-center justify-between gap-2 rounded-lg bg-sky-100/70 px-3 py-2">
                        <p className="flex items-center gap-2 text-sm font-bold text-sky-900">
                          <span className="size-2 rounded-full bg-sky-600" />
                          Desa {d.desa}
                        </p>
                        <span className="rounded-full bg-sky-700 px-2.5 py-0.5 text-xs font-semibold text-white">
                          {formatHa(d.luas)} Ha
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1.5">
                        {d.units.map((u) => (
                          <li
                            key={u.id}
                            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-xs"
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
                                href={googleMapsTitikUrl(u.latitude, u.longitude)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex size-8 items-center justify-center rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100"
                                title="Lihat lokasi di Google Maps"
                                aria-label={`Lihat lokasi ${u.kelompok_tani ?? "unit"} di Google Maps`}
                              >
                                <MapPin size={16} />
                              </a>
                            ) : (
                              <span
                                className="flex size-8 items-center justify-center rounded-md bg-gray-50 text-gray-300"
                                title="Belum ada koordinat"
                                aria-label="Belum ada koordinat"
                              >
                                <MapPinOff size={16} />
                              </span>
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
