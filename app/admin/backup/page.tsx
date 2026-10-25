import { DatabaseBackup, Download } from "lucide-react";
import { requireSuperAdminPage } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { formatAngka } from "@/lib/format";
import PageHeader from "@/components/admin/PageHeader";

export default async function BackupPage() {
  await requireSuperAdminPage();
  const supabase = await createClient();
  const [{ count: jumlahUnit }, { count: jumlahAudit }] = await Promise.all([
    supabase.from("irpom").select("id", { count: "exact", head: true }),
    supabase.from("irpom_audit_log").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div>
      <PageHeader title="Cadangan Data" description="Unduh salinan seluruh data secara manual sebagai arsip." />

      <div className="max-w-2xl rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
            <DatabaseBackup size={20} />
          </span>
          <div>
            <p className="font-semibold text-gray-900">Unduh cadangan lengkap (.xlsx)</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
              <li>
                Sheet <span className="font-medium">IRPOM</span> — {formatAngka(jumlahUnit ?? 0)} unit, semua kolom termasuk ID (UUID) dan waktu
                dibuat/diubah.
              </li>
              <li>
                Sheet <span className="font-medium">Audit Log</span> — {formatAngka(jumlahAudit ?? 0)} catatan riwayat perubahan.
              </li>
            </ul>
            <p className="mt-2 text-xs text-gray-500">
              Simpan file ini di tempat aman (mis. Google Drive dinas). Cadangan dibuat manual; tidak ada fitur pulihkan otomatis.
            </p>
            <a
              href="/api/admin/backup"
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800"
            >
              <Download size={15} /> Unduh Cadangan
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
