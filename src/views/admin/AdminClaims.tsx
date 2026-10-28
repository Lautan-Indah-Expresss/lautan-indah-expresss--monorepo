import React, { useState } from 'react';
import { Shipment, ClaimReport } from '../../types';
import { StorageService } from '../../services/storage';
import { StatusBadge } from '../../components/StatusBadge';
import {
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  Eye,
  PlusCircle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';

interface AdminClaimsProps {
  shipments: Shipment[];
  onSelectShipment: (id: string) => void;
}

export const AdminClaims: React.FC<AdminClaimsProps> = ({
  shipments,
  onSelectShipment,
}) => {
  const claimShipments = shipments.filter(
    (s) => s.status === 'Selisih/Claim' || s.claimReport
  );

  const [activeTab, setActiveTab] = useState<'all' | 'investigasi' | 'selesai'>('all');
  const [selectedClaimShipment, setSelectedClaimShipment] = useState<Shipment | null>(null);
  const [newStatus, setNewStatus] = useState<ClaimReport['status']>('Proses Investigasi');
  const [newNotes, setNewNotes] = useState('');

  const filtered = claimShipments.filter((s) => {
    if (!s.claimReport) return false;
    if (activeTab === 'investigasi') {
      return s.claimReport.status === 'Menunggu Investigasi' || s.claimReport.status === 'Proses Investigasi';
    }
    if (activeTab === 'selesai') {
      return s.claimReport.status === 'Selesai Diganti' || s.claimReport.status === 'Ditolak';
    }
    return true;
  });

  const handleSaveResolution = () => {
    if (!selectedClaimShipment || !selectedClaimShipment.claimReport) return;

    const updated: ClaimReport = {
      ...selectedClaimShipment.claimReport,
      status: newStatus,
      resolutionNotes: newNotes,
      resolvedAt: newStatus === 'Selesai Diganti' ? new Date().toISOString() : undefined,
    };

    StorageService.updateClaimReport(selectedClaimShipment.id, updated);
    setSelectedClaimShipment(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
            <span>Penanganan Selisih &amp; Berita Acara Klaim</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Daftar otomatis klaim koli hilang, selisih jumlah muatan, dan barang rusak beserta penerbitan Berita Acara.
          </p>
        </div>

        <div className="flex gap-1.5 p-1 bg-white rounded-xl border border-slate-200 text-xs font-semibold shadow-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'all' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({claimShipments.length})
          </button>
          <button
            onClick={() => setActiveTab('investigasi')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'investigasi' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Investigasi ({claimShipments.filter((s) => s.claimReport?.status.includes('Investigasi')).length})
          </button>
          <button
            onClick={() => setActiveTab('selesai')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'selesai' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Selesai / Diganti
          </button>
        </div>
      </div>

      {/* Claims List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada kasus klaim atau selisih barang aktif.</p>
            <p className="text-xs text-slate-400 mt-0.5">Seluruh pengiriman barang tiba dalam kondisi lengkap dan bagus.</p>
          </div>
        ) : (
          filtered.map((shipment) => {
            const report = shipment.claimReport!;
            const isResolved = report.status === 'Selesai Diganti';

            return (
              <div
                key={shipment.id}
                className="bg-white rounded-2xl border-2 border-rose-200/90 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-rose-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-black text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {report.baNumber}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 mt-1">
                        Surat Jalan: {shipment.sjNumber} • {shipment.plateNumber}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Driver: {shipment.driverName} • Tujuan: {shipment.destinationCity}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800'
                          : report.status === 'Proses Investigasi'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                    <strong>Kronologi Lapangan:</strong> {report.description}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-rose-50/70 border border-rose-100">
                      <span className="text-[10px] text-rose-600 block uppercase font-semibold">Estimasi Kerugian</span>
                      <span className="font-bold text-rose-900 text-sm">
                        Rp {report.estimatedLoss.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Muat vs Terima</span>
                      <span className="font-bold text-slate-800">
                        {shipment.totalQtyLoaded} Koli ➔ {shipment.totalQtyReceived ?? '-'} Koli
                      </span>
                    </div>
                  </div>

                  {report.resolutionNotes && (
                    <div className="mt-2.5 text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      <strong>Hasil / Tindak Lanjut:</strong> {report.resolutionNotes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onSelectShipment(shipment.id)}
                    className="flex-1 py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Bukti Foto &amp; Barang</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClaimShipment(shipment);
                      setNewStatus(report.status);
                      setNewNotes(report.resolutionNotes || '');
                    }}
                    className="py-2 px-3 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    Update Klaim
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolution Modal */}
      {selectedClaimShipment && selectedClaimShipment.claimReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Penyelesaian Berita Acara {selectedClaimShipment.claimReport.baNumber}
              </h3>
              <button
                onClick={() => setSelectedClaimShipment(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Status Investigasi Klaim
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                >
                  <option value="Menunggu Investigasi">Menunggu Investigasi</option>
                  <option value="Proses Investigasi">Proses Investigasi (Cek Bukti)</option>
                  <option value="Selesai Diganti">Selesai Diganti (Ganti Rugi Tuntas)</option>
                  <option value="Ditolak">Ditolak (Bukan Tanggung Jawab Ekspedisi)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Tindak Lanjut / No. Transfer Ganti Rugi
                </label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Contoh: Diganti pihak ekspedisi via transfer BCA / Diklaim asuransi"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedClaimShipment(null)}
                className="px-4 py-2 border rounded-xl text-xs text-slate-600"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveResolution}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl text-xs"
              >
                Simpan Penyelesaian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
