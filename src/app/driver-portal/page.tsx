"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  HelpCircle,
  MapPin,
  Navigation,
  Package,
  Phone,
  RefreshCw,
  Send,
  ShieldAlert,
  Smartphone,
  Truck,
  Upload,
  User,
  Wrench,
  Crosshair,
} from "lucide-react";

// Dynamically import GpsMapPicker without SSR
const GpsMapPicker = dynamic(() => import("@/components/GpsMapPicker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-44 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-500 animate-pulse text-xs">
      Memuat Peta GPS...
    </div>
  ),
});

export default function DriverPortalPage() {
  const [shipmentsList, setShipmentsList] = useState<any[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal / Action states
  const [activeModal, setActiveModal] = useState<"selfie" | "incident" | "transit" | "arrival" | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Action fields
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [customNote, setCustomNote] = useState("");
  const [incidentType, setIncidentType] = useState("Ban Belakang Bocor / Meledak");

  // GPS Realtime states (WhatsApp-style accuracy simulation)
  const [latitude, setLatitude] = useState<number>(-6.241586);
  const [longitude, setLongitude] = useState<number>(106.992416);
  const [accuracy, setAccuracy] = useState<number>(45); // meters
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationSelected, setLocationSelected] = useState<boolean>(false);
  const [isCustomSelected, setIsCustomSelected] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);
  const refineIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/mobile/shipments");
      const data = await res.json();
      if (data.success && data.data) {
        setShipmentsList(data.data);
        if (data.data.length > 0 && !selectedShipment) {
          setSelectedShipment(data.data[0]);
        } else if (selectedShipment) {
          const updated = data.data.find((s: any) => s.id === selectedShipment.id);
          if (updated) setSelectedShipment(updated);
        }
      }
    } catch (err) {
      console.error("Failed to load driver shipments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  // WhatsApp-Style GPS Refinement function
  const startGpsAcquisition = () => {
    setIsLocating(true);
    setLocationSelected(false);
    setAccuracy(45); // Start initial estimate

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      // 1. Get initial position
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setAccuracy(Math.max(pos.coords.accuracy || 20, 8));
          setIsLocating(false);
        },
        (err) => {
          console.warn("Real GPS unavailable, falling back to simulated coordinates:", err.message);
          // If simulation, gradually improve accuracy like WA (45m -> 28m -> 15m -> 8m)
          let simAccuracy = 45;
          clearInterval(refineIntervalRef.current as NodeJS.Timeout);
          refineIntervalRef.current = setInterval(() => {
            simAccuracy = Math.max(simAccuracy - 8, 8);
            setAccuracy(simAccuracy);
            if (simAccuracy <= 8) {
              clearInterval(refineIntervalRef.current as NodeJS.Timeout);
              setIsLocating(false);
            }
          }, 800);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
    }
  };

  // Clean up timers on modal change or unmount
  useEffect(() => {
    return () => {
      if (refineIntervalRef.current) clearInterval(refineIntervalRef.current);
      if (watchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const openActionModal = (type: "selfie" | "incident" | "transit" | "arrival") => {
    setActiveModal(type);
    setPhotoUrl(null);
    setCustomNote("");
    setLocationSelected(false);
    setIsCustomSelected(false);
    startGpsAcquisition();
  };

  // Upload Photo handler
  const handlePhotoUpload = async (file: File) => {
    try {
      setUploading(true);
      setActionError(null);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah foto");
      setPhotoUrl(data.url);
    } catch (err: any) {
      setActionError(err.message || "Upload foto gagal");
    } finally {
      setUploading(false);
    }
  };

  // Submit Checkpoint Action
  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;

    setActionError(null);
    setActionSuccess(null);
    setSubmitting(true);

    try {
      let payload: any = {
        latitude: activeModal === "arrival" ? (selectedShipment.destination_lat || latitude.toFixed(6)) : latitude.toFixed(6),
        longitude: activeModal === "arrival" ? (selectedShipment.destination_lng || longitude.toFixed(6)) : longitude.toFixed(6),
        photo_url: photoUrl,
      };

      if (activeModal === "selfie") {
        if (!photoUrl) throw new Error("Foto selfie di depan armada wajib diunggah.");
        payload.checkpoint_type = "departure_selfie";
        payload.status_label = "Mulai Perjalanan (Absen Berangkat Driver)";
        payload.description = customNote || "Driver telah menyelesaikan checklist armada dan bersiap berangkat dari Hub.";
      } else if (activeModal === "incident") {
        payload.checkpoint_type = "incident";
        payload.status_label = `Kendala di Jalan: ${incidentType}`;
        payload.description = customNote || `Armada mengalami kendala teknis: ${incidentType}.`;
      } else if (activeModal === "transit") {
        payload.checkpoint_type = "transit_update";
        payload.status_label = "Posisi Transit / Checkpoint";
        payload.description = customNote || "Armada melintas dalam kondisi aman dan lancar.";
      } else if (activeModal === "arrival") {
        if (!photoUrl) throw new Error("Foto bukti armada telah sampai di lokasi tujuan wajib diunggah.");
        payload.checkpoint_type = "arrival_driver";
        payload.status_label = "Armada Tiba di Lokasi Tujuan (Menunggu Konfirmasi Penerima)";
        payload.description = customNote || "Armada telah tiba di gerbang gudang penerima. Menunggu serah terima & konfirmasi penerima.";
      }

      const res = await fetch(`/api/mobile/shipments/${selectedShipment.id}/checkpoint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Gagal menyimpan checkpoint");

      setActionSuccess(`Aksi '${payload.status_label}' berhasil dikirim ke server!`);
      // Reset modal & form
      setPhotoUrl(null);
      setCustomNote("");
      setActiveModal(null);
      await fetchShipments();
    } catch (err: any) {
      setActionError(err.message || "Terjadi kesalahan sistem");
    } finally {
      setSubmitting(false);
    }
  };

  // Resolve Incident Action
  const handleResolveIncident = async () => {
    if (!selectedShipment) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/mobile/shipments/${selectedShipment.id}/checkpoint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkpoint_type: "incident_resolved",
          status_label: "Kendala Selesai / Melanjutkan Perjalanan",
          description: "Kendala telah ditangani, armada melanjutkan perjalanan kembali menuju kota tujuan.",
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses penyelesaian kendala");
      setActionSuccess("Kendala berhasil ditandai selesai. Status kembali dalam perjalanan.");
      await fetchShipments();
    } catch (err: any) {
      setActionError(err.message || "Gagal menyelesaikan kendala");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Top Mobile App Header */}
      <header className="bg-slate-800/95 border-b border-slate-700/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-xs text-white shadow-md">
              LIE
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">
                LIE Driver Portal
              </span>
              <span className="text-[10px] text-blue-400 font-medium">
                Simulasi Driver Lapangan
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchShipments}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/track"
              className="text-xs font-semibold bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 px-2.5 py-1.5 rounded-lg border border-blue-500/30 transition"
            >
              Buka Map
            </Link>
          </div>
        </div>
      </header>

      {/* Main Simulation Viewport */}
      <main className="max-w-md w-full mx-auto px-4 py-4 flex-1 space-y-4">
        {/* Helper Banner */}
        <div className="bg-blue-950/60 border border-blue-800/50 rounded-2xl p-3.5 text-xs text-blue-200 flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block">Portal Pengemudi Lapangan</span>
            <p className="text-[11px] text-blue-300 mt-0.5 leading-relaxed">
              Pilih lokasi saat ini dengan GPS akurat otomatis (seperti WhatsApp Share Location) tanpa perlu input koordinat teknis manual.
            </p>
          </div>
        </div>

        {/* Global Feedback Notifications */}
        {actionSuccess && (
          <div className="bg-emerald-950 border border-emerald-700/60 text-emerald-200 p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="bg-rose-950 border border-rose-700/60 text-rose-200 p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Shipment Selector */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-lg">
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Pilih Surat Jalan / Tugas Pengiriman:
          </label>
          <select
            value={selectedShipment?.id || ""}
            onChange={(e) => {
              const found = shipmentsList.find((s) => s.id === Number(e.target.value));
              if (found) setSelectedShipment(found);
            }}
            className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono"
          >
            {shipmentsList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.resi} — [{s.status.toUpperCase()}] — {s.destination_city} ({s.nopol || "Truk"})
              </option>
            ))}
          </select>

          {/* Active Card Summary */}
          {selectedShipment && (
            <div className="mt-4 pt-3.5 border-t border-slate-700/70 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Resi:</span>
                <span className="font-bold text-white font-mono text-sm">
                  {selectedShipment.resi}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status Saat Ini:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    selectedShipment.status === "terkirim"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : selectedShipment.status === "kendala"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : selectedShipment.driver_arrived
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : selectedShipment.status === "dalam_pengiriman"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {selectedShipment.status === "dalam_pengiriman" && selectedShipment.driver_arrived
                    ? "Tiba di Tujuan"
                    : selectedShipment.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Rute:</span>
                <span className="font-semibold text-slate-200">
                  {selectedShipment.origin_city} → {selectedShipment.destination_city}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Armada / Nopol:</span>
                <span className="font-mono text-slate-200">
                  {selectedShipment.nopol} ({selectedShipment.vehicle_name})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Muatan:</span>
                <span className="text-slate-200">
                  {selectedShipment.total_colli} Koli ({selectedShipment.actual_weight_kg} kg)
                </span>
              </div>

              {/* Active Issue Alert inside card */}
              {selectedShipment.has_active_issue && (
                <div className="mt-3 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Laporan Kendala Sedang Aktif!</span>
                  </div>
                  <p className="text-[11px] text-rose-300">
                    {selectedShipment.current_issue_note || "Driver melaporkan kendala di jalan."}
                  </p>
                  <button
                    onClick={handleResolveIncident}
                    disabled={submitting}
                    className="mt-2.5 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition shadow-sm"
                  >
                    Tandai Kendala Selesai & Lanjut Jalan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons for Driver */}
        {selectedShipment && (
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Pilihan Aksi Lapangan:
            </span>

            {/* ACTION 1: ABSEN BERANGKAT */}
            <button
              onClick={() => openActionModal("selfie")}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-lg shadow-blue-900/30 transition border border-blue-500"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-sm block">1. Absen Berangkat Driver</span>
                  <span className="text-[11px] text-blue-200">
                    Upload selfie + kunci lokasi GPS awal
                  </span>
                </div>
              </div>
              <Compass className="w-4 h-4 text-blue-200" />
            </button>

            {/* ACTION 2: LAPOR KENDALA */}
            <button
              onClick={() => openActionModal("incident")}
              className="w-full bg-rose-900/40 hover:bg-rose-900/60 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-lg transition border border-rose-700/60"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-700 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-sm block text-rose-300">2. Lapor Kendala di Jalan</span>
                  <span className="text-[11px] text-rose-400">
                    Ban meledak, mogok, tandai pin darurat
                  </span>
                </div>
              </div>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </button>

            {/* ACTION 3: UPDATE TRANSIT */}
            <button
              onClick={() => openActionModal("transit")}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-lg transition border border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-slate-300" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-sm block">3. Update Titik Checkpoint</span>
                  <span className="text-[11px] text-slate-400">
                    Kirim lokasi terkini saat melintas rute
                  </span>
                </div>
              </div>
              <MapPin className="w-4 h-4 text-slate-400" />
            </button>

            {/* ACTION 4: SAMPAI DI TUJUAN */}
            <button
              onClick={() => openActionModal("arrival")}
              className="w-full bg-emerald-950/40 hover:bg-emerald-950/70 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-lg transition border border-emerald-800/60"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-sm block text-emerald-300">4. Armada Tiba di Tujuan</span>
                  <span className="text-[11px] text-emerald-400">
                    Notifikasi tiba di gerbang penerima barang
                  </span>
                </div>
              </div>
              <Package className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        )}

        {/* MODAL FORM ACTION DENGAN WA-STYLE GPS MAP PICKER */}
        {activeModal && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-end sm:items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
            <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl animate-slideUp my-auto">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  {activeModal === "selfie" && <Camera className="w-4 h-4 text-blue-400" />}
                  {activeModal === "incident" && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  {activeModal === "transit" && <MapPin className="w-4 h-4 text-sky-400" />}
                  {activeModal === "arrival" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  <span>
                    {activeModal === "selfie" && "Absen Berangkat Driver"}
                    {activeModal === "incident" && "Lapor Kendala Teknis"}
                    {activeModal === "transit" && "Update Titik Transit"}
                    {activeModal === "arrival" && "Armada Sampai Tujuan"}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleExecuteAction} className="space-y-4 text-xs">
                {/* 1. WHATSAPP STYLE GPS MAP PICKER (HANYA MUNCUL DI SELAIN ARRIVAL) */}
                {activeModal !== "arrival" ? (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                      <span>Posisi Armada (GPS Satelit):</span>
                      {locationSelected && (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Lokasi Terkunci
                        </span>
                      )}
                    </label>

                    <GpsMapPicker
                      latitude={latitude}
                      longitude={longitude}
                      accuracy={accuracy}
                      isLocating={isLocating}
                      isCustomSelected={isCustomSelected}
                      onRefreshLocation={() => {
                        setIsCustomSelected(false);
                        startGpsAcquisition();
                      }}
                      onSelectCurrentLocation={() => setLocationSelected(true)}
                      onSelectCustomLocation={(lat, lng) => {
                        setLatitude(lat);
                        setLongitude(lng);
                        setIsCustomSelected(true);
                        setLocationSelected(true);
                      }}
                    />
                  </div>
                ) : (
                  /* Info card khusus armada tiba di tujuan (tanpa ribet pilih map) */
                  <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <MapPin className="w-4 h-4" />
                      <span>Konfirmasi Tiba di Lokasi Penerima</span>
                    </div>
                    <div className="text-[11px] text-slate-300 space-y-1">
                      <p>
                        Tujuan: <strong className="text-white">{selectedShipment?.receiver_company}</strong> ({selectedShipment?.destination_city})
                      </p>
                      <p className="text-slate-400">
                        Alamat: {selectedShipment?.destination_address || "Gudang Penerima"}
                      </p>
                    </div>
                    <div className="bg-emerald-900/40 text-emerald-300 p-2 rounded-xl text-[10px] border border-emerald-800/40">
                      ℹ️ Koordinat otomatis terkunci ke titik alamat tujuan. Setelah supir mengirim bukti tiba, status tetap menunggu konfirmasi tanda terima dari penerima barang.
                    </div>
                  </div>
                )}

                {/* 2. Specific field for incident */}
                {activeModal === "incident" && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Kategori Kendala:
                    </label>
                    <select
                      value={incidentType}
                      onChange={(e) => setIncidentType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-rose-500"
                    >
                      <option value="Ban Belakang Bocor / Meledak">Ban Belakang Bocor / Meledak</option>
                      <option value="Mesin Overheat / Mogok">Mesin Overheat / Mogok di Tol</option>
                      <option value="Macet Total Jalur Pantura">Macet Total &gt; 3 Jam</option>
                      <option value="Insiden Rem / Kecelakaan Ringan">Insiden Rem / Masalah Transmisi</option>
                      <option value="Banjir / Longsor">Akses Jalan Terputus (Bencana)</option>
                    </select>
                  </div>
                )}

                {/* 3. Notes */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Catatan Driver:
                  </label>
                  <textarea
                    rows={2}
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Tuliskan keterangan detail kondisi saat ini..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* 4. Photo attachment */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Foto Lapangan (Kamera / Unggah):
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white px-3.5 py-2 rounded-xl inline-flex items-center gap-2 transition text-xs font-semibold">
                      <Upload className="w-3.5 h-3.5 text-slate-300" />
                      <span>{uploading ? "Mengunggah..." : "Pilih Foto"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handlePhotoUpload(e.target.files[0]);
                        }}
                      />
                    </label>

                    {photoUrl && (
                      <div className="flex items-center gap-2">
                        <img
                          src={photoUrl}
                          alt="Uploaded"
                          className="w-8 h-8 rounded-lg object-cover border border-slate-600"
                        />
                        <span className="text-[11px] text-emerald-400 font-medium">Foto siap</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className={`w-full py-3 rounded-xl font-bold text-white text-xs transition shadow-md disabled:opacity-50 ${
                      activeModal === "incident"
                        ? "bg-rose-600 hover:bg-rose-500"
                        : "bg-blue-600 hover:bg-blue-500"
                    }`}
                  >
                    {submitting ? "Mengirim Data..." : "Kirim Checkpoint"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Footer info */}
      <footer className="border-t border-slate-800 bg-slate-900/90 py-3 text-center text-[11px] text-slate-500">
        Simulasi Lapangan LIE Cargo • Terhubung ke MySQL & Peta Pelacakan
      </footer>
    </div>
  );
}
