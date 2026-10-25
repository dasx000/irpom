// Perhitungan geometri sederhana yang dipakai bersama server & browser.

// Dua unit dianggap duplikasi koordinat bila jaraknya <= batas ini
// (PLAN.md: 2 hamparan sawah berbeda tidak mungkin pompanya sedekat itu).
export const BATAS_DUPLIKASI_M = 10;

export interface Titik {
  lat: number;
  lng: number;
}

// Jarak sebenarnya di permukaan bumi (rumus Haversine), dalam meter.
export function jarakMeter(a: Titik, b: Titik): number {
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

export interface UnitBertitik extends Titik {
  id: string;
}

// Kelompokkan unit yang saling berjarak <= BATAS_DUPLIKASI_M (berantai:
// A dekat B dan B dekat C = satu kelompok). Hanya kelompok berisi >= 2 unit
// yang dikembalikan.
export function kelompokDuplikasi<T extends UnitBertitik>(units: T[]): T[][] {
  const parent = units.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));

  for (let i = 0; i < units.length; i++) {
    for (let j = i + 1; j < units.length; j++) {
      if (jarakMeter(units[i], units[j]) <= BATAS_DUPLIKASI_M) parent[find(i)] = find(j);
    }
  }

  const groups = new Map<number, T[]>();
  units.forEach((u, i) => {
    const root = find(i);
    groups.set(root, [...(groups.get(root) ?? []), u]);
  });
  return Array.from(groups.values()).filter((g) => g.length > 1);
}
