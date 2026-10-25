"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useConfirmDialog } from "@/components/ConfirmDialog";
import PendingOverlay from "@/components/PendingOverlay";
import { hapusIrpom, ubahStatusIrpom } from "@/lib/actions/irpom";
import { STATUS_IRPOM, statusStyle } from "@/lib/status-irpom";

// Ubah status langsung dari tabel (pilihan dropdown berwarna status).
export function StatusSelect({ id, status }: { id: string; status: string | null }) {
  const [value, setValue] = useState(status ?? "");
  const [isPending, startTransition] = useTransition();
  const { alert, dialog } = useConfirmDialog();

  function onChange(next: string) {
    const prev = value;
    setValue(next);
    startTransition(async () => {
      const { error } = await ubahStatusIrpom(id, next);
      if (error) {
        setValue(prev);
        await alert(error, { title: "Gagal mengubah status" });
      }
    });
  }

  return (
    <>
      <select
        aria-label="Ubah status"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isPending}
        className={`rounded-full border-0 py-1 pr-7 pl-2.5 text-xs font-medium focus:ring-2 focus:ring-sky-300 disabled:opacity-60 ${statusStyle(value || null).badge}`}
      >
        {!value && <option value="">Belum diisi</option>}
        {STATUS_IRPOM.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {dialog}
    </>
  );
}

export function UbahHapusButtons({ id, label }: { id: string; label: string }) {
  const [isPending, startTransition] = useTransition();
  const { confirm, alert, dialog } = useConfirmDialog();

  async function onHapus() {
    const ok = await confirm(`Hapus unit "${label}"? Data yang dihapus tetap tercatat di Audit Log.`, {
      title: "Hapus unit IRPOM",
      confirmLabel: "Ya, hapus",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const { error } = await hapusIrpom(id);
      if (error) await alert(error, { title: "Gagal menghapus" });
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/admin/irpom/${id}/ubah`}
        className="rounded-md p-1.5 text-gray-500 hover:bg-sky-50 hover:text-sky-700"
        title="Ubah"
        aria-label={`Ubah ${label}`}
      >
        <Pencil size={15} />
      </Link>
      <button
        type="button"
        onClick={onHapus}
        className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-700"
        title="Hapus"
        aria-label={`Hapus ${label}`}
      >
        <Trash2 size={15} />
      </button>
      <PendingOverlay show={isPending} label="Menghapus..." />
      {dialog}
    </div>
  );
}
