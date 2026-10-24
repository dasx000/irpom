import { statusStyle } from "@/lib/status-irpom";

// Ikon marker peta IRPOM: lingkaran berisi ikon tetes air (lucide "Droplet"),
//  - warna isi        = STATUS (biru/kuning/hijau/merah, abu-abu bila kosong)
//  - ukuran lingkaran = LUAS hamparan terairi (makin luas makin besar)
// SVG inline lewat L.divIcon, jadi tidak perlu file gambar. Nama status
// tetap tampil sebagai teks di legenda (components/MarkerLegend.tsx) & popup.

const DROPLET_PATH =
  '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>';

const UKURAN_MIN = 18;
const UKURAN_MAX = 34;

// Skala akar kuadrat supaya LUAS lingkaran (bukan diameternya) yang sebanding
// dengan luas lahan; luas kosong pakai ukuran terkecil.
export function markerSize(luasHa: number | null, luasMax: number): number {
  if (!luasHa || luasHa <= 0 || luasMax <= 0) return UKURAN_MIN;
  const t = Math.sqrt(Math.min(luasHa, luasMax) / luasMax);
  return Math.round(UKURAN_MIN + (UKURAN_MAX - UKURAN_MIN) * t);
}

export function getMarkerIconHtml(status: string | null, size = UKURAN_MIN): string {
  const fill = statusStyle(status).color;
  const iconSize = Math.round(size * 0.55);

  return `<div style="background:${fill};width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.45);">
    <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${DROPLET_PATH}</svg>
  </div>`;
}
