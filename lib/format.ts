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

export function googleMapsRuteUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
