"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, UploadCloud, XCircle } from "lucide-react";
import { pratinjauImpor, simpanImpor, type PratinjauState, type SimpanImporResult } from "@/lib/actions/irpom";
import { formatAngka, formatHa } from "@/lib/format";
import { statusLabel } from "@/lib/status-irpom";
import type { TingkatValidasi } from "@/lib/validasi-irpom-types";

const TINGKAT_STYLE: Record<TingkatValidasi, { label: string; badge: string; icon: typeof CheckCircle2 }> = {
  valid: { label: "Valid", badge: "bg-green-100 text-green-800", icon: CheckCircle2 },
  peringatan: { label: "Peringatan", badge: "bg-amber-100 text-amber-900", icon: AlertTriangle },
  ditolak: { label: "Ditolak", badge: "bg-red-100 text-red-800", icon: XCircle },
};

type Tab = "semua" | TingkatValidasi;

const STATE_AWAL: PratinjauState = { error: null };

export default function ImporIrpom() {
  const [state, formAction, isPending] = useActionState<PratinjauState, FormData>(pratinjauImpor, STATE_AWAL);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-sm font-semibold text-gray-900">1. Unggah file</p>
        <p className="mt-1 text-sm text-gray-500">
          Format .xlsx atau .csv dengan kolom seperti template (sama dengan <span className="font-mono">DATA IRPOM.csv</span>). Impor selalu
          menambah data baru.
        </p>
        <a
          href="/api/admin/irpom/template"
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download size={15} /> Unduh Template
        </a>

        <form action={formAction} className="mt-4 flex flex-wrap items-center gap-3">
          <input
            name="file"
            type="file"
            accept=".xlsx,.csv"
            required
            className="block min-w-0 flex-1 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-50"
          >
            {isPending ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
            {isPending ? "Memeriksa..." : "Periksa File"}
          </button>
        </form>
        {state.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}
      </div>

      {/* key per hasil pemeriksaan: pilihan & hasil simpan otomatis reset saat file baru diperiksa. */}
      {state.baris && state.baris.length > 0 && <Pratinjau key={state.id} state={state} />}
    </div>
  );
}

function Pratinjau({ state }: { state: PratinjauState }) {
  const [tab, setTab] = useState<Tab>("semua");
  // Baris peringatan yang DIKECUALIKAN admin (default: semua ikut disimpan).
  const [dikecualikan, setDikecualikan] = useState<Set<number>>(new Set());
  const [hasilSimpan, setHasilSimpan] = useState<SimpanImporResult | null>(null);
  const [isSaving, startSaving] = useTransition();

  const baris = useMemo(() => state.baris ?? [], [state.baris]);
  const jumlah = {
    valid: baris.filter((b) => b.tingkat === "valid").length,
    peringatan: baris.filter((b) => b.tingkat === "peringatan").length,
    ditolak: baris.filter((b) => b.tingkat === "ditolak").length,
  };
  const akanDisimpan = baris.filter((b) => b.tingkat === "valid" || (b.tingkat === "peringatan" && !dikecualikan.has(b.baris)));
  const tampil = tab === "semua" ? baris : baris.filter((b) => b.tingkat === tab);
  const sudahDisimpan = !!hasilSimpan && !hasilSimpan.error;

  function toggle(nomor: number) {
    setDikecualikan((prev) => {
      const next = new Set(prev);
      if (next.has(nomor)) next.delete(nomor);
      else next.add(nomor);
      return next;
    });
  }

  function simpan() {
    startSaving(async () => {
      setHasilSimpan(await simpanImpor(akanDisimpan.map((b) => b.mentah)));
    });
  }

  return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">2. Pratinjau — belum ada data yang disimpan</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                <FileSpreadsheet size={14} /> {state.namaFile} · {formatAngka(baris.length)} baris
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {(["valid", "peringatan", "ditolak"] as const).map((t) => {
                const S = TINGKAT_STYLE[t];
                return (
                  <span key={t} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${S.badge}`}>
                    <S.icon size={14} /> {formatAngka(jumlah[t])} {S.label.toLowerCase()}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex gap-1 overflow-x-auto border-b border-gray-200 text-sm">
            {(["semua", "valid", "peringatan", "ditolak"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`shrink-0 border-b-2 px-3 py-2 font-medium ${tab === t ? "border-sky-600 text-sky-800" : "border-transparent text-gray-500 hover:text-gray-800"}`}
              >
                {t === "semua" ? "Semua" : TINGKAT_STYLE[t].label} ({formatAngka(t === "semua" ? baris.length : jumlah[t])})
              </button>
            ))}
          </div>

          <div className="mt-2 max-h-[520px] overflow-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="w-10 px-2 py-2 font-medium">Simpan</th>
                  <th className="w-14 px-2 py-2 font-medium">Baris</th>
                  <th className="px-2 py-2 font-medium">Kelompok Tani</th>
                  <th className="px-2 py-2 font-medium">Desa / Kecamatan</th>
                  <th className="px-2 py-2 text-right font-medium">Luas</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Hasil Pemeriksaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tampil.map((b) => {
                  const S = TINGKAT_STYLE[b.tingkat];
                  return (
                    <tr key={b.baris} className={b.tingkat === "ditolak" ? "bg-red-50/40" : b.tingkat === "peringatan" ? "bg-amber-50/30" : ""}>
                      <td className="px-2 py-2 align-top">
                        <input
                          type="checkbox"
                          aria-label={`Simpan baris ${b.baris}`}
                          checked={b.tingkat === "valid" || (b.tingkat === "peringatan" && !dikecualikan.has(b.baris))}
                          disabled={b.tingkat !== "peringatan" || sudahDisimpan}
                          onChange={() => toggle(b.baris)}
                          className="size-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 disabled:opacity-40"
                        />
                      </td>
                      <td className="px-2 py-2 align-top tabular-nums text-gray-500">{b.baris}</td>
                      <td className="px-2 py-2 align-top font-medium text-gray-900">{b.mentah.kelompok_tani || "-"}</td>
                      <td className="px-2 py-2 align-top text-gray-700">
                        {b.desa ?? b.mentah.desa ?? "-"}
                        <p className="text-xs text-gray-500">{b.kecamatan ?? b.mentah.kecamatan ?? "-"}</p>
                      </td>
                      <td className="px-2 py-2 text-right align-top tabular-nums">{b.data?.luas_ha != null ? formatHa(b.data.luas_ha) : "-"}</td>
                      <td className="px-2 py-2 align-top text-gray-700">{b.data ? statusLabel(b.data.status) : (b.mentah.status ?? "-")}</td>
                      <td className="px-2 py-2 align-top">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${S.badge}`}>
                          <S.icon size={12} /> {S.label}
                        </span>
                        {b.pesan.length > 0 && (
                          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-gray-600">
                            {b.pesan.map((p) => (
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

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
            {!sudahDisimpan ? (
              <>
                <button
                  type="button"
                  onClick={simpan}
                  disabled={isSaving || akanDisimpan.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-50"
                >
                  {isSaving && <Loader2 size={15} className="animate-spin" />}
                  Simpan {formatAngka(akanDisimpan.length)} baris
                </button>
                <p className="text-sm text-gray-500">
                  Baris ditolak ({formatAngka(jumlah.ditolak)}) selalu dilewati
                  {dikecualikan.size > 0 && `, ${formatAngka(dikecualikan.size)} baris peringatan dikecualikan`}. Untuk membatalkan, perbaiki
                  file lalu periksa ulang.
                </p>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-3 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
                <CheckCircle2 size={16} />
                <span>
                  {formatAngka(hasilSimpan.tersimpan ?? 0)} baris tersimpan, {formatAngka(hasilSimpan.dilewati ?? 0)} dilewati. Tercatat di Audit Log.
                </span>
                <Link href="/admin/irpom" className="font-medium underline">
                  Lihat Data IRPOM
                </Link>
              </div>
            )}
            {hasilSimpan?.error && <p className="w-full text-sm text-red-600">{hasilSimpan.error}</p>}
          </div>
        </div>
  );
}
