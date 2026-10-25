import Link from "next/link";
import { AlertTriangle, ChevronRight, LocateFixed, Droplets, FileSpreadsheet, MapPinOff, MapPinned, Plus, Ruler, Upload, Users } from "lucide-react";
import { requirePengelolaPage } from "@/lib/auth-guard";
import { getMonitoringKoordinat, getSemuaIrpom } from "@/lib/admin-data";
import { BATAS_DUPLIKASI_M } from "@/lib/geo";
import { formatAngka, formatHa } from "@/lib/format";
import { STATUS_IRPOM, statusStyle } from "@/lib/status-irpom";
import { KOLOM_KELENGKAPAN } from "@/lib/kelengkapan";
import PageHeader from "@/components/admin/PageHeader";

function Kartu({ icon: Icon, label, value, satuan }: { icon: typeof Ruler; label: string; value: string; satuan?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <Icon size={18} className="text-sky-600" />
      <p className="mt-2 text-2xl font-bold text-gray-900">
        {value}
        {satuan && <span className="ml-1 text-sm font-medium text-gray-500">{satuan}</span>}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const profile = await requirePengelolaPage();
  const [semua, { duplikasi, diLuar }] = await Promise.all([getSemuaIrpom(), getMonitoringKoordinat()]);

  const totalUnit = semua.reduce((s, u) => s + u.volume, 0);
  const totalLuas = semua.reduce((s, u) => s + (u.luas_ha ?? 0), 0);
  const poktan = new Set(semua.filter((u) => u.kelompok_tani).map((u) => `${u.kelompok_tani!.trim().toLowerCase()}|${u.id_desa}`)).size;
  const unitPerStatus = new Map<string | null, number>();
  for (const u of semua) unitPerStatus.set(u.status, (unitPerStatus.get(u.status) ?? 0) + u.volume);
  const unitDuplikasi = duplikasi.reduce((s, g) => s + g.length, 0);
  const jumlahKecamatan = new Set(semua.map((u) => u.id_kecamatan)).size;
  const jumlahDesa = new Set(semua.map((u) => u.id_desa)).size;

  // Kelengkapan data: kolom yang kosong (data bermasalah dari impor).
  const kekurangan = KOLOM_KELENGKAPAN.map((k) => ({
    key: k.key,
    label: k.key === "koordinat" ? "Belum ada koordinat" : `${k.label} belum diisi`,
    jumlah: semua.filter((u) => k.kosong(u)).length,
    href: `/admin/kelengkapan?kolom=${k.key}`,
  }));

  return (
    <div>
      <PageHeader
        title={`Selamat datang, ${profile.nama || profile.email}`}
        description="Ringkasan data IRPOM Kabupaten Way Kanan."
        actions={
          <>
            <Link href="/admin/irpom/tambah" className="inline-flex items-center gap-1.5 rounded-md bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-800">
              <Plus size={15} /> Tambah Unit
            </Link>
            <Link href="/admin/irpom/impor" className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Upload size={15} /> Impor
            </Link>
          </>
        }
      />

      {(duplikasi.length > 0 || diLuar.length > 0) && (
        <Link
          href={duplikasi.length > 0 ? "/admin/koordinat" : "/admin/koordinat?tab=luar"}
          className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 hover:bg-red-100"
        >
          <LocateFixed size={18} className="mt-0.5 shrink-0 text-red-600" />
          <span>
            {duplikasi.length > 0 && (
              <>
                <span className="font-semibold">{formatAngka(duplikasi.length)} kasus duplikasi koordinat</span> ({formatAngka(unitDuplikasi)} unit
                berjarak ≤ {BATAS_DUPLIKASI_M} m)
              </>
            )}
            {duplikasi.length > 0 && diLuar.length > 0 && " · "}
            {diLuar.length > 0 && <span className="font-semibold">{formatAngka(diLuar.length)} unit di luar Way Kanan</span>}
            . Periksa dan perbaiki di menu Monitoring Koordinat →
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kartu icon={Ruler} label="Luas lahan terairi" value={formatHa(totalLuas)} satuan="Ha" />
        <Kartu icon={Droplets} label="Unit pompa" value={formatAngka(totalUnit)} satuan="unit" />
        <Kartu icon={Users} label="Kelompok tani" value={formatAngka(poktan)} />
        <Kartu icon={MapPinned} label="Kecamatan / Desa" value={`${formatAngka(jumlahKecamatan)} / ${formatAngka(jumlahDesa)}`} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="font-semibold text-gray-900">Unit per Status</p>
          <div className="mt-4 space-y-1">
            {[...STATUS_IRPOM, null].map((s) => {
              const jumlah = unitPerStatus.get(s) ?? 0;
              if (s === null && jumlah === 0) return null;
              const persen = totalUnit > 0 ? (jumlah / totalUnit) * 100 : 0;
              return (
                <Link
                  key={s ?? "kosong"}
                  href={s ? `/admin/irpom?status=${s}` : "/admin/kelengkapan?kolom=status"}
                  className="group block rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-gray-800">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: statusStyle(s).color }} />
                      {s ?? "Belum diisi"}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-xs tabular-nums text-gray-500">{persen.toFixed(persen > 0 && persen < 1 ? 1 : 0)}%</span>
                      <span className={`w-10 text-right font-semibold tabular-nums ${jumlah > 0 ? "text-gray-900" : "text-gray-400"}`}>{formatAngka(jumlah)}</span>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
                    </span>
                  </span>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <span className="block h-full rounded-full" style={{ width: `${persen}%`, backgroundColor: statusStyle(s).color }} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 font-semibold text-gray-900">
            <AlertTriangle size={16} className="text-amber-500" />
            Kelengkapan Data
          </p>
          <div className="mt-4 space-y-2">
            {kekurangan.map((k) => (
              <Link key={k.key} href={k.href} className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
                <span className="flex items-center gap-2 text-gray-700">
                  {k.key === "koordinat" ? <MapPinOff size={14} className="text-gray-400" /> : <FileSpreadsheet size={14} className="text-gray-400" />}
                  {k.label}
                </span>
                <span className="flex items-center gap-1">
                  <span className={`font-semibold tabular-nums ${k.jumlah > 0 ? "text-amber-700" : "text-gray-400"}`}>{formatAngka(k.jumlah)}</span>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
