"use client";

import React, { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { AlertTriangle, Clock, MapPin } from "lucide-react";

export interface MapPoint {
  lat: number;
  lng: number;
  title: string;
  type: "origin" | "destination" | "checkpoint" | "incident" | "departure";
  time?: string;
  photo_url?: string | null;
  description?: string | null;
}

interface TrackingMapProps {
  origin: { lat: number; lng: number; city: string; address?: string };
  destination: { lat: number; lng: number; city: string; address?: string };
  checkpoints: Array<{
    id: number;
    actor_role: string;
    checkpoint_type: string;
    status_label: string;
    description: string | null;
    photo_url: string | null;
    latitude: string | null;
    longitude: string | null;
    created_at: string;
  }>;
  hasActiveIssue?: boolean;
}

// Component to handle Ctrl + Mouse Wheel Zoom with visual hint overlay
function CtrlScrollZoomHandler() {
  const map = useMap();
  const [showCtrlHint, setShowCtrlHint] = useState(false);

  useEffect(() => {
    const container = map.getContainer();

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setShowCtrlHint(false);
        const delta = e.deltaY;
        if (delta < 0) {
          map.zoomIn();
        } else if (delta > 0) {
          map.zoomOut();
        }
      } else {
        // Show helpful overlay toast if user tries to scroll without Ctrl
        setShowCtrlHint(true);
        const timer = setTimeout(() => {
          setShowCtrlHint(false);
        }, 1500);
        return () => clearTimeout(timer);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [map]);

  if (!showCtrlHint) return null;

  return (
    <div className="absolute inset-0 z-[1000] bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center pointer-events-none transition-all duration-200">
      <div className="bg-slate-900/90 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 shadow-2xl flex items-center gap-2">
        <span className="bg-slate-700 px-2 py-0.5 rounded font-mono text-[11px] text-sky-400">Ctrl</span>
        <span>+ scroll mouse untuk memperbesar/memperkecil peta</span>
      </div>
    </div>
  );
}

export default function TrackingMap({
  origin,
  destination,
  checkpoints,
  hasActiveIssue = false,
}: TrackingMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[400px] bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 animate-pulse">
        <span>Memuat Peta Tracking...</span>
      </div>
    );
  }

  // Create SVG custom DivIcons to avoid leaflet icon asset path issues
  const createCustomIcon = (bgColor: string, text: string) => {
    return L.divIcon({
      className: "custom-leaflet-marker",
      html: `
        <div style="
          background-color: ${bgColor};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 13px;
          border: 2px solid white;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25);
        ">
          ${text}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  const originIcon = createCustomIcon("#2563EB", "A");
  const destIcon = createCustomIcon("#10B981", "B");
  const checkIcon = createCustomIcon("#0284C7", "•");
  const incidentIcon = createCustomIcon("#EF4444", "!");

  // Custom Icon for the latest driver position using /truck-icon.svg
  const truckIcon = L.divIcon({
    className: "custom-leaflet-truck-marker",
    html: `
      <div class="truck-pulse-animation" style="
        width: 48px;
        height: 48px;
        background: #FFFFFF;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid #0284C7;
        box-shadow: 0 4px 14px rgba(2, 132, 199, 0.55);
        cursor: pointer;
      ">
        <img src="/truck-icon.svg" alt="Truk Posisi Terakhir" style="width: 32px; height: 32px; display: block; object-fit: contain; pointer-events: none;" />
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -26],
  });

  // Gather coordinates for Polyline
  const polylineCoords: [number, number][] = [
    [origin.lat, origin.lng],
  ];

  // Filter valid checkpoints with coords
  const validCheckpoints = checkpoints
    .filter((c) => c.latitude && c.longitude && !isNaN(Number(c.latitude)) && !isNaN(Number(c.longitude)))
    .map((c, idx) => ({
      id: c.id || idx,
      lat: Number(c.latitude),
      lng: Number(c.longitude),
      type: c.checkpoint_type,
      label: c.status_label,
      desc: c.description,
      photo: c.photo_url,
      time: c.created_at,
    }));

  // Find the index of the latest report from the driver
  // (departure_selfie, transit_update, incident, incident_resolved, arrival_driver)
  let latestDriverIndex = -1;
  for (let i = validCheckpoints.length - 1; i >= 0; i--) {
    const t = validCheckpoints[i].type;
    if (["departure_selfie", "transit_update", "incident", "incident_resolved", "arrival_driver"].includes(t)) {
      latestDriverIndex = i;
      break;
    }
  }

  validCheckpoints.forEach((cp) => {
    polylineCoords.push([cp.lat, cp.lng]);
  });

  polylineCoords.push([destination.lat, destination.lng]);

  // Center calculation (midpoint)
  const centerLat = (origin.lat + destination.lat) / 2;
  const centerLng = (origin.lng + destination.lng) / 2;

  return (
    <div className="w-full h-[420px] rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm relative z-10">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={8}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Origin Marker */}
        <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
          <Popup>
            <div className="text-xs space-y-1">
              <strong className="text-blue-700 block font-bold">ASAL (HUB PUSAT): {origin.city}</strong>
              <p className="text-slate-600 text-[11px]">{origin.address || "Hub Logistik Utama"}</p>
            </div>
          </Popup>
        </Marker>

        {/* Dynamic Checkpoints Markers */}
        {validCheckpoints.map((cp, idx) => {
          const isIncident = cp.type === "incident";
          const isLatestDriverReport = idx === latestDriverIndex;

          let markerIcon = isIncident ? incidentIcon : checkIcon;
          if (isLatestDriverReport) {
            markerIcon = truckIcon;
          }

          return (
            <Marker
              key={cp.id || idx}
              position={[cp.lat, cp.lng]}
              icon={markerIcon}
              zIndexOffset={isLatestDriverReport ? 1000 : 0}
            >
              <Popup>
                <div className="text-xs space-y-1.5 max-w-[220px]">
                  {isLatestDriverReport && (
                    <div className="flex items-center gap-1.5 bg-sky-50 text-sky-800 px-2 py-0.5 rounded font-bold text-[10px] border border-sky-200">
                      <span>🚚 Posisi Laporan Terakhir Supir</span>
                    </div>
                  )}
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      isIncident ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {cp.label}
                  </span>
                  {cp.desc && <p className="text-slate-600 text-[11px] leading-relaxed">{cp.desc}</p>}
                  {cp.photo && (
                    <div className="pt-1">
                      <img
                        src={cp.photo}
                        alt="Bukti Checkpoint"
                        className="w-full h-24 object-cover rounded-lg border border-slate-200"
                      />
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {cp.time.slice(0, 19).replace("T", " ")}
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Destination Marker */}
        <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
          <Popup>
            <div className="text-xs space-y-1">
              <strong className="text-emerald-700 block font-bold">TUJUAN: {destination.city}</strong>
              <p className="text-slate-600 text-[11px]">{destination.address || "Gudang Penerima"}</p>
            </div>
          </Popup>
        </Marker>

        {/* Route Polyline */}
        <Polyline
          positions={polylineCoords}
          color={hasActiveIssue ? "#EF4444" : "#2563EB"}
          weight={4}
          opacity={0.8}
          dashArray={hasActiveIssue ? "10, 10" : undefined}
        />

        {/* Ctrl + Scroll Zoom Handler */}
        <CtrlScrollZoomHandler />
      </MapContainer>
    </div>
  );
}
