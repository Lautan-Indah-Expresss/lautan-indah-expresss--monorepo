import React, { useState, useMemo } from 'react';
import { Shipment, ShipmentStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { exportShipmentsToCsv } from '../../services/exportExcel';
import { generateWhatsAppMessage, openWhatsAppShare } from '../../services/whatsapp';
import { ScrollableDropdown, DropdownOption } from '../../components/ScrollableDropdown';
import {
  Search,
  Filter,
  Download,
  PlusCircle,
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Printer,
  Share2,
  Calendar,
  MapPin,
  ChevronRight,
  Sparkles,
  MessageSquare,
  LayoutGrid,
  Table as TableIcon,
  Package,
} from 'lucide-react';

interface AdminDashboardProps {
  shipments: Shipment[];
  onSelectShipment: (shipmentId: string) => void;
  onCreateNewShipment: () => void;
  onOpenPrintModal: (shipment: Shipment) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  shipments,
  onSelectShipment,
  onCreateNewShipment,
  onOpenPrintModal,
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [driverFilter, setDriverFilter] = useState<string>('ALL');
  const [destinationFilter, setDestinationFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Mobile view mode: 'cards' or 'table'
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // WhatsApp modal state
  const [waModalShipment, setWaModalShipment] = useState<Shipment | null>(null);
  const [waType, setWaType] = useState<'DEPART' | 'ARRIVED' | 'COMPLETED' | 'ISSUE'>('DEPART');
  const [waCopied, setWaCopied] = useState(false);

  // Compute KPI summary
  const stats = useMemo(() => {
    const total = shipments.length;
    const inTransit = shipments.filter((s) => s.status === 'Dalam Perjalanan').length;
    const arrived = shipments.filter((s) => s.status === 'Tiba di Tujuan').length;
    const completed = shipments.filter((s) => s.status === 'Selesai').length;
    const claims = shipments.filter((s) => s.status === 'Selisih/Claim').length;
    const ready = shipments.filter((s) => s.status === 'Siap Muat').length;

    return { total, inTransit, arrived, completed, claims, ready };
  }, [shipments]);

  // Unique options for filters
  const driversList = useMemo(() => {
    return Array.from(new Set(shipments.map((s) => s.driverName))).filter(Boolean);
  }, [shipments]);

  const destinationsList = useMemo(() => {
    return Array.from(new Set(shipments.map((s) => s.destinationCity || s.destination))).filter(Boolean);
  }, [shipments]);

  // Dropdown options with smooth scrolling
  const statusOptions: DropdownOption[] = [
    { value: 'ALL', label: 'Semua Status' },
    {
      value: 'Siap Muat',
      label: 'Siap Muat',
      badge: <span className="w-2 h-2 rounded-full bg-slate-400" />,
    },
    {
      value: 'Dalam Perjalanan',
      label: 'Dalam Perjalanan',
      badge: <span className="w-2 h-2 rounded-full bg-amber-500" />,
    },
    {
      value: 'Tiba di Tujuan',
      label: 'Tiba di Tujuan',
      badge: <span className="w-2 h-2 rounded-full bg-sky-500" />,
    },
    {
      value: 'Selesai',
      label: 'Selesai (Lengkap)',
      badge: <span className="w-2 h-2 rounded-full bg-emerald-500" />,
    },
    {
      value: 'Selisih/Claim',
      label: 'Selisih/Claim (Klaim)',
      badge: <span className="w-2 h-2 rounded-full bg-rose-500" />,
    },
  ];

  const driverOptions: DropdownOption[] = [
    { value: 'ALL', label: 'Semua Driver' },
    ...driversList.map((d) => {
      const count = shipments.filter((s) => s.driverName === d).length;
      return {
        value: d,
        label: d,
        subtext: `${count} Pengiriman aktif/riwayat`,
      };
    }),
  ];

  const destinationOptions: DropdownOption[] = [
    { value: 'ALL', label: 'Semua Kota Tujuan' },
    ...destinationsList.map((city) => {
      const count = shipments.filter((s) => (s.destinationCity || s.destination) === city).length;
      return {
        value: city,
        label: city,
        subtext: `${count} Muatan`,
      };
    }),
  ];

  // Filtered shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        s.plateNumber.toLowerCase().includes(q) ||
        s.driverName.toLowerCase().includes(q) ||
        s.sjNumber.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q) ||
        s.destinationCity.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
      const matchDriver = driverFilter === 'ALL' || s.driverName === driverFilter;
      const matchDest =
        destinationFilter === 'ALL' ||
        s.destinationCity === destinationFilter ||
        s.destination === destinationFilter;
      const matchDate = !dateFilter || s.date === dateFilter;

      return matchSearch && matchStatus && matchDriver && matchDest && matchDate;
    });
  }, [shipments, searchTerm, statusFilter, driverFilter, destinationFilter, dateFilter]);

  const handleExportCsv = () => {
    exportShipmentsToCsv(filteredShipments);
  };

  const handleOpenWaModal = (shipment: Shipment) => {
    setWaModalShipment(shipment);
    if (shipment.status === 'Selesai') setWaType('COMPLETED');
    else if (shipment.status === 'Tiba di Tujuan') setWaType('ARRIVED');
    else if (shipment.status === 'Selisih/Claim') setWaType('ISSUE');
    else setWaType('DEPART');
    setWaCopied(false);
  };

  const currentWaText = waModalShipment ? generateWhatsAppMessage(waModalShipment, waType) : '';

  const handleCopyWaText = () => {
    if (!currentWaText) return;
    navigator.clipboard.writeText(currentWaText);
    setWaCopied(true);
    setTimeout(() => setWaCopied(false), 2500);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Dashboard Master Monitoring Armada</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Monitoring real-time muat, perjalanan sopir (GPS Watermark), dan serah terima koli PT LAUTAN INDAH Express.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden xs:inline">Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onCreateNewShipment}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow-sm shadow-teal-700/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat Pengiriman</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Responsive grid with compact padding on mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* Total Hari Ini */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-semibold">
            <span>Total Armada</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-[10px] sm:text-[11px] text-slate-400">Unit</span>
          </div>
          <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
            {stats.ready} Siap Muat
          </div>
        </div>

        {/* Dalam Perjalanan */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-800 text-[11px] sm:text-xs font-semibold">
            <span>Perjalanan</span>
            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-amber-700">{stats.inTransit}</span>
            <span className="text-[10px] sm:text-[11px] text-amber-600">Unit</span>
          </div>
          <div className="mt-0.5 text-[10px] sm:text-[11px] text-amber-700 font-medium truncate">
            Lintas Tol / Jalur
          </div>
        </div>

        {/* Tiba di Tujuan */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-sky-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-sky-800 text-[11px] sm:text-xs font-semibold">
            <span>Tiba Tujuan</span>
            <MapPin className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-sky-700">{stats.arrived}</span>
            <span className="text-[10px] sm:text-[11px] text-sky-600">Unit</span>
          </div>
          <div className="mt-0.5 text-[10px] sm:text-[11px] text-sky-700 font-medium truncate">
            Di Loading Dock
          </div>
        </div>

        {/* Selesai */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-emerald-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 text-[11px] sm:text-xs font-semibold">
            <span>Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-700">{stats.completed}</span>
            <span className="text-[10px] sm:text-[11px] text-emerald-600">Selesai</span>
          </div>
          <div className="mt-0.5 text-[10px] sm:text-[11px] text-emerald-700 font-medium truncate">
            Lengkap Sesuai
          </div>
        </div>

        {/* Selisih / Claim */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-rose-200 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-rose-800 text-[11px] sm:text-xs font-semibold">
            <span>Selisih / Claim</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-rose-700">{stats.claims}</span>
            <span className="text-[10px] sm:text-[11px] text-rose-600">Kasus</span>
          </div>
          <div className="mt-0.5 text-[10px] sm:text-[11px] text-rose-700 font-medium truncate">
            Ada Berita Acara
          </div>
        </div>
      </div>

      {/* Filter and Search Bar with Smooth Scrollable Dropdowns */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Plat, Driver, SJ, atau Kota..."
              className="block w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50/50"
            />
          </div>

          {/* Status Scrollable Dropdown */}
          <div>
            <ScrollableDropdown
              value={statusFilter}
              options={statusOptions}
              onChange={(val) => setStatusFilter(val)}
              placeholder="Filter Status"
              maxHeight="max-h-56"
            />
          </div>

          {/* Driver Scrollable Dropdown with Search */}
          <div>
            <ScrollableDropdown
              value={driverFilter}
              options={driverOptions}
              onChange={(val) => setDriverFilter(val)}
              placeholder="Filter Driver"
              searchable={true}
              searchPlaceholder="Ketik nama driver..."
              maxHeight="max-h-48"
            />
          </div>

          {/* Destination Scrollable Dropdown with Search */}
          <div>
            <ScrollableDropdown
              value={destinationFilter}
              options={destinationOptions}
              onChange={(val) => setDestinationFilter(val)}
              placeholder="Kota Tujuan"
              searchable={true}
              searchPlaceholder="Ketik kota..."
              maxHeight="max-h-48"
            />
          </div>
        </div>

        {/* Date Filter & Clear row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Filter Tanggal:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="py-1 px-2.5 text-xs rounded-lg border border-slate-300 bg-slate-50/60 text-slate-700"
            />
          </div>

          {(searchTerm || statusFilter !== 'ALL' || driverFilter !== 'ALL' || destinationFilter !== 'ALL' || dateFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setDriverFilter('ALL');
                setDestinationFilter('ALL');
                setDateFilter('');
              }}
              className="text-teal-700 hover:text-teal-900 font-bold text-[11px] underline cursor-pointer"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      </div>

      {/* VIEW SWITCHER & TABLE / CARDS CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table/Cards Header Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">
              Master Monitoring Pengiriman &amp; Pengecekan Barang
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] sm:text-[11px] font-bold text-slate-600">
              {filteredShipments.length} Data
            </span>
          </div>

          {/* Mobile Display Toggle Button */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-md flex items-center gap-1 transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel Master"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-md flex items-center gap-1 transition-all ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Kartu Mobile"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kartu</span>
            </button>
          </div>
        </div>

        {/* 1. MOBILE-FRIENDLY CARDS VIEW (Clean, touch-friendly, doesn't overflow mobile viewport) */}
        {viewMode === 'cards' ? (
          <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredShipments.length === 0 ? (
              <div className="col-span-2 p-10 text-center text-slate-400 text-xs">
                Tidak ada data pengiriman yang cocok dengan filter.
              </div>
            ) : (
              filteredShipments.map((s) => (
                <div
                  key={s.id}
                  className="bg-slate-50/70 hover:bg-white rounded-xl border border-slate-200 p-3.5 space-y-2.5 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-black text-teal-800">{s.sjNumber}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-bold text-xs bg-amber-100 text-blue-950 px-2 py-0.5 rounded border border-amber-300">
                          {s.plateNumber}
                        </span>
                        <span className="font-bold text-slate-800 text-xs">{s.driverName}</span>
                      </div>
                    </div>
                    <StatusBadge status={s.status} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Tujuan</span>
                      <span className="font-bold text-slate-800 truncate block">{s.destinationCity}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Muat / Terima</span>
                      <span className="font-bold text-teal-800">
                        {s.totalQtyLoaded} / {s.totalQtyReceived ?? '-'} Koli
                      </span>
                    </div>
                    <div className="col-span-2 text-slate-500 flex items-center justify-between text-[10px]">
                      <span>Jam Berangkat: {s.departedAt || s.loadedAt || '-'}</span>
                      <span className="font-medium text-slate-600">{s.date}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => onSelectShipment(s.id)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-teal-600" />
                      <span>Detail</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenPrintModal(s)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span>Cetak</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenWaModal(s)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WA</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* 2. FULL MASTER TABLE VIEW (With smooth touch scrolling on mobile) */
          <div className="overflow-x-auto custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <th className="p-3 text-center w-12">No</th>
                  <th className="p-3 whitespace-nowrap">Tanggal</th>
                  <th className="p-3 whitespace-nowrap">No. Polisi</th>
                  <th className="p-3 whitespace-nowrap">Nama Driver</th>
                  <th className="p-3 whitespace-nowrap">No. Surat Jalan</th>
                  <th className="p-3 whitespace-nowrap">Tujuan</th>
                  <th className="p-3 text-center whitespace-nowrap">Qty Muat</th>
                  <th className="p-3 whitespace-nowrap">Jam Berangkat</th>
                  <th className="p-3 whitespace-nowrap">Status Armada</th>
                  <th className="p-3 text-center whitespace-nowrap">Qty Diterima</th>
                  <th className="p-3 whitespace-nowrap">Kondisi Barang</th>
                  <th className="p-3 text-center whitespace-nowrap">Status Selesai</th>
                  <th className="p-3 whitespace-nowrap min-w-[160px]">Catatan / Kendala</th>
                  <th className="p-3 text-center sticky right-0 bg-slate-50/95 shadow-xs w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="p-10 text-center text-slate-400">
                      Tidak ada data pengiriman yang cocok dengan kriteria pencarian/filter.
                    </td>
                  </tr>
                ) : (
                  filteredShipments.map((shipment, index) => {
                    const isDone = shipment.status === 'Selesai';
                    const isClaim = shipment.status === 'Selisih/Claim';

                    return (
                      <tr
                        key={shipment.id}
                        className="hover:bg-teal-50/30 transition-colors group"
                      >
                        {/* No */}
                        <td className="p-3 text-center font-semibold text-slate-500">
                          {index + 1}
                        </td>

                        {/* Tanggal */}
                        <td className="p-3 font-medium text-slate-700 whitespace-nowrap">
                          {shipment.date}
                        </td>

                        {/* No. Polisi */}
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-blue-950 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300 text-xs">
                            {shipment.plateNumber}
                          </span>
                        </td>

                        {/* Nama Driver */}
                        <td className="p-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{shipment.driverName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{shipment.driverPhone}</div>
                        </td>

                        {/* No. Surat Jalan */}
                        <td className="p-3 whitespace-nowrap">
                          <button
                            onClick={() => onSelectShipment(shipment.id)}
                            className="font-mono font-extrabold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                          >
                            {shipment.sjNumber}
                          </button>
                        </td>

                        {/* Tujuan */}
                        <td className="p-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{shipment.destinationCity}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                            {shipment.destination}
                          </div>
                        </td>

                        {/* Qty Muat */}
                        <td className="p-3 text-center font-bold text-slate-900 whitespace-nowrap">
                          {shipment.totalQtyLoaded} Koli
                        </td>

                        {/* Jam Berangkat */}
                        <td className="p-3 whitespace-nowrap text-slate-700">
                          {shipment.departedAt ? (
                            <span className="font-medium">{shipment.departedAt}</span>
                          ) : (
                            <span className="text-slate-400 italic">Belum berangkat</span>
                          )}
                        </td>

                        {/* Status Armada */}
                        <td className="p-3 whitespace-nowrap">
                          <StatusBadge status={shipment.status} />
                        </td>

                        {/* Qty Diterima */}
                        <td className="p-3 text-center whitespace-nowrap">
                          {shipment.totalQtyReceived !== undefined ? (
                            <span
                              className={`font-bold ${
                                shipment.totalQtyReceived < shipment.totalQtyLoaded
                                  ? 'text-rose-600'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {shipment.totalQtyReceived} Koli
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Kondisi Barang */}
                        <td className="p-3 whitespace-nowrap">
                          {shipment.cargoConditionSummary ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                shipment.cargoConditionSummary === 'Bagus'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : shipment.cargoConditionSummary === 'Ada Rusak'
                                  ? 'bg-rose-100 text-rose-800'
                                  : shipment.cargoConditionSummary === 'Ada Selisih'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {shipment.cargoConditionSummary}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Status Selesai */}
                        <td className="p-3 text-center whitespace-nowrap">
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3" />
                              SELESAI
                            </span>
                          ) : isClaim ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-md">
                              <AlertTriangle className="w-3 h-3" />
                              KLAIM
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] font-medium">Proses</span>
                          )}
                        </td>

                        {/* Catatan / Kendala */}
                        <td className="p-3 text-[11px] text-slate-600 max-w-[200px]">
                          {shipment.claimReport ? (
                            <span className="text-rose-700 font-semibold truncate block" title={shipment.claimReport.description}>
                              [BA {shipment.claimReport.baNumber}] {shipment.claimReport.description}
                            </span>
                          ) : (
                            <span className="truncate block" title={shipment.notes}>
                              {shipment.notes || '-'}
                            </span>
                          )}
                        </td>

                        {/* Aksi Sticky */}
                        <td className="p-3 text-center sticky right-0 bg-white group-hover:bg-slate-50 transition-colors shadow-xs">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onSelectShipment(shipment.id)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                              title="Lihat Detail & Perbandingan Barang"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onOpenPrintModal(shipment)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Cetak Form SOP / Surat Jalan"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenWaModal(shipment)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Template Pesan WhatsApp Otomatis"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WHATSAPP TEMPLATE MODAL */}
      {waModalShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="text-sm font-bold">Template Pesan WhatsApp Operasional</h3>
                  <p className="text-[11px] text-emerald-200">
                    [{waModalShipment.plateNumber}] [{waModalShipment.driverName}] [{waModalShipment.sjNumber}]
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWaModalShipment(null)}
                className="text-emerald-200 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
              {/* Type selector */}
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setWaType('DEPART')}
                  className={`flex-1 min-w-[70px] py-1.5 rounded-lg transition-all ${
                    waType === 'DEPART' ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-600'
                  }`}
                >
                  DEPART
                </button>
                <button
                  type="button"
                  onClick={() => setWaType('ARRIVED')}
                  className={`flex-1 min-w-[70px] py-1.5 rounded-lg transition-all ${
                    waType === 'ARRIVED' ? 'bg-sky-600 text-white font-bold shadow-xs' : 'text-slate-600'
                  }`}
                >
                  ARRIVED
                </button>
                <button
                  type="button"
                  onClick={() => setWaType('COMPLETED')}
                  className={`flex-1 min-w-[80px] py-1.5 rounded-lg transition-all ${
                    waType === 'COMPLETED' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-600'
                  }`}
                >
                  COMPLETED
                </button>
                <button
                  type="button"
                  onClick={() => setWaType('ISSUE')}
                  className={`flex-1 min-w-[80px] py-1.5 rounded-lg transition-all ${
                    waType === 'ISSUE' ? 'bg-rose-600 text-white font-bold shadow-xs' : 'text-slate-600'
                  }`}
                >
                  KLAIM
                </button>
              </div>

              {/* Message Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Isi Pesan Siap Kirim (Sesuai SOP):
                </label>
                <textarea
                  readOnly
                  rows={7}
                  value={currentWaText}
                  className="w-full text-xs font-mono p-3 bg-slate-50 rounded-xl border border-slate-300 text-slate-800 leading-relaxed resize-none focus:outline-teal-500"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyWaText}
                  className="w-full sm:flex-1 py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {waCopied ? (
                    <span className="text-emerald-700 font-bold">✓ Berhasil Disalin!</span>
                  ) : (
                    <span>Salin Pesan ke Clipboard</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => openWhatsAppShare(currentWaText, waModalShipment.driverPhone)}
                  className="w-full sm:flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Kirim ke WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
