"use client";

import { useEffect, useMemo } from "react";
import { LayersControl, MapContainer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Calendar, ExternalLink, Landmark, MapPin, MapPinned, User, Users } from "lucide-react";
import { getMarkerIconHtml, markerSize } from "@/lib/marker-icon";
import { statusLabel, statusStyle } from "@/lib/status-irpom";
import { formatHa, googleMapsTitikUrl } from "@/lib/format";
import type { IrpomPublik } from "@/lib/irpom-publik-types";
import MapBaseLayers from "@/components/MapBaseLayers";
import KecamatanChoropleth from "@/components/KecamatanChoropleth";

const WAY_KANAN_CENTER: [number, number] = [-4.45, 104.45];

type IrpomBerkoordinat = IrpomPublik & { latitude: number; longitude: number };

// Sesuaikan tampilan peta ke semua titik yang sedang tampil, setiap kali
// hasil filter berubah. Tanpa titik, peta tetap di posisi terakhir.
function FitToMarkers({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = points.map((p) => p.join(",")).join(";");
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) map.setView(points[0], 14);
    else map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

// `units` = semua unit hasil filter (termasuk yang belum punya koordinat,
// supaya luas per kecamatan di choropleth tetap utuh); marker hanya untuk
// unit yang berkoordinat.
export default function PetaSebaran({ units }: { units: IrpomPublik[] }) {
  const berkoordinat = units.filter((u): u is IrpomBerkoordinat => u.latitude != null && u.longitude != null);
  const luasMax = Math.max(0, ...units.map((u) => u.luas_ha ?? 0));

  const luasPerKecamatan = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of units) map.set(u.kecamatan, (map.get(u.kecamatan) ?? 0) + (u.luas_ha ?? 0));
    return map;
  }, [units]);

  return (
    <MapContainer center={WAY_KANAN_CENTER} zoom={9} style={{ height: "70vh", width: "100%" }}>
      <MapBaseLayers>
        <LayersControl.Overlay checked name="Luas Terairi per Kecamatan">
          <KecamatanChoropleth values={luasPerKecamatan} formatValue={(n) => `${formatHa(n)} Ha`} />
        </LayersControl.Overlay>
      </MapBaseLayers>
      <FitToMarkers points={berkoordinat.map((u) => [u.latitude, u.longitude])} />
      {berkoordinat.map((u) => {
        const size = markerSize(u.luas_ha, luasMax);
        const icon = L.divIcon({
          html: getMarkerIconHtml(u.status, size),
          className: "",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -size / 2],
        });
        return (
          <Marker key={u.id} position={[u.latitude, u.longitude]} icon={icon}>
            <Popup minWidth={230} maxWidth={270}>
              {/* Pakai div, bukan <p>: CSS Leaflet memberi margin besar pada <p> di popup. */}
              <div className="-m-1 min-w-[200px]">
                <div className="flex items-center gap-2.5 border-b border-gray-100 pr-5 pb-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                    <Users size={16} />
                  </span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="text-[11px] text-gray-400">Kelompok Tani</div>
                    <div className="truncate text-sm font-semibold text-gray-900" title={u.kelompok_tani ?? undefined}>
                      {u.kelompok_tani ?? "-"}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyle(u.status).badge}`}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {statusLabel(u.status)}
                  </span>
                  <span className="text-sm font-bold text-gray-900 tabular-nums">
                    {u.luas_ha != null ? `${formatHa(u.luas_ha)} Ha` : "-"}
                  </span>
                </div>

                <dl className="mt-2.5 space-y-1.5 text-xs">
                  {[
                    { icon: User, label: "Ketua", value: u.ketua_poktan },
                    { icon: MapPin, label: "Desa", value: u.desa },
                    { icon: MapPinned, label: "Kecamatan", value: u.kecamatan },
                    { icon: Calendar, label: "Tahun anggaran", value: u.tahun_anggaran != null ? String(u.tahun_anggaran) : null },
                    { icon: Landmark, label: "Sumber dana", value: u.sumber_dana },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-2">
                      <Icon size={13} className="mt-0.5 shrink-0 text-gray-400" />
                      <dt className="w-24 shrink-0 text-gray-500">{label}</dt>
                      <dd className={`min-w-0 flex-1 text-right ${value ? "font-medium text-gray-800" : "text-gray-400 italic"}`}>
                        {value ?? "Belum diisi"}
                      </dd>
                    </div>
                  ))}
                </dl>

                <a
                  href={googleMapsTitikUrl(u.latitude, u.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-md bg-sky-700 px-3 py-1.5 text-xs font-medium !text-white hover:bg-sky-800"
                >
                  <ExternalLink size={13} />
                  Lihat di Google Maps
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
