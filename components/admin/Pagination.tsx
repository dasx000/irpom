import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatAngka } from "@/lib/format";

// Navigasi halaman berbasis query param (?page=), mempertahankan filter lain.
export default function Pagination({
  basePath,
  searchParams,
  page,
  size,
  total,
}: {
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  page: number;
  size: number;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / size));
  const href = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (typeof v === "string" && v && k !== "page") params.set(k, v);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const dari = total === 0 ? 0 : (page - 1) * size + 1;
  const sampai = Math.min(page * size, total);
  const btn = "flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
      <p>
        {formatAngka(dari)}–{formatAngka(sampai)} dari {formatAngka(total)} data
      </p>
      <div className="flex shrink-0 items-center gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} aria-label="Halaman sebelumnya" className={`${btn} hover:bg-gray-50`}>
            <ChevronLeft size={15} /> <span className="hidden sm:inline">Sebelumnya</span>
          </Link>
        ) : (
          <span className={`${btn} opacity-40`}>
            <ChevronLeft size={15} /> <span className="hidden sm:inline">Sebelumnya</span>
          </span>
        )}
        <span className="whitespace-nowrap tabular-nums">
          {page} / {totalPages}
        </span>
        {page < totalPages ? (
          <Link href={href(page + 1)} aria-label="Halaman berikutnya" className={`${btn} hover:bg-gray-50`}>
            <span className="hidden sm:inline">Berikutnya</span> <ChevronRight size={15} />
          </Link>
        ) : (
          <span className={`${btn} opacity-40`}>
            <span className="hidden sm:inline">Berikutnya</span> <ChevronRight size={15} />
          </span>
        )}
      </div>
    </div>
  );
}
