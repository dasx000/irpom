"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, GeoJSON, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Feature, FeatureCollection } from "geojson";
import MapBaseLayers from "@/components/MapBaseLayers";

const markerIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Perkiraan titik tengah Kabupaten Way Kanan, dipakai sebagai default kalau
// unit belum punya koordinat.
const WAY_KANAN_CENTER: [number, number] = [-4.45, 104.45];

const KECAMATAN_GEOJSON_URL = "/geo/way-kanan-kecamatan.geojson";
const DESA_GEOJSON_URL = "/geo/way-kanan-desa.geojson";

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Arsir kecamatan yang lagi dipilih di form, supaya user tahu area mana yang
// harus diklik sebelum menandai titik presisinya. Auto-zoom ke kecamatan
// itu HANYA saat pilihannya berubah (bukan saat mount pertama) supaya form
// edit yang sudah punya marker tidak tiba-tiba ter-zoom-out ke level
// kecamatan begitu halaman dibuka.
function KecamatanHighlight({ kecamatanNama }: { kecamatanNama: string | null | undefined }) {
  const map = useMap();
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    let cancelled = false;
    fetch(KECAMATAN_GEOJSON_URL)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setGeoData(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const feature = geoData?.features.find(
    (f) => (f.properties?.WADMKC as string | undefined)?.trim().toLowerCase() === kecamatanNama?.trim().toLowerCase()
  ) as Feature | undefined;

  useEffect(() => {
    if (!feature) return;
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const bounds = L.geoJSON(feature).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature?.properties?.WADMKC]);

  if (!feature) return null;

  return (
    <GeoJSON
      key={kecamatanNama}
      data={feature}
      style={{ color: "#0284c7", weight: 2, fillColor: "#0284c7", fillOpacity: 0.12, dashArray: "5,4" }}
      interactive={false}
    />
  );
}

// Fetch sekali di level MapContainer, dipakai bareng oleh DesaHighlight
// (gambar batas desa) dan ZoomKeDesa (zoom ke desa terpilih) --
// supaya file 380KB-an ini cuma di-fetch sekali, tidak dobel.
function useDesaGeoData(): FeatureCollection | null {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(DESA_GEOJSON_URL)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setGeoData(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return geoData;
}

// Batas + nama tiap desa di dalam kecamatan yang dipilih, diambil dari data
// batas desa resmi BIG yang sama dengan yang dipakai di seluruh aplikasi --
// bukan dari label basemap (OSM/Esri), yang kualitasnya tidak terjamin untuk
// desa-desa kecil di Way Kanan.
function DesaHighlight({
  kecamatanNama,
  geoData,
}: {
  kecamatanNama: string | null | undefined;
  geoData: FeatureCollection | null;
}) {
  if (!geoData || !kecamatanNama) return null;

  const desaFeatures = geoData.features.filter(
    (f) => (f.properties?.WADMKC as string | undefined)?.trim().toLowerCase() === kecamatanNama.trim().toLowerCase()
  );

  if (desaFeatures.length === 0) return null;

  const desaCollection: FeatureCollection = { type: "FeatureCollection", features: desaFeatures };

  return (
    <GeoJSON
      key={kecamatanNama}
      data={desaCollection}
      style={{ color: "#2563eb", weight: 1, fillOpacity: 0, dashArray: "2,3" }}
      interactive={false}
      onEachFeature={(feature, layer) => {
        const nama = feature.properties?.NAMOBJ as string | undefined;
        if (!nama) return;
        layer.bindTooltip(nama, {
          permanent: true,
          direction: "center",
          className: "peta-desa-label",
        });
      }}
    />
  );
}

// Begitu user pilih/ganti desa, peta zoom ke batas desa itu (tanpa memasang
// pin -- koordinat IRPOM harus titik pompa yang sebenarnya, bukan tebakan).
// Dilewati saat mount pertama supaya form ubah yang sudah punya koordinat
// tetap fokus ke pin-nya.
function ZoomKeDesa({
  desaNama,
  kecamatanNama,
  geoData,
}: {
  desaNama: string | null | undefined;
  kecamatanNama: string | null | undefined;
  geoData: FeatureCollection | null;
}) {
  const map = useMap();
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (!desaNama || !geoData) return;

    const feature = geoData.features.find((f) => {
      const namaCocok = (f.properties?.NAMOBJ as string | undefined)?.trim().toLowerCase() === desaNama.trim().toLowerCase();
      if (!namaCocok) return false;
      if (!kecamatanNama) return true;
      return (f.properties?.WADMKC as string | undefined)?.trim().toLowerCase() === kecamatanNama.trim().toLowerCase();
    });
    if (!feature) return;

    const bounds = L.geoJSON(feature).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desaNama, geoData]);

  return null;
}

// Saat koordinat diisi lewat ketik/tempel (bukan geser pin), pindahkan peta
// ke pin bila pin berada di luar area yang sedang terlihat.
function IkutiPin({ latitude, longitude }: { latitude: number | null; longitude: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (latitude == null || longitude == null) return;
    const pos = L.latLng(latitude, longitude);
    if (!map.getBounds().contains(pos)) map.setView(pos, Math.max(map.getZoom(), 15));
  }, [map, latitude, longitude]);
  return null;
}

export default function PetaLokasiPicker({
  latitude,
  longitude,
  kecamatanNama,
  desaNama,
  onChange,
}: {
  latitude: number | null;
  longitude: number | null;
  kecamatanNama?: string | null;
  desaNama?: string | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const hasPosition = latitude != null && longitude != null;
  const center: [number, number] = hasPosition ? [latitude, longitude] : WAY_KANAN_CENTER;
  const desaGeoData = useDesaGeoData();

  return (
    <div className="overflow-hidden rounded-md border border-gray-300">
      <MapContainer center={center} zoom={hasPosition ? 15 : 10} style={{ height: "260px", width: "100%" }}>
        <MapBaseLayers />
        <KecamatanHighlight kecamatanNama={kecamatanNama} />
        <DesaHighlight kecamatanNama={kecamatanNama} geoData={desaGeoData} />
        <ZoomKeDesa desaNama={desaNama} kecamatanNama={kecamatanNama} geoData={desaGeoData} />
        <IkutiPin latitude={latitude} longitude={longitude} />
        <ClickHandler onPick={onChange} />
        {hasPosition && (
          <Marker
            position={[latitude, longitude]}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const pos = e.target.getLatLng();
                onChange(pos.lat, pos.lng);
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
