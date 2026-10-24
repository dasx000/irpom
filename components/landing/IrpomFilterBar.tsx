"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { FILTER_KOSONG_PARAM, type IrpomFilterOpsi } from "@/lib/irpom-publik-types";
import { STATUS_KOSONG_LABEL } from "@/lib/status-irpom";

const selectClass =
  "min-w-0 flex-1 rounded-lg border border-white/25 bg-white/15 px-3 py-2 text-sm text-white backdrop-blur-md focus:border-white/60 focus:outline-none sm:flex-none [&>option]:text-gray-900";

// Filter global halaman publik (Tahun Anggaran & Sumber Dana). Disimpan di
// URL (?tahun=&sumber=) supaya hasil filter bisa dibagikan lewat tautan;
// halaman dirender ulang di server dengan data RPC yang sudah difilter.
export default function IrpomFilterBar({
  opsi,
  tahun,
  sumber,
}: {
  opsi: IrpomFilterOpsi;
  tahun: string;
  sumber: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function apply(next: { tahun: string; sumber: string }) {
    const params = new URLSearchParams();
    if (next.tahun) params.set("tahun", next.tahun);
    if (next.sumber) params.set("sumber", next.sumber);
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto">
      <select
        aria-label="Tahun Anggaran"
        value={tahun}
        onChange={(e) => apply({ tahun: e.target.value, sumber })}
        className={selectClass}
      >
        <option value="">Semua Tahun Anggaran</option>
        {opsi.tahun_anggaran.map((t) => (
          <option key={t} value={String(t)}>
            TA {t}
          </option>
        ))}
        {opsi.ada_tahun_kosong && <option value={FILTER_KOSONG_PARAM}>Tahun: {STATUS_KOSONG_LABEL}</option>}
      </select>

      <select
        aria-label="Sumber Dana"
        value={sumber}
        onChange={(e) => apply({ tahun, sumber: e.target.value })}
        className={selectClass}
      >
        <option value="">Semua Sumber Dana</option>
        {opsi.sumber_dana.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
        {opsi.ada_sumber_dana_kosong && <option value={FILTER_KOSONG_PARAM}>Sumber dana: {STATUS_KOSONG_LABEL}</option>}
      </select>

      {isPending && <Loader2 size={16} className="animate-spin text-white/80" aria-label="Memuat" />}
    </div>
  );
}
