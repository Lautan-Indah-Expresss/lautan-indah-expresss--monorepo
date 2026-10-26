"use client";

import React, { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  Crosshair,
  MapPin,
  RefreshCw,
  CheckCircle2,
  Navigation2,
  Sparkles,
  MousePointerClick,
} from "lucide-react";

interface GpsMapPickerProps {
  latitude: number;
  longitude: number;
  accuracy: number;
  isLocating: boolean;
  onRefreshLocation: () => void;
  onSelectCurrentLocation: () => void;
  onSelectCustomLocation?: (lat: number, lng: number) => void;
  selectedLocationName?: string;
  isCustomSelected?: boolean;
}

// Controller to auto center map when coordinate changes
function MapCenterController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15, { animate: true });
  }, [lat, lng, map]);
  return null;
}

// Map Click Listener for Dev / Simulation Mode
function MapClickHandler({
  onMapClick,
}: {
  onMapClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function GpsMapPicker({
  latitude,
  longitude,
  accuracy,
  isLocating,
  onRefreshLocation,
  onSelectCurrentLocation,
  onSelectCustomLocation,
  selectedLocationName = "Lokasi Armada Saat Ini",
  isCustomSelected = false,
}: GpsMapPickerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-48 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-500 animate-pulse text-xs">
        Memuat GPS Map...
      </div>
    );
  }

  // Pulsating location dot (Blue for GPS, Emerald for Manual Pin)
  const pinColor = isCustomSelected ? "#10B981" : "#0284C7";
  const locationDotIcon = L.divIcon({
    className: "gps-user-location-marker",
    html: `
      <div style="
        position: relative;
        width: 26px;
        height: 26px;
        background: ${pinColor};
        border: 3px solid #FFFFFF;
        border-radius: 50%;
        box-shadow: 0 0 12px ${pinColor};
        cursor: pointer;
      ">
        <div style="
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          background: ${pinColor};
          opacity: 0.35;
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-xl">
      {/* Dev Mode Banner Indicator */}
      <div className="bg-sky-950/90 border-b border-sky-800/40 px-3 py-1.5 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-sky-300 font-semibold">
          <MousePointerClick className="w-3.5 h-3.5 text-sky-400" />
          <span>Klik langsung di peta untuk memilih lokasi simulasi</span>
        </div>
        <span className="text-[10px] bg-sky-900 text-sky-200 font-mono px-1.5 py-0.5 rounded border border-sky-700/50">
          Dev Mode
        </span>
      </div>

      {/* Top Map Viewport */}
      <div className="relative w-full h-52 bg-slate-950">
        <MapContainer
          center={[latitude, longitude]}
          zoom={15}
          zoomControl={false}
          scrollWheelZoom={false}
          dragging={true}
          className="w-full h-full cursor-crosshair"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Accuracy radius circle */}
          <Circle
            center={[latitude, longitude]}
            radius={isCustomSelected ? 15 : Math.max(accuracy, 10)}
            pathOptions={{
              color: pinColor,
              fillColor: pinColor,
              fillOpacity: 0.18,
              weight: 1.5,
            }}
          />

          {/* Marker Dot */}
          <Marker position={[latitude, longitude]} icon={locationDotIcon} />

          <MapCenterController lat={latitude} lng={longitude} />
          <MapClickHandler onMapClick={onSelectCustomLocation} />
        </MapContainer>

        {/* Floating Refresh GPS button */}
        <button
          type="button"
          onClick={onRefreshLocation}
          disabled={isLocating}
          className="absolute top-2.5 right-2.5 z-[500] p-2 bg-slate-900/90 hover:bg-slate-800 text-sky-400 rounded-xl border border-slate-700 shadow-md backdrop-blur-xs transition active:scale-95 disabled:opacity-60"
          title="Segarkan / Reset ke GPS Asli Perangkat"
        >
          <Crosshair className={`w-4 h-4 ${isLocating ? "animate-spin text-amber-400" : ""}`} />
        </button>

        {/* Live Tracking Status Badge */}
        <div className="absolute bottom-2.5 left-2.5 z-[500] bg-slate-900/90 backdrop-blur-xs text-[10px] text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5 shadow-sm font-medium">
          <span
            className={`w-2 h-2 rounded-full ${
              isCustomSelected
                ? "bg-emerald-400"
                : isLocating
                ? "bg-amber-400 animate-ping"
                : "bg-sky-400 animate-pulse"
            }`}
          />
          <span>
            {isCustomSelected
              ? "Pin Manual Dipilih"
              : isLocating
              ? "Mencari sinyal satelit..."
              : "GPS Terkunci"}
          </span>
        </div>
      </div>

      {/* WhatsApp-Style Location Selector Box */}
      <div className="p-3 bg-slate-850 border-t border-slate-700/80">
        <button
          type="button"
          onClick={onSelectCurrentLocation}
          className="w-full group bg-slate-800/80 hover:bg-slate-750 p-2.5 rounded-xl border border-slate-700 flex items-center gap-3 transition text-left active:bg-slate-700 shadow-xs"
        >
          {/* Target Radar Icon */}
          <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <div className="w-5 h-5 rounded-full border-2 border-emerald-400 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white group-hover:text-sky-300 transition truncate">
                {isCustomSelected ? "Kirim lokasi titik yang dipilih" : "Kirim lokasi Anda saat ini"}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                Pilih
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[11px] text-slate-400 font-medium">
                {isCustomSelected ? (
                  <span className="text-emerald-300">
                    Titik pin map aktif ({latitude.toFixed(4)}, {longitude.toFixed(4)})
                  </span>
                ) : (
                  <>
                    Akurat sampai <strong className="text-emerald-300 font-mono">{Math.round(accuracy)} meter</strong>
                  </>
                )}
              </p>
              {isLocating && (
                <span className="text-[10px] text-amber-400 flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> mempersempit...
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Quick simulation buttons for common logistics checkpoints */}
        <div className="mt-2.5 pt-2 border-t border-slate-700/60">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 px-0.5">
            <span>Pintasan Titik Simulasi Tol:</span>
            <span className="text-[10px] text-sky-400">1-Klik Langsung Pilih</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { name: "Tol Cikampek Utama", lat: -6.40245, lng: 107.45231 },
              { name: "Tol Cipularang KM 72", lat: -6.52981, lng: 107.43212 },
              { name: "Tol Padalarang", lat: -6.84512, lng: 107.48921 },
              { name: "Gerbang Tol Pasteur", lat: -6.89241, lng: 107.56234 },
            ].map((shortcut) => (
              <button
                key={shortcut.name}
                type="button"
                onClick={() => {
                  if (onSelectCustomLocation) {
                    onSelectCustomLocation(shortcut.lat, shortcut.lng);
                  }
                }}
                className="text-[10px] bg-slate-800 hover:bg-sky-950 hover:text-sky-300 hover:border-sky-700 border border-slate-700 px-2 py-1 rounded-lg text-slate-300 transition"
              >
                📍 {shortcut.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
