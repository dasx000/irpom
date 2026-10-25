import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

const DESA_GEOJSON_PATH = path.join(process.cwd(), "public", "geo", "way-kanan-desa.geojson");

// Cache di level module -- file ~380KB, tidak perlu dibaca ulang tiap baris
// atau tiap request selama proses server masih hidup.
let cachedFeatures: Feature[] | null = null;

async function loadDesaFeatures(): Promise<Feature[]> {
  if (cachedFeatures) return cachedFeatures;
  const raw = await readFile(DESA_GEOJSON_PATH, "utf8");
  cachedFeatures = (JSON.parse(raw) as FeatureCollection).features;
  return cachedFeatures;
}

function inRing(x: number, y: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inGeometry(x: number, y: number, geometry: Polygon | MultiPolygon): boolean {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.some((p) => inRing(x, y, p[0]) && !p.slice(1).some((hole) => inRing(x, y, hole)));
}

// Pemeriksa "titik ada di dalam Kabupaten Way Kanan" (gabungan semua poligon
// desa). Sama dengan pengecekan di scripts/generate-seed.mjs.
export async function getPemeriksaWilayah(): Promise<(lat: number, lng: number) => boolean> {
  const features = await loadDesaFeatures();
  return (lat, lng) => features.some((f) => inGeometry(lng, lat, f.geometry as Polygon | MultiPolygon));
}
