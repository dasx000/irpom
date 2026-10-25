"use client";

import { useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { STATUS_IRPOM } from "@/lib/status-irpom";
import type { FilterAdmin } from "@/lib/admin-data";

const selectClass =
  "min-w-0 rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

export default function IrpomFilterAdmin({
  filter,
  kecamatanList,
  desaList,
  tahunList,
  sumberList,
  size,
}: {
  filter: FilterAdmin;
  kecamatanList: { id_kecamatan: string; nama_kecamatan: string }[];
  desaList: { id_desa: number; id_kecamatan: string; nama_desa: string }[];
  tahunList: number[];
  sumberList: string[];
  size: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(filter.q);

  function apply(next: Partial<FilterAdmin>) {
    const merged = { ...filter, ...next };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    if (size !== 25) params.set("size", String(size));
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    apply({ q: q.trim() });
  }

  const adaFilter = Object.values(filter).some(Boolean);
  const desaKecamatan = filter.kecamatan ? desaList.filter((d) => d.id_kecamatan === filter.kecamatan) : [];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <form onSubmit={onSearch} className="relative">
        <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari kelompok tani, ketua, desa, atau kecamatan... (Enter)"
          className="w-full rounded-md border border-gray-300 py-2 pr-3 pl-9 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </form>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <select aria-label="Kecamatan" value={filter.kecamatan} onChange={(e) => apply({ kecamatan: e.target.value, desa: "" })} className={selectClass}>
          <option value="">Semua Kecamatan</option>
          {kecamatanList.map((k) => (
            <option key={k.id_kecamatan} value={k.id_kecamatan}>
              {k.nama_kecamatan}
            </option>
          ))}
        </select>
        <select
          aria-label="Desa"
          value={filter.kecamatan ? filter.desa : ""}
          onChange={(e) => apply({ desa: e.target.value })}
          disabled={!filter.kecamatan}
          title={filter.kecamatan ? undefined : "Pilih kecamatan terlebih dahulu"}
          className={`${selectClass} disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400`}
        >
          <option value="">{filter.kecamatan ? "Semua Desa" : "Pilih kecamatan dulu"}</option>
          {desaKecamatan.map((d) => (
            <option key={d.id_desa} value={String(d.id_desa)}>
              {d.nama_desa}
            </option>
          ))}
        </select>
        <select aria-label="Status" value={filter.status} onChange={(e) => apply({ status: e.target.value })} className={selectClass}>
          <option value="">Semua Status</option>
          {STATUS_IRPOM.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select aria-label="Tahun Anggaran" value={filter.tahun} onChange={(e) => apply({ tahun: e.target.value })} className={selectClass}>
          <option value="">Semua Tahun</option>
          {tahunList.map((t) => (
            <option key={t} value={String(t)}>
              TA {t}
            </option>
          ))}
        </select>
        <select aria-label="Sumber Dana" value={filter.sumber} onChange={(e) => apply({ sumber: e.target.value })} className={selectClass}>
          <option value="">Semua Sumber Dana</option>
          {sumberList.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {adaFilter && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              apply({ q: "", kecamatan: "", desa: "", status: "", tahun: "", sumber: "" });
            }}
            className="flex items-center gap-1 px-2 py-2 text-sm font-medium text-gray-500 hover:text-red-600"
          >
            <X size={14} /> Reset
          </button>
        )}
        {isPending && <Loader2 size={16} className="animate-spin text-sky-600" aria-label="Memuat" />}
      </div>
    </div>
  );
}
