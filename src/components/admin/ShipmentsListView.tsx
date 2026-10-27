"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  PlusCircle,
  Search,
  Filter,
  RotateCcw,
  Download,
  Eye,
  MoreVertical,
  Calendar,
  Layers,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface ShipmentRecord {
  id: number;
  resi: string;
  reference_po: string | null;
  sender_company: string;
  sender_contact: string;
  receiver_company: string;
  receiver_contact: string;
  origin_city: string;
  destination_city: string;
  service_type: string;
  status: string;
  shipped_date: string | Date;
  shipped_date_formatted?: string;
  estimated_days: string | null;
  actual_weight_kg: string;
  total_cost: string;
  has_active_issue: boolean;
}

interface ShipmentsListViewProps {
  initialShipments: ShipmentRecord[];
}

export default function ShipmentsListView({ initialShipments }: ShipmentsListViewProps) {
  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [filterCity, setFilterCity] = useState("all");

  // Selection & Pagination
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Extract unique destination cities for dropdown
  const uniqueCities = useMemo(() => {
    const set = new Set(initialShipments.map((s) => s.destination_city).filter(Boolean));
    return Array.from(set);
  }, [initialShipments]);

  // Tab counters
  const counts = useMemo(() => {
    return {
      all: initialShipments.length,
      dalam_pengiriman: initialShipments.filter((s) => s.status === "dalam_pengiriman").length,
      terkirim: initialShipments.filter((s) => s.status === "terkirim").length,
      tertunda: initialShipments.filter((s) => s.status === "tertunda").length,
      dibatalkan: initialShipments.filter((s) => s.status === "dibatalkan").length,
      kendala: initialShipments.filter((s) => s.status === "kendala" || s.status === "komplain").length,
    };
  }, [initialShipments]);

  // Filtered shipments
  const filteredShipments = useMemo(() => {
    return initialShipments.filter((s) => {
      // Status Tab filter
      if (statusTab !== "all") {
        if (statusTab === "kendala") {
          if (s.status !== "kendala" && s.status !== "komplain") return false;
        } else if (s.status !== statusTab) {
          return false;
        }
      }

      // Dropdown Status filter
      if (filterStatus !== "all" && s.status !== filterStatus) {
        return false;
      }

      // Service filter
      if (filterService !== "all" && s.service_type !== filterService) {
        return false;
      }

      // Destination City filter
      if (filterCity !== "all" && s.destination_city !== filterCity) {
        return false;
      }

      // Date filter
      if (filterDate) {
        const shipDate = String(s.shipped_date).slice(0, 10);
        if (shipDate !== filterDate) return false;
      }

      // Search keyword (resi, sender, receiver, destination)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchResi = s.resi.toLowerCase().includes(q);
        const matchSender = s.sender_company.toLowerCase().includes(q);
        const matchReceiver = s.receiver_company.toLowerCase().includes(q);
        const matchDest = s.destination_city.toLowerCase().includes(q);
        const matchPO = s.reference_po?.toLowerCase().includes(q);
        if (!matchResi && !matchSender && !matchReceiver && !matchDest && !matchPO) {
          return false;
        }
      }

      return true;
    });
  }, [initialShipments, statusTab, filterStatus, filterService, filterCity, filterDate, searchTerm]);

  // Pagination slicing
  const totalItems = filteredShipments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedShipments = filteredShipments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleReset = () => {
    setSearchTerm("");
    setStatusTab("all");
    setFilterDate("");
    setFilterStatus("all");
    setFilterService("all");
    setFilterCity("all");
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedShipments.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "No. Resi",
      "Pengirim",
      "Penerima",
      "Kota Tujuan",
      "Layanan",
      "Status",
      "Tanggal Kirim",
      "Estimasi",
      "Berat (kg)",
      "Total Biaya",
    ];
    const rows = filteredShipments.map((s) => [
      s.resi,
      s.sender_company,
      s.receiver_company,
      s.destination_city,
      s.service_type,
      s.status,
      s.shipped_date_formatted || String(s.shipped_date).slice(0, 10),
      s.estimated_days || "-",
      s.actual_weight_kg,
      s.total_cost,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "lie-cargo-shipments.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string, hasIssue: boolean) => {
    if (hasIssue || status === "kendala" || status === "komplain") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
          {status === "komplain" ? "Komplain Penerima" : "Kendala Lapangan"}
        </span>
      );
    }

    switch (status) {
      case "dalam_pengiriman":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Dalam Pengiriman
          </span>
        );
      case "terkirim":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Terkirim
          </span>
        );
      case "tertunda":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Tertunda
          </span>
        );
      case "dibatalkan":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
          <Link href="/admin" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-700">Daftar Pengiriman</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Daftar Pengiriman</h2>
            <p className="text-xs text-slate-500 mt-1">
              Kelola dan pantau semua data pengiriman kargo, status muatan, dan cetak surat jalan.
            </p>
          </div>
          <Link
            href="/admin/shipments/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Buat Pengiriman</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Tanggal */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal</label>
            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">Pilih status (Semua)</option>
              <option value="dalam_pengiriman">Dalam Pengiriman</option>
              <option value="terkirim">Terkirim</option>
              <option value="tertunda">Tertunda</option>
              <option value="kendala">Kendala</option>
              <option value="komplain">Komplain</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>

          {/* Jenis Layanan */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Jenis Layanan</label>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">Pilih layanan (Semua)</option>
              <option value="Reguler">Reguler</option>
              <option value="Express">Express</option>
            </select>
          </div>

          {/* Kota Tujuan */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Kota Tujuan</label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">Pilih kota tujuan (Semua)</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Input Cari */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Cari</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari resi / pelanggan / penerima"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Buttons: Filter & Reset */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Status Tabs & Export Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-1">
        {/* Underline Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: "all", label: "Semua", count: counts.all },
            { id: "dalam_pengiriman", label: "Dalam Pengiriman", count: counts.dalam_pengiriman },
            { id: "terkirim", label: "Terkirim", count: counts.terkirim },
            { id: "tertunda", label: "Tertunda", count: counts.tertunda },
            { id: "dibatalkan", label: "Dibatalkan", count: counts.dibatalkan },
            { id: "kendala", label: "Kendala / Komplain", count: counts.kendala, alert: true },
          ].map((tab) => {
            const isActive = statusTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all border-b-2 -mb-[3px] cursor-pointer ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    tab.alert && tab.count > 0
                      ? "bg-red-100 text-red-700"
                      : isActive
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Export Button */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedShipments.length > 0 &&
                      paginatedShipments.every((s) => selectedIds.includes(s.id))
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3.5">No. Resi</th>
                <th className="px-4 py-3.5">Pengirim</th>
                <th className="px-4 py-3.5">Penerima</th>
                <th className="px-4 py-3.5">Tujuan</th>
                <th className="px-4 py-3.5">Layanan</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Tanggal Kirim</th>
                <th className="px-4 py-3.5">Estimasi Tiba</th>
                <th className="px-4 py-3.5 text-right">Berat (kg)</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedShipments.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm text-slate-600">Tidak ada data pengiriman</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Coba ganti filter atau kata kunci pencarian Anda.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedShipments.map((s) => (
                  <tr
                    key={s.id}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      selectedIds.includes(s.id) ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(s.id)}
                        onChange={() => handleSelectRow(s.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3.5 font-bold font-mono text-slate-900">
                      <Link
                        href={`/admin/shipments/${s.resi}/print`}
                        className="text-blue-600 hover:underline flex items-center gap-1.5"
                      >
                        <Package className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{s.resi}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      <div>{s.sender_company}</div>
                      <div className="text-[10px] text-slate-400">{s.sender_contact}</div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      <div>{s.receiver_company}</div>
                      <div className="text-[10px] text-slate-400">{s.receiver_contact}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-700">{s.destination_city}</div>
                      <div className="text-[10px] text-slate-400">Dari: {s.origin_city}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.service_type === "Express"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {s.service_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(s.status, s.has_active_issue)}</td>
                    <td className="px-4 py-3.5 text-slate-500 font-medium">
                      {s.shipped_date_formatted || String(s.shipped_date).slice(0, 10)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-medium">
                      {s.estimated_days || "3 hari kerja"}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-800">
                      {Number(s.actual_weight_kg).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/admin/shipments/${s.resi}/print`}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat / Cetak Resi"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/track/${s.resi}`}
                          target="_blank"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Lacak Publik"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="text-xs text-slate-500">
            Menampilkan{" "}
            <span className="font-bold text-slate-700">
              {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            -{" "}
            <span className="font-bold text-slate-700">
              {Math.min(currentPage * pageSize, totalItems)}
            </span>{" "}
            dari <span className="font-bold text-slate-700">{totalItems}</span> data
          </div>

          <div className="flex items-center gap-1 self-center sm:self-auto">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  currentPage === p
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200/60"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
