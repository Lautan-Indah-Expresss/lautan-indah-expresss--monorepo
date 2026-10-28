"use client";

import React, { useState, useEffect } from "react";
import { Car, Plus, Search, User, CheckCircle2, AlertCircle, Loader2, KeyRound } from "lucide-react";

interface FleetItem {
  id: number;
  nopol: string;
  vehicle_name: string;
  default_driver_id: number | null;
  default_driver_name: string | null;
  default_driver_phone: string | null;
  status: string;
  created_at: string;
}

interface DriverOption {
  id: number;
  name: string;
  username: string;
  phone: string;
}

export default function FleetsPage() {
  const [fleets, setFleets] = useState<FleetItem[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [formNopol, setFormNopol] = useState("");
  const [formVehicleName, setFormVehicleName] = useState("");
  const [formDriverId, setFormDriverId] = useState<string>("");
  const [formStatus, setFormStatus] = useState("available");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [resFleets, resDrivers] = await Promise.all([
        fetch("/api/fleets"),
        fetch("/api/drivers"),
      ]);
      const dataFleets = await resFleets.json();
      const dataDrivers = await resDrivers.json();

      if (dataFleets.success) setFleets(dataFleets.data);
      if (dataDrivers.success) setDrivers(dataDrivers.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateFleet = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/fleets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nopol: formNopol,
          vehicle_name: formVehicleName,
          default_driver_id: formDriverId ? Number(formDriverId) : null,
          status: formStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan armada");
      }

      setSuccessMessage("Data armada berhasil ditambahkan!");
      setFormNopol("");
      setFormVehicleName("");
      setFormDriverId("");
      setFormStatus("available");
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Terjadi kesalahan sistem");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Tersedia (Siap Jalan)
          </span>
        );
      case "on_trip":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            Sedang Bertugas
          </span>
        );
      case "trouble":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
            Kendala / Rusak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Maintenance
          </span>
        );
    }
  };

  const filtered = fleets.filter(
    (f) =>
      f.nopol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.vehicle_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.default_driver_name && f.default_driver_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Armada Kargo</h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data nomor plat armada dan penugasan sopir bawaan (Default Driver) untuk auto-fill surat jalan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowModal(true);
            setErrorMessage(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Armada Baru</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari no. plat, tipe kendaraan, atau nama sopir..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
        <span className="text-xs text-slate-400 font-semibold">{filtered.length} Armada Terdaftar</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">No. Plat (Nopol)</th>
                <th className="px-5 py-3.5">Tipe Kendaraan</th>
                <th className="px-5 py-3.5">Kurir / Sopir Default</th>
                <th className="px-5 py-3.5">Status Armada</th>
                <th className="px-5 py-3.5">Terdaftar Sejak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Memuat data armada...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    Tidak ada armada ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="inline-flex items-center gap-2 font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                        <Car className="w-4 h-4 text-blue-600" />
                        {f.nopol}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">
                      {f.vehicle_name}
                    </td>
                    <td className="px-5 py-3.5">
                      {f.default_driver_name ? (
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-blue-500" />
                            {f.default_driver_name}
                          </div>
                          <div className="text-[10px] text-slate-400">{f.default_driver_phone}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Belum ditentukan</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">{getStatusBadge(f.status)}</td>
                    <td className="px-5 py-3.5 text-slate-400 font-medium">
                      {String(f.created_at).slice(0, 10)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Armada */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">Tambah Unit Armada Baru</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateFleet} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Plat (Nopol) *</label>
                <input
                  type="text"
                  required
                  value={formNopol}
                  onChange={(e) => setFormNopol(e.target.value.toUpperCase())}
                  placeholder="Misal: B 9123 KRG"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama / Jenis Kendaraan *</label>
                <input
                  type="text"
                  required
                  value={formVehicleName}
                  onChange={(e) => setFormVehicleName(e.target.value)}
                  placeholder="Misal: Mitsubishi Fuso Box 6 Roda"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Sopir Bawaan (Default Driver)</label>
                <select
                  value={formDriverId}
                  onChange={(e) => setFormDriverId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="">-- Tanpa Sopir Bawaan --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (@{d.username})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Saat no. plat ini dipilih saat buat pengiriman, sopir ini otomatis terpilih.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Kesiapan</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="available">Tersedia (Ready)</option>
                  <option value="maintenance">Dalam Perawatan (Bengkel)</option>
                  <option value="on_trip">Sedang Bertugas</option>
                  <option value="trouble">Kendala</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan Armada"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
