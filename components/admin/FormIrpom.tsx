"use client";

import { startTransition, useActionState, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AlertTriangle, ClipboardList, MapPin, StickyNote, Users } from "lucide-react";
import { simpanIrpom, type IrpomFormState } from "@/lib/actions/irpom";
import { parseCoordinateInput } from "@/lib/parse-coordinate";
import { STATUS_IRPOM } from "@/lib/status-irpom";
import { SUMBER_DANA } from "@/lib/sumber-dana";
import type { WilayahOption } from "@/lib/admin-data";

const PetaLokasiPicker = dynamic(() => import("@/components/PetaLokasiPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[260px] items-center justify-center rounded-md border border-gray-300 text-sm text-gray-400">Memuat peta...</div>
  ),
});

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

function Field({ label, wajib = false, hint, children }: { label: string; wajib?: boolean; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {wajib && <span className="text-red-600"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-2 text-gray-800">
        {icon}
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export interface IrpomInitialData {
  id_desa: number;
  id_kecamatan: string;
  kelompok_tani: string | null;
  ketua_poktan: string | null;
  volume: number;
  luas_ha: number | null;
  tahun_anggaran: number | null;
  sumber_dana: string | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
  keterangan: string | null;
}


// Angka tunggal: koma desimal diubah ke titik, spasi dibuang.
function normalisasiAngka(s: string): string {
  return s.trim().replace(/\s/g, "").replace(",", ".");
}

export default function FormIrpom({
  id,
  wilayah,
  initialData,
}: {
  id: string | null;
  wilayah: WilayahOption;
  initialData?: IrpomInitialData;
}) {
  const action = simpanIrpom.bind(null, id);
  const [state, formAction, isPending] = useActionState<IrpomFormState, FormData>(action, { error: null });
  const formRef = useRef<HTMLFormElement>(null);
  const konfirmasiRef = useRef<HTMLInputElement>(null);

  const [idKecamatan, setIdKecamatan] = useState(initialData?.id_kecamatan ?? "");
  const [idDesa, setIdDesa] = useState(initialData ? String(initialData.id_desa) : "");
  const desaOptions = wilayah.desaList.filter((d) => d.id_kecamatan === idKecamatan);
  const kecamatanNama = wilayah.kecamatanList.find((k) => k.id_kecamatan === idKecamatan)?.nama_kecamatan ?? null;
  const desaNama = desaOptions.find((d) => String(d.id_desa) === idDesa)?.nama_desa ?? null;

  const [latText, setLatText] = useState(initialData?.latitude != null ? String(initialData.latitude) : "");
  const [lngText, setLngText] = useState(initialData?.longitude != null ? String(initialData.longitude) : "");
  const latNum = Number(normalisasiAngka(latText));
  const lngNum = Number(normalisasiAngka(lngText));
  const posisiValid = latText.trim() !== "" && lngText.trim() !== "" && Number.isFinite(latNum) && Number.isFinite(lngNum);

  // Tempel koordinat gabungan dari Google Maps ("-4.33, 104.66") ke salah
  // satu kolom -> otomatis dipecah ke Latitude & Longitude.
  function onKoordinatChange(kolom: "lat" | "lng", value: string) {
    const gabungan = /[,;\s]/.test(value.trim()) ? parseCoordinateInput(value) : null;
    if (gabungan) {
      setLatText(String(gabungan.lat));
      setLngText(String(gabungan.lng));
      return;
    }
    if (kolom === "lat") setLatText(value);
    else setLngText(value);
  }

  function onPetaPilih(lat: number, lng: number) {
    setLatText(lat.toFixed(7));
    setLngText(lng.toFixed(7));
  }

  return (
    <form
      ref={formRef}
      // Dikirim lewat onSubmit (bukan prop action) supaya React tidak
      // mengosongkan isian saat server mengembalikan peringatan.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      onChange={() => {
        // Isian berubah setelah peringatan muncul -> perlu dicek ulang dulu.
        if (konfirmasiRef.current) konfirmasiRef.current.value = "";
      }}
      className="max-w-3xl space-y-4"
    >
      <input ref={konfirmasiRef} type="hidden" name="konfirmasi" defaultValue="" />

      <Section icon={<Users size={16} />} title="Kelompok Tani & Wilayah">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Kecamatan" wajib>
            <select
              value={idKecamatan}
              onChange={(e) => {
                setIdKecamatan(e.target.value);
                setIdDesa("");
              }}
              required
              className={inputClass}
            >
              <option value="" disabled>
                Pilih kecamatan
              </option>
              {wilayah.kecamatanList.map((k) => (
                <option key={k.id_kecamatan} value={k.id_kecamatan}>
                  {k.nama_kecamatan}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Desa / Kampung" wajib>
            <select name="id_desa" value={idDesa} onChange={(e) => setIdDesa(e.target.value)} required disabled={!idKecamatan} className={inputClass}>
              <option value="" disabled>
                {idKecamatan ? "Pilih desa" : "Pilih kecamatan dulu"}
              </option>
              {desaOptions.map((d) => (
                <option key={d.id_desa} value={d.id_desa}>
                  {d.nama_desa}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Kelompok Tani" wajib>
            <input name="kelompok_tani" required defaultValue={initialData?.kelompok_tani ?? ""} className={inputClass} />
          </Field>
          <Field label="Ketua Poktan">
            <input name="ketua_poktan" defaultValue={initialData?.ketua_poktan ?? ""} className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section icon={<ClipboardList size={16} />} title="Data Unit">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Status">
            <select name="status" defaultValue={initialData ? (initialData.status ?? "") : "Pemberkasan"} className={inputClass}>
              {initialData && !initialData.status && <option value="">Belum diisi</option>}
              {STATUS_IRPOM.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Luas Lahan Terairi (Ha)" hint="Boleh koma atau titik desimal.">
            <input name="luas_ha" inputMode="decimal" defaultValue={initialData?.luas_ha != null ? String(initialData.luas_ha).replace(".", ",") : ""} className={inputClass} />
          </Field>
          <Field label="Volume (unit)">
            <input name="volume" type="number" min={1} step={1} defaultValue={initialData?.volume ?? 1} className={inputClass} />
          </Field>
          <Field label="Tahun Anggaran">
            <input
              name="tahun_anggaran"
              type="number"
              min={1990}
              max={2100}
              defaultValue={initialData ? (initialData.tahun_anggaran ?? "") : new Date().getFullYear()}
              className={inputClass}
            />
          </Field>
          <Field label="Sumber Dana">
            <select name="sumber_dana" defaultValue={initialData ? (initialData.sumber_dana ?? "") : "APBN"} className={inputClass}>
              {initialData && !initialData.sumber_dana && <option value="">Belum diisi</option>}
              {/* Nilai lama di luar pilihan baku tetap ditampilkan agar tidak hilang diam-diam. */}
              {initialData?.sumber_dana && !(SUMBER_DANA as readonly string[]).includes(initialData.sumber_dana) && (
                <option value={initialData.sumber_dana}>{initialData.sumber_dana}</option>
              )}
              {SUMBER_DANA.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section icon={<MapPin size={16} />} title="Lokasi Titik Pompa">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Latitude (Y)">
            <input
              name="latitude"
              inputMode="decimal"
              value={latText}
              onChange={(e) => onKoordinatChange("lat", e.target.value)}
              onBlur={() => setLatText((v) => normalisasiAngka(v))}
              placeholder="-4.334236"
              className={`${inputClass} font-mono`}
            />
          </Field>
          <Field label="Longitude (X)">
            <input
              name="longitude"
              inputMode="decimal"
              value={lngText}
              onChange={(e) => onKoordinatChange("lng", e.target.value)}
              onBlur={() => setLngText((v) => normalisasiAngka(v))}
              placeholder="104.662797"
              className={`${inputClass} font-mono`}
            />
          </Field>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Tempel koordinat dari Google Maps (mis. <span className="font-mono">-4.334236, 104.662797</span>) ke salah satu kolom — otomatis
          dipecah. Atau klik peta / geser pin bila posisi meleset.
        </p>
        <div className="mt-3">
          <PetaLokasiPicker
            latitude={posisiValid ? latNum : null}
            longitude={posisiValid ? lngNum : null}
            kecamatanNama={kecamatanNama}
            desaNama={desaNama}
            onChange={onPetaPilih}
          />
        </div>
      </Section>

      <Section icon={<StickyNote size={16} />} title="Keterangan">
        <textarea name="keterangan" rows={3} defaultValue={initialData?.keterangan ?? ""} placeholder="Catatan lapangan (tidak tampil di halaman publik)" className={inputClass} />
      </Section>

      {state.peringatan && state.peringatan.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={16} /> Periksa sebelum menyimpan
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {state.peringatan.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs">Kolom yang tidak valid akan disimpan kosong. Perbaiki isian di atas, atau tetap simpan.</p>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (konfirmasiRef.current) konfirmasiRef.current.value = "1";
              formRef.current?.requestSubmit();
            }}
            className="mt-3 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            Tetap Simpan
          </button>
        </div>
      )}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending} className="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-50">
          {isPending ? "Menyimpan..." : id ? "Simpan Perubahan" : "Simpan Unit"}
        </button>
        <Link href="/admin/irpom" className="text-sm font-medium text-gray-500 hover:text-gray-800">
          Batal
        </Link>
      </div>
    </form>
  );
}
