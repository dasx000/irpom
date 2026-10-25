import { statusStyle } from "@/lib/status-irpom";

// Ikon marker peta IRPOM: pin lokasi (bentuk tetes terbalik, ujung lancip di
// bawah = titik pompa), warna isi = STATUS (biru/kuning/hijau/merah, abu-abu
// bila kosong); semua marker berukuran sama.
// SVG inline lewat L.divIcon, jadi tidak perlu file gambar. Nama status
// tetap tampil sebagai teks di legenda (components/MarkerLegend.tsx) & popup.

// Lebar pin (px); tinggi = lebar x RASIO_PIN.
export const UKURAN_MARKER = 26;
export const RASIO_PIN = 1.35;

export function getMarkerIconHtml(status: string | null, size = UKURAN_MARKER): string {
  const fill = statusStyle(status).color;
  const tinggi = Math.round(size * RASIO_PIN);

  return `<svg width="${size}" height="${tinggi}" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,0.45))">
    <path d="M12 1C5.9 1 1 5.8 1 11.8c0 7.9 9.6 18 10.3 18.7a1 1 0 0 0 1.4 0C13.4 29.8 23 19.7 23 11.8 23 5.8 18.1 1 12 1z" fill="${fill}" stroke="white" stroke-width="1.8"/>
    <circle cx="12" cy="11.8" r="4.2" fill="white"/>
  </svg>`;
}
