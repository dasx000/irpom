// 4 status siklus & operasional unit IRPOM (lihat PLAN.md bagian 3). Urutan
// array = urutan siklus, dipakai juga untuk urutan legenda & grafik. Status
// kosong (data bermasalah saat impor) tampil sebagai "Belum diisi".
// Di peta status dibedakan lewat warna marker; di tempat lain selalu disertai
// label teks. Kuning pakai yellow-600 supaya kontras di latar putih.

export const STATUS_IRPOM = ["Pemberkasan", "Pembangunan", "Pemanfaatan", "Rusak"] as const;
export type StatusIrpom = (typeof STATUS_IRPOM)[number];

export const STATUS_KOSONG_LABEL = "Belum diisi";

interface StatusStyle {
  // Warna marker peta & grafik (hex, dipakai di SVG/Leaflet).
  color: string;
  // Kelas badge Tailwind.
  badge: string;
  keterangan: string;
}

export const STATUS_STYLES: Record<StatusIrpom, StatusStyle> = {
  Pemberkasan: { color: "#2563eb", badge: "bg-blue-100 text-blue-800", keterangan: "Administrasi / verifikasi CPCL" },
  Pembangunan: { color: "#ca8a04", badge: "bg-yellow-100 text-yellow-800", keterangan: "Konstruksi fisik / instalasi" },
  Pemanfaatan: { color: "#16a34a", badge: "bg-green-100 text-green-800", keterangan: "Beroperasi mengairi sawah" },
  Rusak: { color: "#dc2626", badge: "bg-red-100 text-red-800", keterangan: "Perlu perbaikan / pemeliharaan" },
};

const STATUS_KOSONG_STYLE: StatusStyle = {
  color: "#9ca3af",
  badge: "bg-gray-100 text-gray-700",
  keterangan: "Status belum diisi",
};

export function statusStyle(status: string | null | undefined): StatusStyle {
  return status && status in STATUS_STYLES ? STATUS_STYLES[status as StatusIrpom] : STATUS_KOSONG_STYLE;
}

export function statusLabel(status: string | null | undefined): string {
  return status && status in STATUS_STYLES ? status : STATUS_KOSONG_LABEL;
}

// "Luas lahan terairi" hanya menghitung unit yang pompanya sudah mengairi
// sawah (Pemanfaatan). Unit berstatus lain tetap ditampilkan & dihitung
// jumlah unitnya, tetapi luasnya tidak ikut dijumlahkan. Aturan yang sama
// dipakai RPC irpom_statistik_publik (0007_luas_terairi_pemanfaatan.sql).
export const STATUS_TERAIRI: StatusIrpom = "Pemanfaatan";
export const KETERANGAN_LUAS_TERAIRI = "Luas terairi hanya menghitung unit berstatus Pemanfaatan (pompa yang sudah mengairi sawah).";

export function luasTerairi(u: { status: string | null; luas_ha: number | null }): number {
  return u.status === STATUS_TERAIRI ? (u.luas_ha ?? 0) : 0;
}
