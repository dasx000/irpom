"use client";

import { useActionState, useState, useTransition } from "react";
import { CheckCircle2, Pencil, Plus, Power, X } from "lucide-react";
import { useConfirmDialog } from "@/components/ConfirmDialog";
import PasswordInput from "@/components/PasswordInput";
import PendingOverlay from "@/components/PendingOverlay";
import { setAktifPengguna, tambahPengguna, ubahPengguna, type PenggunaActionState } from "@/lib/actions/pengguna";
import { formatTanggalWaktu } from "@/lib/format";

export interface Pengguna {
  id: string;
  email: string;
  nama: string | null;
  role: "super_admin" | "admin";
  aktif: boolean;
  created_at: string;
}

const ROLE_LABEL = { super_admin: "Super Admin", admin: "Admin" } as const;

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

function FormTambah({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState<PenggunaActionState, FormData>(tambahPengguna, { error: null });

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Tambah Akun</p>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Tutup">
          <X size={16} />
        </button>
      </div>
      {state.success ? (
        <div className="flex flex-wrap items-center gap-3 text-sm text-green-800">
          <CheckCircle2 size={16} /> Akun berhasil dibuat dan langsung bisa dipakai login.
          <button type="button" onClick={onClose} className="font-medium underline">
            Tutup
          </button>
        </div>
      ) : (
        <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Nama</label>
            <input name="nama" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Email *</label>
            <input name="email" type="email" required className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Kata Sandi Awal *</label>
            <PasswordInput name="password" required minLength={6} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Role *</label>
            <select name="role" defaultValue="admin" className={inputClass}>
              <option value="admin">Admin — kelola data IRPOM</option>
              <option value="super_admin">Super Admin — + kelola akun, audit log, cadangan</option>
            </select>
          </div>
          {state.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={isPending} className="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-50">
              {isPending ? "Membuat akun..." : "Buat Akun"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function FormUbah({ pengguna, onClose }: { pengguna: Pengguna; onClose: () => void }) {
  const action = ubahPengguna.bind(null, pengguna.id);
  const [state, formAction, isPending] = useActionState<PenggunaActionState, FormData>(action, { error: null });

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-xl bg-white p-5 shadow-xl sm:rounded-xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Ubah Akun: {pengguna.email}</p>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Tutup">
            <X size={16} />
          </button>
        </div>
        {state.success ? (
          <div className="flex items-center gap-2 text-sm text-green-800">
            <CheckCircle2 size={16} /> Perubahan tersimpan.
            <button type="button" onClick={onClose} className="ml-auto font-medium underline">
              Tutup
            </button>
          </div>
        ) : (
          <form action={formAction} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Nama</label>
              <input name="nama" defaultValue={pengguna.nama ?? ""} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Role</label>
              <select name="role" defaultValue={pengguna.role} className={inputClass}>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Reset Kata Sandi</label>
              <PasswordInput name="password" minLength={6} placeholder="Kosongkan jika tidak direset" className={inputClass} />
            </div>
            {state.error && <p className="text-sm text-red-600">{state.error}</p>}
            <button type="submit" disabled={isPending} className="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-50">
              {isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function PenggunaManager({ users, currentUserId }: { users: Pengguna[]; currentUserId: string }) {
  const [tambahOpen, setTambahOpen] = useState(false);
  const [diubah, setDiubah] = useState<Pengguna | null>(null);
  const [isPending, startTransition] = useTransition();
  const { confirm, alert, dialog } = useConfirmDialog();

  async function toggleAktif(u: Pengguna) {
    const ok = await confirm(
      u.aktif
        ? `Nonaktifkan akun ${u.email}? Akun akan diblokir: sesi yang sedang login terputus dan tidak bisa login lagi sampai diaktifkan kembali.`
        : `Aktifkan kembali akun ${u.email}?`,
      { title: u.aktif ? "Nonaktifkan akun" : "Aktifkan akun", confirmLabel: u.aktif ? "Ya, nonaktifkan" : "Ya, aktifkan", danger: u.aktif }
    );
    if (!ok) return;
    startTransition(async () => {
      const { error } = await setAktifPengguna(u.id, !u.aktif);
      if (error) await alert(error, { title: "Gagal" });
    });
  }

  return (
    <div className="space-y-4">
      {!tambahOpen ? (
        <button
          type="button"
          onClick={() => setTambahOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-800"
        >
          <Plus size={15} /> Tambah Akun
        </button>
      ) : (
        <FormTambah onClose={() => setTambahOpen(false)} />
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-2.5 font-medium">Nama / Email</th>
              <th className="px-3 py-2.5 font-medium">Role</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Dibuat</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className={u.aktif ? "" : "bg-gray-50 text-gray-400"}>
                <td className="px-4 py-2.5">
                  <p className={`font-medium ${u.aktif ? "text-gray-900" : ""}`}>
                    {u.nama ?? "-"}
                    {u.id === currentUserId && <span className="ml-1.5 text-xs font-normal text-sky-700">(Anda)</span>}
                  </p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.role === "super_admin" ? "bg-purple-100 text-purple-800" : "bg-sky-100 text-sky-800"}`}
                  >
                    {ROLE_LABEL[u.role]}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.aktif ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>
                    {u.aktif ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-500">{formatTanggalWaktu(u.created_at)}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setDiubah(u)}
                      className="rounded-md p-1.5 text-gray-500 hover:bg-sky-50 hover:text-sky-700"
                      title="Ubah / reset sandi"
                      aria-label={`Ubah ${u.email}`}
                    >
                      <Pencil size={15} />
                    </button>
                    {u.id !== currentUserId && (
                      <button
                        type="button"
                        onClick={() => toggleAktif(u)}
                        className={`rounded-md p-1.5 ${u.aktif ? "text-gray-500 hover:bg-red-50 hover:text-red-700" : "text-green-700 hover:bg-green-50"}`}
                        title={u.aktif ? "Nonaktifkan" : "Aktifkan"}
                        aria-label={`${u.aktif ? "Nonaktifkan" : "Aktifkan"} ${u.email}`}
                      >
                        <Power size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {diubah && <FormUbah key={diubah.id} pengguna={diubah} onClose={() => setDiubah(null)} />}
      <PendingOverlay show={isPending} />
      {dialog}
    </div>
  );
}
