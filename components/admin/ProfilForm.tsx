"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import { updateProfilSendiri, type ProfilActionState } from "@/lib/actions/profil";
import type { CurrentProfile } from "@/lib/get-current-profile";

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

const ROLE_LABEL = { super_admin: "Super Admin", admin: "Admin" } as const;

export default function ProfilForm({ profile }: { profile: CurrentProfile }) {
  const [state, formAction, isPending] = useActionState<ProfilActionState, FormData>(updateProfilSendiri, { error: null });
  const showSuccess = state.success === true && !isPending;

  return (
    <div className="max-w-lg rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5 grid grid-cols-2 gap-3 border-b border-gray-100 pb-5">
        <div>
          <p className="text-xs font-medium text-gray-500">Email</p>
          <p className="text-sm break-all text-gray-900">{profile.email}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Role</p>
          <p className="text-sm text-gray-900">{ROLE_LABEL[profile.role]}</p>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Nama</label>
          <input name="nama" defaultValue={profile.nama ?? ""} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Kata Sandi Baru</label>
          <PasswordInput name="password" minLength={6} placeholder="Kosongkan jika tidak diubah" className={inputClass} />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={isPending} className="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-50">
            {isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
          {showSuccess && (
            <span className="flex items-center gap-1.5 text-sm text-green-700">
              <CheckCircle2 size={15} /> Tersimpan.
            </span>
          )}
        </div>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </form>
    </div>
  );
}
