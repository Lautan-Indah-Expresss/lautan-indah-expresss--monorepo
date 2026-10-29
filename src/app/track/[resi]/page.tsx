"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Package,
  Phone,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Upload,
  User,
} from "lucide-react";

// Dynamically import TrackingMap with ssr: false
const TrackingMap = dynamic(() => import("@/components/TrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 animate-pulse">
      Memuat Peta Pelacakan...
    </div>
  ),
});

export default function ResiTrackingDetailPage() {
  const params = useParams();
  const resi = params?.resi as string;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shipment, setShipment] = useState<any>(null);

  // Active Tab for Action: 'confirm' or 'complaint'
  const [actionTab, setActionTab] = useState<"confirm" | "complaint">("confirm");

  // Form states for Konfirmasi Penerimaan
  const [confirmName, setConfirmName] = useState("");
  const [confirmPhoneLast4, setConfirmPhoneLast4] = useState("");
  const [confirmNotes, setConfirmNotes] = useState("");
  const [confirmPhoto, setConfirmPhoto] = useState<string | null>(null);
  const [uploadingConfirm, setUploadingConfirm] = useState(false);
  const [submittingConfirm, setSubmittingConfirm] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Form states for Keluhan / Komplain
  const [complaintPhoneLast4, setComplaintPhoneLast4] = useState("");
  const [complaintReporter, setComplaintReporter] = useState("");
  const [complaintType, setComplaintType] = useState("Barang Rusak");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [complaintPhoto, setComplaintPhoto] = useState<string | null>(null);
  const [uploadingComplaint, setUploadingComplaint] = useState(false);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState<string | null>(null);
  const [complaintError, setComplaintError] = useState<string | null>(null);

  const fetchTrackingData = async () => {
    if (!resi) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/track/${resi}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memuat data resi");
      }
      setShipment(data.data);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat memuat data resi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, [resi]);

  // Handle File Upload
  const handleUploadPhoto = async (
    file: File,
    setTargetUrl: (url: string) => void,
    setUploading: (val: boolean) => void,
    setError: (msg: string | null) => void
  ) => {
    try {
      setUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload gagal");
      }
      setTargetUrl(data.url);
    } catch (err: any) {
      setError(err.message || "Gagal mengunggah foto");
    } finally {
      setUploading(false);
    }
  };

  // Submit Konfirmasi Penerimaan
  const handleSubmitConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmError(null);
    setConfirmSuccess(null);

    if (!confirmPhoto) {
      setConfirmError("Silakan unggah foto bukti serah terima barang terlebih dahulu");
      return;
    }

    try {
      setSubmittingConfirm(true);
      const res = await fetch(`/api/track/${resi}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_last4: confirmPhoneLast4,
          received_by: confirmName,
          photo_url: confirmPhoto,
          notes: confirmNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengonfirmasi serah terima");
      }

      setConfirmSuccess("Konfirmasi penerimaan berhasil disimpan! Status pengiriman kini telah Terkirim.");
      // Refresh shipment data
      await fetchTrackingData();
    } catch (err: any) {
      setConfirmError(err.message || "Terjadi kesalahan saat konfirmasi");
    } finally {
      setSubmittingConfirm(false);
    }
  };

  // Submit Komplain / Keluhan
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setComplaintError(null);
    setComplaintSuccess(null);

    try {
      setSubmittingComplaint(true);
      const res = await fetch(`/api/track/${resi}/complaint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_last4: complaintPhoneLast4,
          reported_by: complaintReporter,
          issue_type: complaintType,
          description: complaintDesc,
          photo_url: complaintPhoto,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim laporan komplain");
      }

      setComplaintSuccess("Laporan kendala/keluhan berhasil dicatat. Tim operasional LIE Cargo segera menindaklanjuti.");
      await fetchTrackingData();
    } catch (err: any) {
      setComplaintError(err.message || "Terjadi kesalahan saat submit keluhan");
    } finally {
      setSubmittingComplaint(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Memuat data pelacakan resi {resi}...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !shipment) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-lg">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Resi Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500 mt-2">
            {errorMsg || `Nomor resi ${resi} tidak terdaftar pada sistem LIE Cargo.`}
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Cari Resi Lain</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const originCoords = {
    lat: Number(shipment.origin_lat) || -6.2,
    lng: Number(shipment.origin_lng) || 106.816666,
    city: shipment.origin_city,
    address: shipment.sender_address,
  };

  const destCoords = {
    lat: Number(shipment.destination_lat) || -6.914744,
    lng: Number(shipment.destination_lng) || 107.60981,
    city: shipment.destination_city,
    address: shipment.receiver_address,
  };

  const hasDriverArrived =
    shipment?.checkpoints?.some(
      (cp: any) => cp.checkpoint_type === "arrival_driver"
    ) || false;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "terkirim":
        return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Terkirim</span>;
      case "dalam_pengiriman":
        if (hasDriverArrived) {
          return (
            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              Sampai di Tujuan (Menunggu Diterima)
            </span>
          );
        }
        return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">Dalam Perjalanan</span>;
      case "kendala":
        return <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Kendala di Jalan</span>;
      case "komplain":
        return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Ada Komplain</span>;
      case "tertunda":
        return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Menunggu Berangkat</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title="Kembali ke Pelacakan"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                  LIE Cargo
                </span>
                <span className="text-xs bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">
                  {shipment.resi}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/admin/shipments/${shipment.resi}/print`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span> Resi
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 flex-1">
        {/* Active Incident Warning Alert */}
        {shipment.has_active_issue && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-rose-900 text-sm sm:text-base">
                  Perhatian: Armada Mengalami Kendala Operasional
                </h4>
                <span className="bg-rose-200 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Insiden Aktif
                </span>
              </div>
              <p className="text-xs sm:text-sm text-rose-700 mt-1">
                {shipment.current_issue_note || "Driver melaporkan kendala teknis dalam perjalanan. Posisi telah ditandai dengan pin merah pada peta rute."}
              </p>
            </div>
          </div>
        )}

        {/* Header Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {shipment.resi}
                </h1>
                {getStatusBadge(shipment.status)}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span>Ref PO: <strong className="text-slate-700">{shipment.reference_po || "-"}</strong></span>
                <span>•</span>
                <span>Layanan: <strong className="text-slate-700">{shipment.service_name} ({shipment.service_type})</strong></span>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 block">Estimasi Tiba:</span>
              <span className="text-sm font-bold text-slate-800 flex items-center sm:justify-end gap-1.5 mt-0.5">
                <Clock className="w-4 h-4 text-blue-600" />
                {shipment.estimated_days || "3 hari kerja"}
              </span>
            </div>
          </div>

          {/* Route Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5">
            <div className="flex items-start gap-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                A
              </div>
              <div className="text-xs">
                <span className="text-slate-400 font-medium block">Pengirim:</span>
                <span className="font-bold text-slate-800 text-sm block">{shipment.sender_company}</span>
                <p className="text-slate-500 mt-0.5">{shipment.sender_address}</p>
                <p className="text-slate-600 mt-1 font-medium">{shipment.origin_city}, {shipment.origin_province}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                B
              </div>
              <div className="text-xs">
                <span className="text-slate-400 font-medium block">Penerima:</span>
                <span className="font-bold text-slate-800 text-sm block">{shipment.receiver_company}</span>
                <p className="text-slate-500 mt-0.5">{shipment.receiver_address}</p>
                <p className="text-slate-600 mt-1 font-medium">{shipment.destination_city}, {shipment.destination_province}</p>
              </div>
            </div>
          </div>

          {/* Quick Fleet & Driver Info */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Armada:</span>
              <span className="font-bold text-slate-800 font-mono mt-0.5 block">{shipment.nopol || "-"}</span>
              <span className="text-slate-500 text-[11px]">{shipment.vehicle_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Driver Bertugas:</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{shipment.driver_name || "Belum Ditugaskan"}</span>
              <span className="text-slate-500 text-[11px]">{shipment.driver_phone || "-"}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Koli:</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{shipment.total_colli} Koli</span>
              <span className="text-slate-500 text-[11px]">{shipment.actual_weight_kg} Kg</span>
            </div>
            <div>
              <span className="text-slate-400 block">Status Penerimaan:</span>
              {shipment.received_date ? (
                <div>
                  <span className="font-bold text-emerald-700 block mt-0.5">Diterima oleh {shipment.received_by}</span>
                  <span className="text-slate-500 text-[11px]">
                    {String(shipment.received_date).slice(0, 10)}
                  </span>
                </div>
              ) : hasDriverArrived ? (
                <div>
                  <span className="font-bold text-indigo-700 block mt-0.5">Armada Tiba di Tujuan</span>
                  <span className="text-slate-500 text-[11px]">Menunggu Konfirmasi Penerima</span>
                </div>
              ) : (
                <span className="text-amber-600 font-medium block mt-0.5">Dalam Pengiriman</span>
              )}
            </div>
          </div>
        </div>

        {/* Map & Timeline Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interactive Leaflet Tracking Map */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Peta Rute & Titik Posisi Realtime</span>
              </h2>
              <span className="text-xs bg-blue-50 text-blue-700 font-medium px-2.5 py-1 rounded-full">
                Polyline Rute Terhubung
              </span>
            </div>

            <div className="flex-1 min-h-[380px] rounded-xl overflow-hidden border border-slate-200">
              <TrackingMap
                origin={originCoords}
                destination={destCoords}
                checkpoints={shipment.checkpoints || []}
                hasActiveIssue={shipment.has_active_issue}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                Asal Hub (A)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                Tujuan (B)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-white border border-sky-500 inline-flex items-center justify-center p-0.5">
                  <img src="/truck-icon.svg" alt="Truk" className="w-3.5 h-3.5" />
                </span>
                Posisi Terakhir Supir
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" />
                Titik Checkpoint
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                Titik Kendala
              </span>
            </div>
          </div>

          {/* Timeline Checkpoints */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col h-full">
            <h2 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Riwayat Perjalanan (Log)</span>
            </h2>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[460px]">
              {shipment.checkpoints && shipment.checkpoints.length > 0 ? (
                shipment.checkpoints.map((cp: any, idx: number) => {
                  const isIncident = cp.checkpoint_type === "incident" || cp.checkpoint_type === "complaint";
                  const isArrival = cp.checkpoint_type === "arrival_confirm" || cp.checkpoint_type === "arrival_driver";

                  return (
                    <div key={cp.id || idx} className="relative pl-6 pb-2 border-l-2 border-slate-200 last:border-l-0">
                      <div
                        className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white ${
                          isIncident
                            ? "bg-rose-500"
                            : isArrival
                            ? "bg-emerald-500"
                            : "bg-blue-600"
                        }`}
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-800 block text-sm">
                          {cp.status_label}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {String(cp.created_at).slice(0, 19).replace("T", " ")}
                        </span>
                        {cp.description && (
                          <p className="text-slate-600 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            {cp.description}
                          </p>
                        )}
                        {cp.photo_url && (
                          <div className="mt-2">
                            <a
                              href={cp.photo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block"
                            >
                              <img
                                src={cp.photo_url}
                                alt="Bukti Foto"
                                className="w-20 h-20 object-cover rounded-lg border border-slate-200 hover:opacity-90 shadow-xs"
                              />
                            </a>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Klik foto untuk perbesar</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  Belum ada log perjalanan tercatat.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cargo Items Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-blue-600" />
            <span>Rincian Barang Muatan</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Nama Barang / Deskripsi</th>
                  <th className="py-2.5 px-3 text-center">Jumlah (Qty)</th>
                  <th className="py-2.5 px-3 text-right">Berat (Kg)</th>
                  <th className="py-2.5 px-3 text-right">Nilai Barang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {shipment.items && shipment.items.length > 0 ? (
                  shipment.items.map((item: any, idx: number) => (
                    <tr key={item.id || idx}>
                      <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{item.item_name}</td>
                      <td className="py-2.5 px-3 text-center">{item.qty} Koli</td>
                      <td className="py-2.5 px-3 text-right">{item.weight_kg} kg</td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        Rp {Number(item.item_value).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">
                      Tidak ada data muatan kargo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recipient Actions (Konfirmasi Penerimaan / Ajukan Komplain) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Portal Penerima Barang</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verifikasi status barang yang telah sampai di lokasi tujuan Anda.
              </p>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActionTab("confirm")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  actionTab === "confirm"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Konfirmasi Diterima
              </button>
              <button
                type="button"
                onClick={() => setActionTab("complaint")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  actionTab === "complaint"
                    ? "bg-white text-rose-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Ajukan Komplain
              </button>
            </div>
          </div>

          {/* TAB 1: KONFIRMASI DITERIMA */}
          {actionTab === 'confirm' && (
            <div>
              {shipment.status === 'terkirim' ? (
                <div className='bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-800 text-xs space-y-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0'>
                      <CheckCircle2 className='w-6 h-6' />
                    </div>
                    <div>
                      <span className='font-bold block text-sm text-emerald-950'>Pengiriman Sudah Selesai Diterima</span>
                      <span className='text-emerald-800'>
                        Diterima oleh <strong>{shipment.received_by || 'Penerima'}</strong>. Data penerimaan sudah tercatat resmi di sistem.
                      </span>
                    </div>
                  </div>

                  {/* Foto Bukti Penerimaan */}
                  {(() => {
                    const confirmCp = (shipment.checkpoints || [])
                      .slice()
                      .reverse()
                      .find((c: any) => c.checkpoint_type === 'arrival_confirm' && c.photo_url);
                    const driverArrivalCp = (shipment.checkpoints || [])
                      .slice()
                      .reverse()
                      .find((c: any) => c.checkpoint_type === 'arrival_driver' && c.photo_url);

                    if (!confirmCp && !driverArrivalCp) return null;

                    return (
                      <div className='pt-3 border-t border-emerald-200/80'>
                        <span className='text-[11px] font-bold text-emerald-900 block mb-2 uppercase tracking-wider'>
                          Bukti Foto Serah Terima:
                        </span>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                          {driverArrivalCp && (
                            <div className='bg-white p-2.5 rounded-xl border border-emerald-200'>
                              <span className='text-[10px] text-slate-500 font-bold block mb-1.5'>
                                1. Foto Tiba di Gerbang (Sopir)
                              </span>
                              <a href={driverArrivalCp.photo_url} target='_blank' rel='noreferrer'>
                                <img
                                  src={driverArrivalCp.photo_url}
                                  alt='Foto Gerbang Tiba'
                                  className='w-full h-36 object-cover rounded-lg border border-slate-200 hover:opacity-90'
                                />
                              </a>
                            </div>
                          )}
                          {confirmCp && (
                            <div className='bg-white p-2.5 rounded-xl border border-emerald-200'>
                              <span className='text-[10px] text-slate-500 font-bold block mb-1.5'>
                                2. Foto Barang Diterima (Penerima)
                              </span>
                              <a href={confirmCp.photo_url} target='_blank' rel='noreferrer'>
                                <img
                                  src={confirmCp.photo_url}
                                  alt='Foto Serah Terima'
                                  className='w-full h-36 object-cover rounded-lg border border-slate-200 hover:opacity-90'
                                />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : !hasDriverArrived ? (
                <div className='bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm'>
                  <div className='w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 border border-amber-300 text-amber-700 font-bold'>
                    <Truck className='w-5 h-5 animate-bounce' />
                  </div>
                  <div>
                    <span className='font-bold block text-sm text-amber-900'>Menunggu Armada Sampai di Lokasi Tujuan</span>
                    <span className='text-amber-800/80 leading-relaxed block mt-0.5'>
                      Supir sedang dalam perjalanan menuju gudang tujuan Anda. Tombol konfirmasi serah terima barang ini akan otomatis terbuka setelah supir melapor dan memotret gerbang kedatangan (Status: <strong>Armada Tiba di Tujuan</strong>).
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitConfirm} className="space-y-4">
                  {confirmSuccess && (
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-medium border border-emerald-200">
                      {confirmSuccess}
                    </div>
                  )}
                  {confirmError && (
                    <div className="bg-rose-50 text-rose-800 p-3 rounded-xl text-xs font-medium border border-rose-200">
                      {confirmError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Lengkap Penerima <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={confirmName}
                        onChange={(e) => setConfirmName(e.target.value)}
                        placeholder="Contoh: Budi Santoso (Staff Gudang)"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        PIN Resi / 4 Digit No. HP Penerima <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={confirmPhoneLast4}
                        onChange={(e) => setConfirmPhoneLast4(e.target.value.trim())}
                        placeholder="Contoh: 5432 atau 6-digit PIN Resi"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        required
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Gunakan 4 digit terakhir nomor telepon penerima atau 6 digit PIN yang tercantum di surat jalan/resi.
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catatan Penerimaan (Opsional)
                    </label>
                    <input
                      type="text"
                      value={confirmNotes}
                      onChange={(e) => setConfirmNotes(e.target.value)}
                      placeholder="Contoh: Barang diterima dalam kondisi kardus utuh dan segel aman."
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Foto Bukti Serah Terima / Kondisi Paket <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition border border-slate-200">
                        <Upload className="w-4 h-4 text-slate-500" />
                        <span>{uploadingConfirm ? "Mengunggah..." : "Pilih Foto Bukti"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleUploadPhoto(
                                e.target.files[0],
                                setConfirmPhoto,
                                setUploadingConfirm,
                                setConfirmError
                              );
                            }
                          }}
                        />
                      </label>

                      {confirmPhoto && (
                        <div className="flex items-center gap-2">
                          <img
                            src={confirmPhoto}
                            alt="Bukti"
                            className="w-10 h-10 object-cover rounded-lg border border-slate-300"
                          />
                          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Foto terunggah
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingConfirm || uploadingConfirm}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50"
                  >
                    {submittingConfirm ? "Menyimpan Konfirmasi..." : "Konfirmasi Barang Diterima"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: AJUKAN KOMPLAIN */}
          {actionTab === "complaint" && (
            <div>
              {!hasDriverArrived && shipment.status !== "terkirim" && shipment.status !== "komplain" ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 border border-amber-300 text-amber-700 font-bold">
                    <Truck className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <span className="font-bold block text-sm text-amber-900">
                      Komplain Belum Dapat Dibuka
                    </span>
                    <span className="text-amber-800/80 leading-relaxed block mt-0.5">
                      Armada saat ini masih dalam perjalanan menuju lokasi Anda. Pengajuan komplain fisik atau kendala barang baru dapat diajukan setelah supir melapor tiba di lokasi tujuan (Status: <strong>Armada Tiba di Tujuan</strong>).
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitComplaint} className="space-y-4">
                  {complaintSuccess && (
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-medium border border-emerald-200">
                      {complaintSuccess}
                    </div>
                  )}
                  {complaintError && (
                    <div className="bg-rose-50 text-rose-800 p-3 rounded-xl text-xs font-medium border border-rose-200">
                      {complaintError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Pelapor <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={complaintReporter}
                        onChange={(e) => setComplaintReporter(e.target.value)}
                        placeholder="Nama Anda"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        PIN Resi / 4 Digit No. HP Penerima <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={complaintPhoneLast4}
                        onChange={(e) => setComplaintPhoneLast4(e.target.value.trim())}
                        placeholder="PIN / 4 Digit HP"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kategori Keluhan <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={complaintType}
                        onChange={(e) => setComplaintType(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="Barang Rusak">Barang Rusak / Pecah</option>
                        <option value="Koli Kurang / Selisih">Jumlah Koli Kurang / Selisih</option>
                        <option value="Salah Alamat / Tertukar">Barang Salah Alamat / Tertukar</option>
                        <option value="Kemasan Rusak / Basah">Kemasan Rusak / Basah</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Deskripsi / Kronologi Kejadian <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={complaintDesc}
                      onChange={(e) => setComplaintDesc(e.target.value)}
                      placeholder="Jelaskan kondisi barang saat diterima dan nomor koli mana yang terdampak..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Foto Bukti Kondisi Kerusakan / Selisih
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition border border-slate-200">
                        <Upload className="w-4 h-4 text-slate-500" />
                        <span>{uploadingComplaint ? "Mengunggah..." : "Pilih Foto Kerusakan"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleUploadPhoto(
                                e.target.files[0],
                                setComplaintPhoto,
                                setUploadingComplaint,
                                setComplaintError
                              );
                            }
                          }}
                        />
                      </label>

                      {complaintPhoto && (
                        <div className="flex items-center gap-2">
                          <img
                            src={complaintPhoto}
                            alt="Bukti Rusak"
                            className="w-10 h-10 object-cover rounded-lg border border-slate-300"
                          />
                          <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Foto tersimpan
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingComplaint || uploadingComplaint}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50"
                  >
                    {submittingComplaint ? "Mengirim Laporan..." : "Kirim Laporan Komplain"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} LIE Cargo (PT Lautan Indah Express). All rights reserved.
        </div>
      </footer>
    </div>
  );
}
