import { ChevronDown, Droplets, Map as MapIcon, Ruler, Users, type LucideIcon } from "lucide-react";
import IrpomFilterBar from "@/components/landing/IrpomFilterBar";
import { formatAngka, formatHa } from "@/lib/format";
import { STATUS_IRPOM, statusStyle } from "@/lib/status-irpom";
import type { IrpomFilterOpsi, IrpomStatistik } from "@/lib/irpom-publik-types";
import { KEPALA_DINAS, NAMA_DINAS } from "@/lib/instansi";

function KpiCard({
  icon: Icon,
  value,
  satuan,
  label,
  catatan,
}: {
  icon: LucideIcon;
  value: string;
  satuan?: string;
  label: string;
  catatan?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-left backdrop-blur-md sm:px-5">
      <Icon size={18} className="text-sky-200" />
      <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
        {value}
        {satuan && <span className="ml-1 text-sm font-semibold text-sky-100">{satuan}</span>}
      </p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-sky-100">{label}</p>
      {catatan && <p className="mt-1 text-[10px] leading-tight text-sky-100/75">{catatan}</p>}
    </div>
  );
}

// Foto sawah & pegunungan Way Kanan sebagai background hero.
export default function LandingHero({
  statistik,
  opsi,
  tahun,
  sumber,
}: {
  statistik: IrpomStatistik;
  opsi: IrpomFilterOpsi;
  tahun: string;
  sumber: string;
}) {
  const { ringkasan } = statistik;
  const unitPerStatus = new Map(statistik.per_status.map((s) => [s.status, s.unit]));
  const unitStatusKosong = unitPerStatus.get("Belum diisi") ?? 0;

  return (
    <section id="beranda" className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-20">
        {/* <picture> biasa (bukan next/image) supaya browser langsung memakai
            AVIF 53 KB yang sudah dikompres -- optimizer Next akan mengonversi
            ulang ke WebP yang justru lebih besar. JPEG untuk browser lama. */}
        <picture>
          <source srcSet="/images/hero-bg.avif" type="image/avif" />
          <img
            src="/images/hero-bg.jpg"
            alt="Hamparan sawah dan pegunungan di Kabupaten Way Kanan"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full scale-105 object-cover blur-[2px]"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-b from-sky-950/80 via-sky-900/55 to-sky-950/90" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-28 text-center text-white sm:px-6">
        <p className="animate-fade-in-up text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">{NAMA_DINAS}</p>
        <p className="animate-fade-in-up mt-2 mb-6 text-xl leading-snug text-sky-100 sm:text-2xl md:text-3xl" style={{ animationDelay: "50ms" }}>
          Kepala Dinas: <span className="font-bold text-white">{KEPALA_DINAS}</span>
        </p>

        <h1
          className="animate-fade-in-up text-3xl font-bold leading-tight tracking-tight drop-shadow-sm sm:text-5xl lg:text-6xl"
          style={{ animationDelay: "100ms" }}
        >
          Monitoring <span className="text-sky-300">Irigasi Perpompaan</span>
          <br className="hidden sm:block" /> (IRPOM) Kabupaten Way Kanan
        </h1>

        <p
          className="animate-fade-in-up mx-auto mt-5 max-w-2xl text-base text-sky-100 sm:text-lg"
          style={{ animationDelay: "220ms" }}
        >
          Pemanfaatan air irigasi pompa untuk meningkatkan luas tanam dan produktivitas sawah petani Way Kanan.
        </p>

        <div className="animate-fade-in-up mt-8 w-full sm:w-auto" style={{ animationDelay: "300ms" }}>
          <IrpomFilterBar opsi={opsi} tahun={tahun} sumber={sumber} />
        </div>

        <div
          className="animate-fade-in-up mt-5 grid w-full max-w-4xl grid-cols-2 gap-3 lg:grid-cols-4"
          style={{ animationDelay: "380ms" }}
        >
          <KpiCard
            icon={Ruler}
            value={formatHa(ringkasan.total_luas_ha)}
            satuan="Ha"
            label="Luas Lahan Terairi"
            catatan="Hanya unit berstatus Pemanfaatan"
          />
          <KpiCard icon={Droplets} value={formatAngka(ringkasan.total_unit)} satuan="unit" label="Unit Pompa" />
          <KpiCard icon={Users} value={formatAngka(ringkasan.jumlah_poktan)} label="Kelompok Tani" />
          <KpiCard
            icon={MapIcon}
            value={`${formatAngka(ringkasan.jumlah_kecamatan)} / ${formatAngka(ringkasan.jumlah_desa)}`}
            label="Kecamatan / Desa"
          />
        </div>

        <div
          className="animate-fade-in-up mt-4 flex flex-wrap justify-center gap-2 text-xs sm:text-sm"
          style={{ animationDelay: "460ms" }}
        >
          {STATUS_IRPOM.map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur-md"
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: statusStyle(status).color }} />
              {status}
              <span className="font-bold">{formatAngka(unitPerStatus.get(status) ?? 0)}</span>
            </span>
          ))}
          {unitStatusKosong > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur-md">
              <span className="size-2 rounded-full" style={{ backgroundColor: statusStyle(null).color }} />
              Belum diisi
              <span className="font-bold">{formatAngka(unitStatusKosong)}</span>
            </span>
          )}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-6 flex justify-center">
        <ChevronDown size={22} className="animate-bounce-slow text-white/60" />
      </div>
    </section>
  );
}
