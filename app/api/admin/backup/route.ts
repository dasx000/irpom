import { getSuperAdmin } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { getSemuaIrpom, keBarisEkspor } from "@/lib/admin-data";
import { buildBackup, type BarisAudit } from "@/lib/irpom-excel";
import { responsXlsx, tanggalHariIni } from "@/lib/unduh-xlsx";

// Cadangan data manual (Super Admin): seluruh data IRPOM (+ UUID) dan audit log.
export async function GET() {
  if (!(await getSuperAdmin())) return new Response("Tidak berwenang", { status: 403 });

  const supabase = await createClient();
  const [rows, { data: profiles }] = await Promise.all([
    getSemuaIrpom(),
    supabase.from("profiles").select("id, email, nama"),
  ]);
  const namaPengguna = new Map((profiles ?? []).map((p) => [p.id, p.nama ? `${p.nama} (${p.email})` : p.email]));

  const audit: BarisAudit[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("irpom_audit_log")
      .select("irpom_id, aksi, data_lama, data_baru, user_id, created_at")
      .order("created_at")
      .range(from, from + 999);
    if (error || !data) break;
    audit.push(
      ...data.map((a) => ({
        waktu: new Date(a.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
        pengguna: a.user_id ? (namaPengguna.get(a.user_id) ?? a.user_id) : "Sistem",
        aksi: a.aksi,
        irpom_id: a.irpom_id,
        data_lama: a.data_lama,
        data_baru: a.data_baru,
      }))
    );
    if (data.length < 1000) break;
  }

  const waktu = (iso: string) => new Date(iso).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  const ekspor = keBarisEkspor(rows);
  const buffer = await buildBackup(
    rows.map((r, i) => ({ ...ekspor[i], id: r.id, created_at: waktu(r.created_at), updated_at: waktu(r.updated_at) })),
    audit
  );
  return responsXlsx(buffer, `cadangan-irpom-${tanggalHariIni()}.xlsx`);
}
