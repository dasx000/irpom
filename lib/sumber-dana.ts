// Pilihan Sumber Dana yang baku. Dipakai form, validasi impor, dan template.
export const SUMBER_DANA = ["APBN", "APBD", "Lainnya"] as const;
export type SumberDana = (typeof SUMBER_DANA)[number];

// Cocokkan isian bebas (mis. dari Excel) ke pilihan baku, abaikan besar/kecil
// huruf & spasi. "APBD Provinsi", "APBD Kab." dsb. dianggap APBD.
export function cocokSumberDana(raw: string | null | undefined): SumberDana | null {
  const n = (raw ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (!n) return null;
  if (n.startsWith("apbd")) return "APBD";
  return SUMBER_DANA.find((s) => s.toLowerCase() === n) ?? null;
}
