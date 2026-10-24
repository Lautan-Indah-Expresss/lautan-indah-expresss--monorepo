import React, { useState, useMemo } from 'react';
import { Shipment, User, AppNotification } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { ReceiverUnloadingModal } from './ReceiverUnloadingModal';
import {
  Search,
  Truck,
  MapPin,
  Clock,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Bell,
  Calendar,
  Box,
} from 'lucide-react';

interface ReceiverDashboardProps {
  user: User;
  shipments: Shipment[];
  notifications: AppNotification[];
  onOpenPrintModal: (shipment: Shipment) => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const ReceiverDashboard: React.FC<ReceiverDashboardProps> = ({
  user,
  shipments,
  notifications,
  onOpenPrintModal,
  activeTab,
  onSelectTab,
}) => {
  // Mobile Tab: 'incoming' | 'tracking' | 'notifications'
  const [internalTab, setInternalTab] = useState<'incoming' | 'tracking' | 'notifications'>('incoming');
  const mobileTab = (activeTab as any) || internalTab;
  const setMobileTab = (tab: any) => {
    setInternalTab(tab);
    if (onSelectTab) onSelectTab(tab);
  };

  // Filter state for incoming shipments
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Dalam Perjalanan' | 'Tiba di Tujuan' | 'Selesai'>('ALL');

  // Search state for Cek Resi / SJ
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Unloading Modal state
  const [unloadingShipment, setUnloadingShipment] = useState<Shipment | null>(null);

  // Filter incoming shipments relevant to receiver or all
  const incomingShipments = useMemo(() => {
    return shipments.filter((s) => {
      if (statusFilter === 'ALL') return true;
      return s.status === statusFilter;
    });
  }, [shipments, statusFilter]);

  // Search Results for Cek Resi / Pelacakan
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    return shipments.filter(
      (s) =>
        s.sjNumber.toLowerCase().includes(q) ||
        s.plateNumber.toLowerCase().includes(q) ||
        s.driverName.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q)
    );
  }, [shipments, searchQuery]);

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20 px-3 sm:px-0">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-blue-950 text-white p-4 rounded-2xl shadow-md border border-teal-700/40">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Portal Penerima &amp; Gudang</span>
            </div>
            <h1 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
              {user.name}
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Verifikasi bongkar koli, cek Surat Jalan &amp; tanda tangan digital penerima.
            </p>
          </div>

          <div className="bg-teal-500/20 border border-teal-400/30 p-2.5 rounded-xl text-center shrink-0">
            <span className="block text-lg font-black text-amber-300">
              {incomingShipments.filter((s) => s.status === 'Tiba di Tujuan').length}
            </span>
            <span className="text-[10px] text-teal-200 uppercase font-semibold">Siap Bongkar</span>
          </div>
        </div>

        {/* Quick Tabs in Mobile Header */}
        <div className="grid grid-cols-3 gap-1 mt-4 p-1 bg-white/10 rounded-xl text-xs font-bold">
          <button
            onClick={() => setMobileTab('incoming')}
            className={`py-2 rounded-lg transition-all text-center ${
              mobileTab === 'incoming' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-200 hover:text-white'
            }`}
          >
            Kiriman Masuk
          </button>
          <button
            onClick={() => setMobileTab('tracking')}
            className={`py-2 rounded-lg transition-all text-center ${
              mobileTab === 'tracking' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-200 hover:text-white'
            }`}
          >
            Cek Resi / SJ
          </button>
          <button
            onClick={() => setMobileTab('notifications')}
            className={`py-2 rounded-lg transition-all text-center relative ${
              mobileTab === 'notifications' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-200 hover:text-white'
            }`}
          >
            Notifikasi
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="ml-1 inline-block w-2 h-2 rounded-full bg-rose-500"></span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: KIRIMAN MASUK (INCOMING) */}
      {mobileTab === 'incoming' && (
        <div className="space-y-3">
          {/* Status Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Semua Status
            </button>
            <button
              onClick={() => setStatusFilter('Dalam Perjalanan')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                statusFilter === 'Dalam Perjalanan'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Dalam Perjalanan
            </button>
            <button
              onClick={() => setStatusFilter('Tiba di Tujuan')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                statusFilter === 'Tiba di Tujuan'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Sudah Tiba
            </button>
            <button
              onClick={() => setStatusFilter('Selesai')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                statusFilter === 'Selesai'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Selesai
            </button>
          </div>

          {/* Shipment List */}
          <div className="space-y-3">
            {incomingShipments.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                <Truck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium">Tidak ada pengiriman dalam kategori ini.</p>
              </div>
            ) : (
              incomingShipments.map((s) => {
                const canUnload = s.status === 'Tiba di Tujuan' || s.status === 'Dalam Perjalanan';
                const isFinished = s.status === 'Selesai';
                const isClaim = s.status === 'Selisih/Claim';

                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 hover:border-teal-500/50 transition-all"
                  >
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-black text-teal-800">
                          {s.sjNumber}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold text-blue-950 bg-amber-100 px-2 py-0.5 rounded text-xs">
                            {s.plateNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {s.driverName}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={s.status} size="sm" />
                    </div>

                    {/* Destination & Meta */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-medium">Tujuan</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {s.destinationCity}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Muatan</span>
                        <span className="font-bold text-teal-800">
                          {s.totalQtyLoaded} Koli
                        </span>
                      </div>
                      <div className="col-span-2 text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Berangkat: {s.departedAt || s.loadedAt || '-'}</span>
                      </div>
                    </div>

                    {/* Items preview */}
                    <div className="text-[11px] text-slate-600 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Daftar Barang:</span>
                      {s.items.slice(0, 2).map((it) => (
                        <div key={it.id} className="flex justify-between">
                          <span className="truncate max-w-[200px]">• {it.name}</span>
                          <span className="font-semibold text-slate-700">{it.qtyLoaded} koli</span>
                        </div>
                      ))}
                      {s.items.length > 2 && (
                        <div className="text-[10px] text-teal-700 italic">
                          +{s.items.length - 2} barang lainnya...
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => onOpenPrintModal(s)}
                        className="py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Surat Jalan
                      </button>

                      {canUnload ? (
                        <button
                          type="button"
                          onClick={() => setUnloadingShipment(s)}
                          className="flex-1 py-2 px-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-teal-700/20"
                        >
                          <PackageCheck className="w-4 h-4" />
                          <span>Form Bongkar / Terima</span>
                        </button>
                      ) : (
                        <div className="flex-1 text-right text-xs font-semibold text-slate-500 py-1">
                          {isFinished && <span className="text-emerald-700 font-bold">✓ Barang Diterima Lengkap</span>}
                          {isClaim && <span className="text-rose-600 font-bold">⚠️ Ada Selisih/Klaim</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CEK RESI / PELACAKAN */}
      {mobileTab === 'tracking' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Pelacakan Pengiriman (Cek Resi / Surat Jalan)
            </h2>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHasSearched(true);
                }}
                placeholder="Ketik No. Surat Jalan (SJ-001) / No. Polisi / Driver..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSearchQuery('SJ-001')}
                className="text-[11px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md text-slate-600 font-mono"
              >
                Coba SJ-001
              </button>
              <button
                type="button"
                onClick={() => setSearchQuery('B 9283 UXZ')}
                className="text-[11px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md text-slate-600 font-mono"
              >
                Coba Plat B 9283 UXZ
              </button>
            </div>
          </div>

          {/* Search Results Display */}
          <div className="space-y-3">
            {searchQuery && searchResults.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                Tidak ditemukan pengiriman dengan kata kunci "{searchQuery}".
              </div>
            ) : (
              searchResults.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-black text-teal-800">{s.sjNumber}</span>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {s.plateNumber} • {s.driverName}
                      </h3>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>

                  {/* Route & Progress */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-900">{s.destination}</span>
                        <div className="text-[11px] text-slate-500">{s.destinationAddress}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Jam Berangkat: {s.departedAt || s.loadedAt || '-'}</span>
                    </div>
                  </div>

                  {/* Timeline status list */}
                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                    <span className="font-bold text-slate-700 block text-[11px] uppercase">
                      Riwayat Posisi &amp; Log Perjalanan:
                    </span>
                    {s.logs.slice(0, 3).map((log) => (
                      <div key={log.id} className="p-2 rounded-lg bg-slate-50 text-[11px] text-slate-600 space-y-0.5">
                        <div className="flex justify-between font-semibold text-slate-800">
                          <span>{log.location}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                        </div>
                        <p>{log.notes}</p>
                      </div>
                    ))}
                  </div>

                  {/* Cargo Items */}
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-slate-700 block text-[11px] uppercase">
                      Muatan ({s.totalQtyLoaded} Koli):
                    </span>
                    {s.items.map((it) => (
                      <div key={it.id} className="flex justify-between py-1 border-b border-slate-100 text-[11px]">
                        <span>{it.name}</span>
                        <span className="font-bold text-slate-800">{it.qtyLoaded} Koli</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: NOTIFIKASI */}
      {mobileTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-teal-600" />
              Notifikasi Pengiriman Masuk
            </h2>
            <span className="text-[11px] text-slate-500">Otomatis update saat armada jalan</span>
          </div>

          <div className="space-y-2.5">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">Belum ada notifikasi</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{notif.title}</span>
                    <span className="text-[10px] text-slate-400">{notif.timestamp}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* UNLOADING MODAL */}
      {unloadingShipment && (
        <ReceiverUnloadingModal
          isOpen={true}
          onClose={() => setUnloadingShipment(null)}
          shipment={unloadingShipment}
          receiverName={user.name}
          onSuccess={(updated) => {
            setUnloadingShipment(null);
          }}
        />
      )}
    </div>
  );
};
