import Link from "next/link";
import { requireSuperAdminPage } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { getWilayah } from "@/lib/admin-data";
import { formatTanggalWaktu } from "@/lib/format";
import PageHeader from "@/components/admin/PageHeader";
import Pagination from "@/components/admin/Pagination";

const UKURAN = 50;

// Label kolom irpom untuk ringkasan perubahan.
const LABEL_KOLOM: Record<string, string> = {
  id_desa: "Desa",
  kelompok_tani: "Kelompok Tani",
  ketua_poktan: "Ketua Poktan",
  volume: "Volume",
  luas_ha: "Luas (Ha)",
  tahun_anggaran: "Tahun Anggaran",
  sumber_dana: "Sumber Dana",
  status: "Status",
  latitude: "Latitude",
  longitude: "Longitude",
  keterangan: "Keterangan",
};

const AKSI_STYLE: Record<string, { label: string; badge: string }> = {
  insert: { label: "Tambah", badge: "bg-green-100 text-green-800" },
  update: { label: "Ubah", badge: "bg-sky-100 text-sky-800" },
  delete: { label: "Hapus", badge: "bg-red-100 text-red-800" },
};

type DataUnit = Record<string, unknown> | null;

interface BarisAudit {
  id: number;
  irpom_id: string;
  aksi: string;
  data_lama: DataUnit;
  data_baru: DataUnit;
  user_id: string | null;
  created_at: string;
}

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function AuditPage(props: PageProps<"/admin/audit">) {
  await requireSuperAdminPage();
  const sp = await props.searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const pengguna = str(sp.pengguna);
  const aksi = str(sp.aksi);
  const dari = str(sp.dari);
  const sampai = str(sp.sampai);
  const unit = str(sp.unit);

  const supabase = await createClient();
  let query = supabase
    .from("irpom_audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * UKURAN, page * UKURAN - 1);
  if (pengguna) query = query.eq("user_id", pengguna);
  if (aksi) query = query.eq("aksi", aksi);
  if (unit) query = query.eq("irpom_id", unit);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dari)) query = query.gte("created_at", `${dari}T00:00:00+07:00`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(sampai)) query = query.lte("created_at", `${sampai}T23:59:59+07:00`);

  const [{ data, count }, { data: profiles }, wilayah] = await Promise.all([
    query,
    supabase.from("profiles").select("id, email, nama").order("email"),
    getWilayah(),
  ]);
  const rows = (data as BarisAudit[] | null) ?? [];
  const namaPengguna = new Map((profiles ?? []).map((p) => [p.id, p.nama ?? p.email]));
  const namaDesa = new Map(wilayah.desaList.map((d) => [d.id_desa, d.nama_desa]));

  const tampilNilai = (kolom: string, v: unknown) => {
    if (v == null || v === "") return "(kosong)";
    if (kolom === "id_desa") return namaDesa.get(Number(v)) ?? String(v);
    return String(v);
  };

  function ringkasan(r: BarisAudit) {
    const data = r.data_baru ?? r.data_lama ?? {};
    const judul = `${(data.kelompok_tani as string) ?? "-"} · Desa ${namaDesa.get(Number(data.id_desa)) ?? "-"}`;
    if (r.aksi !== "update" || !r.data_lama || !r.data_baru) return { judul, perubahan: [] as string[] };
    const perubahan = Object.keys(LABEL_KOLOM)
      .filter((k) => JSON.stringify(r.data_lama![k]) !== JSON.stringify(r.data_baru![k]))
      .map((k) => `${LABEL_KOLOM[k]}: ${tampilNilai(k, r.data_lama![k])} → ${tampilNilai(k, r.data_baru![k])}`);
    return { judul, perubahan };
  }

  const inputClass = "rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

  return (
    <div>
      <PageHeader title="Audit Log" description="Riwayat semua penambahan, perubahan, dan penghapusan data IRPOM (dicatat otomatis oleh database)." />

      <form method="get" className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:flex sm:flex-wrap sm:items-end">
        <select name="pengguna" defaultValue={pengguna} aria-label="Pengguna" className={inputClass}>
          <option value="">Semua pengguna</option>
          {(profiles ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama ?? p.email}
            </option>
          ))}
        </select>
        <select name="aksi" defaultValue={aksi} aria-label="Aksi" className={inputClass}>
          <option value="">Semua aksi</option>
          <option value="insert">Tambah</option>
          <option value="update">Ubah</option>
          <option value="delete">Hapus</option>
        </select>
        <label className="flex flex-col text-xs text-gray-500">
          Dari
          <input type="date" name="dari" defaultValue={dari} className={inputClass} />
        </label>
        <label className="flex flex-col text-xs text-gray-500">
          Sampai
          <input type="date" name="sampai" defaultValue={sampai} className={inputClass} />
        </label>
        {unit && <input type="hidden" name="unit" value={unit} />}
        <button type="submit" className="rounded-md bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-800">
          Terapkan
        </button>
        {(pengguna || aksi || dari || sampai || unit) && (
          <Link href="/admin/audit" className="px-2 py-2 text-sm font-medium text-gray-500 hover:text-red-600">
            Reset
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-2.5 font-medium">Waktu</th>
              <th className="px-3 py-2.5 font-medium">Pengguna</th>
              <th className="px-3 py-2.5 font-medium">Aksi</th>
              <th className="px-3 py-2.5 font-medium">Unit & Perubahan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                  Belum ada riwayat yang cocok.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const { judul, perubahan } = ringkasan(r);
              const S = AKSI_STYLE[r.aksi] ?? { label: r.aksi, badge: "bg-gray-100 text-gray-700" };
              return (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-2.5 text-xs whitespace-nowrap text-gray-600">{formatTanggalWaktu(r.created_at)}</td>
                  <td className="px-3 py-2.5 text-gray-800">{r.user_id ? (namaPengguna.get(r.user_id) ?? "Akun terhapus") : "Sistem"}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${S.badge}`}>{S.label}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/audit?unit=${r.irpom_id}`} className="font-medium text-gray-900 hover:text-sky-700 hover:underline" title="Lihat riwayat unit ini">
                      {judul}
                    </Link>
                    {perubahan.length > 0 && (
                      <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
                        {perubahan.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3">
        <Pagination basePath="/admin/audit" searchParams={sp} page={page} size={UKURAN} total={count ?? 0} />
      </div>
    </div>
  );
}
