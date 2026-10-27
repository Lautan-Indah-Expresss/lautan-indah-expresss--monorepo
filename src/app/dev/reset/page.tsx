"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Search,
  Truck,
  MapPin,
  RefreshCw,
  Trash2,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface ShipmentItem {
  id: number;
  resi: string;
  status: string;
  origin_city: string;
  destination_city: string;
  receiver_company: string;
}

export default function DevResetShipmentPage() {
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [selectedResi, setSelectedResi] = useState<string>("");
  const [manualResi, setManualResi] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchingList, setFetchingList] = useState(true);
  const [resultMsg, setResultMsg] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadShipments = async () => {
    try {
      setFetchingList(true);
      const res = await fetch("/api/dev/reset-shipment");
      const json = await res.json();
      if (res.ok && json.data) {
        setShipments(json.data);
        if (json.data.length > 0 && !selectedResi) {
          setSelectedResi(json.data[0].resi);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingList(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, []);

  const handleReset = async (resiToReset: string) => {
    const cleanResi = resiToReset.trim().toUpperCase();
    if (!cleanResi) {
      setResultMsg({ type: "error", message: "Masukkan nomor resi terlebih dahulu." });
      return;
    }

    if (!confirm(`Konfirmasi Reset:\nApakah Anda yakin ingin mereset resi ${cleanResi}?\n\nSemua foto perjalanan, checkpoint GPS, dan konfirmasi penerima akan dihapus. Status kembali ke 'Belum Berangkat' (tertunda).`)) {
      return;
    }

    try {
      setLoading(true);
      setResultMsg(null);

      const res = await fetch("/api/dev/reset-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resi: cleanResi }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mereset resi");
      }

      setResultMsg({ type: "success", message: data.message });
      loadShipments();
    } catch (err: any) {
      setResultMsg({ type: "error", message: err.message || "Terjadi kesalahan" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                Developer Mode
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 uppercase tracking-wider">
                Testing Tools
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-2.5">
              <RotateCcw className="w-6 h-6 text-indigo-600" />
              Reset Resi Pengiriman
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Hapus seluruh riwayat foto, titik GPS checkpoint, dan kembalikan status paket ke <strong>Belum Berangkat (tertunda)</strong> untuk kebutuhan simulasi ulang driver.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Ke Beranda
            </Link>
          </div>
        </div>

        {/* Status Notification */}
        {resultMsg && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 shadow-sm ${
              resultMsg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            {resultMsg.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span className="font-bold block mb-0.5">
                {resultMsg.type === "success" ? "Berhasil Direset!" : "Gagal Reset"}
              </span>
              <span>{resultMsg.message}</span>
            </div>
          </div>
        )}

        {/* Action Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Pilih Resi yang Mau Direset
          </h2>

          {/* Quick Select from Dropdown */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Pilih dari Daftar Resi Terdaftar di Database:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedResi}
                onChange={(e) => setSelectedResi(e.target.value)}
                disabled={fetchingList}
                className="flex-1 text-xs sm:text-sm font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {fetchingList ? (
                  <option>Memuat daftar resi...</option>
                ) : shipments.length === 0 ? (
                  <option>Tidak ada resi ditemukan</option>
                ) : (
                  shipments.map((s) => (
                    <option key={s.id} value={s.resi}>
                      {s.resi} — [{s.status.toUpperCase()}] ({s.origin_city} ➔ {s.destination_city} / {s.receiver_company})
                    </option>
                  ))
                )}
              </select>

              <button
                type="button"
                onClick={() => handleReset(selectedResi)}
                disabled={loading || !selectedResi}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-sm"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Reset Resi Terpilih
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Atau Ketik Resi Manual
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Manual Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Nomor Resi Manual:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={manualResi}
                onChange={(e) => setManualResi(e.target.value)}
                placeholder="Contoh: KG123456790ID"
                className="flex-1 text-xs sm:text-sm font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
              />
              <button
                type="button"
                onClick={() => handleReset(manualResi)}
                disabled={loading || !manualResi}
                className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-sm"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                Reset Resi Ini
              </button>
            </div>
          </div>

          {/* Direct Link to Track */}
          {selectedResi && (
            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
              <span className="text-slate-500">Lihat halaman publik tracking resi terpilih:</span>
              <Link
                href={`/track/${selectedResi}`}
                target="_blank"
                className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline"
              >
                <span>Buka Pelacakan {selectedResi}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Quick Instructions / Info */}
        <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
          <strong className="text-slate-800 block text-sm">💡 Apa yang terjadi saat tombol Reset ditekan?</strong>
          <ul className="list-disc list-inside space-y-1.5 leading-relaxed text-slate-600">
            <li><strong>Semua Checkpoint Dihapus:</strong> Foto selfie berangkat, laporan posisi transit, kendala jalan, dan foto tiba di gerbang dihapus bersih dari database.</li>
            <li><strong>Status Kembali Awal:</strong> Status resi menjadi <code>tertunda</code> (Belum Berangkat).</li>
            <li><strong>Di Aplikasi Mobile Supir:</strong> Di layar supir, tombol akan kembali aktif mulai dari <strong>"1. ABSEN FOTO SELFIE & MULAI JALAN"</strong>.</li>
            <li><strong>Di Web Pelacakan Penerima:</strong> Form tanda terima terkunci kembali menunggu supir melapor tiba.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
