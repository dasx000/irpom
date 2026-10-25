"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, X } from "lucide-react";

const selectClass =
  "min-w-0 rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

// Filter Kecamatan -> Desa (desa aktif setelah kecamatan dipilih). Parameter
// URL lain (mis. ?kolom=) tetap dipertahankan.
export default function FilterWilayahAdmin({
  kecamatan,
  desa,
  kecamatanList,
  desaList,
}: {
  kecamatan: string;
  desa: string;
  kecamatanList: { id_kecamatan: string; nama_kecamatan: string }[];
  desaList: { id_desa: number; id_kecamatan: string; nama_desa: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function apply(next: { kecamatan: string; desa: string }) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  const desaKecamatan = kecamatan ? desaList.filter((d) => d.id_kecamatan === kecamatan) : [];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Kecamatan" value={kecamatan} onChange={(e) => apply({ kecamatan: e.target.value, desa: "" })} className={selectClass}>
        <option value="">Semua Kecamatan</option>
        {kecamatanList.map((k) => (
          <option key={k.id_kecamatan} value={k.id_kecamatan}>
            {k.nama_kecamatan}
          </option>
        ))}
      </select>
      <select
        aria-label="Desa"
        value={kecamatan ? desa : ""}
        onChange={(e) => apply({ kecamatan, desa: e.target.value })}
        disabled={!kecamatan}
        title={kecamatan ? undefined : "Pilih kecamatan terlebih dahulu"}
        className={`${selectClass} disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400`}
      >
        <option value="">{kecamatan ? "Semua Desa" : "Pilih kecamatan dulu"}</option>
        {desaKecamatan.map((d) => (
          <option key={d.id_desa} value={String(d.id_desa)}>
            {d.nama_desa}
          </option>
        ))}
      </select>
      {kecamatan && (
        <button
          type="button"
          onClick={() => apply({ kecamatan: "", desa: "" })}
          className="flex items-center gap-1 px-2 py-2 text-sm font-medium text-gray-500 hover:text-red-600"
        >
          <X size={14} /> Reset
        </button>
      )}
      {isPending && <Loader2 size={16} className="animate-spin text-sky-600" aria-label="Memuat" />}
    </div>
  );
}
