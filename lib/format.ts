// Format angka Indonesia. Luasan selalu 2 angka di belakang koma (PLAN.md
// bagian 9: "11,45 Ha").

const haFormatter = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const angkaFormatter = new Intl.NumberFormat("id-ID");

export function formatHa(value: number | null | undefined): string {
  return value == null ? "-" : haFormatter.format(value);
}

export function formatAngka(value: number | null | undefined): string {
  return value == null ? "-" : angkaFormatter.format(value);
}

// Waktu Indonesia Barat, mis. "24 Okt 2026 21.40".
export function formatTanggalWaktu(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Membuka Google Maps langsung di titik lokasi (bukan petunjuk rute).
export function googleMapsTitikUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
