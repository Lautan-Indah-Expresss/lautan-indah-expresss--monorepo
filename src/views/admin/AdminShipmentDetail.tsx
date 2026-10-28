import React, { useState } from 'react';
import { Shipment, ClaimReport } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { StorageService } from '../../services/storage';
import { generateWhatsAppMessage, openWhatsAppShare } from '../../services/whatsapp';
import {
  ArrowLeft,
  Printer,
  Share2,
  Clock,
  MapPin,
  Truck,
  User,
  Package,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Calendar,
  ShieldCheck,
  ExternalLink,
  Camera,
  Check,
  Building2,
} from 'lucide-react';

interface AdminShipmentDetailProps {
  shipment: Shipment;
  onBack: () => void;
  onOpenPrintModal: (shipment: Shipment) => void;
}

export const AdminShipmentDetail: React.FC<AdminShipmentDetailProps> = ({
  shipment,
  onBack,
  onOpenPrintModal,
}) => {
  // Claim editing state
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimStatus, setClaimStatus] = useState<ClaimReport['status']>(
    shipment.claimReport?.status || 'Menunggu Investigasi'
  );
  const [resolutionNotes, setResolutionNotes] = useState(
    shipment.claimReport?.resolutionNotes || ''
  );

  // Fullscreen photo modal
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const handleUpdateClaim = () => {
    if (!shipment.claimReport) return;

    const updated: ClaimReport = {
      ...shipment.claimReport,
      status: claimStatus,
      resolutionNotes,
      resolvedAt: claimStatus === 'Selesai Diganti' ? new Date().toISOString() : undefined,
    };

    StorageService.updateClaimReport(shipment.id, updated);
    setShowClaimForm(false);
  };

  const handleShareWhatsApp = (type: 'DEPART' | 'ARRIVED' | 'COMPLETED' | 'ISSUE') => {
    const text = generateWhatsAppMessage(shipment, type);
    openWhatsAppShare(text, shipment.driverPhone);
  };

  const isSelisih = shipment.status === 'Selisih/Claim';
  const totalReceived = shipment.totalQtyReceived ?? 0;
  const discrepancyTotal = totalReceived - shipment.totalQtyLoaded;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-14">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Detail Pengiriman: {shipment.sjNumber}
              </h1>
              <StatusBadge status={shipment.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Armada: <span className="font-bold text-slate-700">{shipment.plateNumber}</span> • Driver: <span className="font-bold text-slate-700">{shipment.driverName}</span> • Tujuan: <span className="font-bold text-slate-700">{shipment.destinationCity}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* WhatsApp share */}
          <button
            type="button"
            onClick={() => handleShareWhatsApp(isSelisih ? 'ISSUE' : 'DEPART')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Kirim WhatsApp</span>
          </button>

          {/* Cetak PDF */}
          <button
            type="button"
            onClick={() => onOpenPrintModal(shipment)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Form SOP / SJ</span>
          </button>
        </div>
      </div>

      {/* BERITA ACARA KLAIM BANNER JIKA ADA KLAIM */}
      {shipment.claimReport && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="text-sm font-bold text-rose-950">
                  BERITA ACARA KLAIM: {shipment.claimReport.baNumber}
                </h3>
                <p className="text-xs text-rose-800">
                  Tanggal Lapor: {shipment.claimReport.date} • Estimasi Kerugian: Rp{' '}
                  {shipment.claimReport.estimatedLoss.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-200 text-rose-900">
                {shipment.claimReport.status}
              </span>
              <button
                type="button"
                onClick={() => setShowClaimForm(!showClaimForm)}
                className="px-3 py-1 bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 rounded-lg text-xs font-bold transition-colors"
              >
                {showClaimForm ? 'Tutup Form' : 'Update Status Klaim'}
              </button>
            </div>
          </div>

          <p className="text-xs text-rose-900 leading-relaxed">
            <strong>Kronologi:</strong> {shipment.claimReport.description}
          </p>

          {shipment.claimReport.resolutionNotes && (
            <p className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-lg border border-rose-200">
              <strong>Catatan Resolusi / Asuransi:</strong> {shipment.claimReport.resolutionNotes}
            </p>
          )}

          {/* Form Update Klaim */}
          {showClaimForm && (
            <div className="p-4 bg-white rounded-xl border border-rose-200 space-y-3 text-xs">
              <div className="font-bold text-slate-800">Perbarui Status Investigasi &amp; Ganti Rugi:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Status Klaim
                  </label>
                  <select
                    value={claimStatus}
                    onChange={(e) => setClaimStatus(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Menunggu Investigasi">Menunggu Investigasi</option>
                    <option value="Proses Investigasi">Proses Investigasi</option>
                    <option value="Selesai Diganti">Selesai Diganti (Ganti Rugi Tuntas)</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Catatan Penyelesaian
                  </label>
                  <input
                    type="text"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Contoh: Diganti pihak ekspedisi via transfer BCA / Diklaim asuransi"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleUpdateClaim}
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-xs shadow-xs"
              >
                Simpan Update Klaim
              </button>
            </div>
          )}
        </div>
      )}

      {/* STATUS TIMELINE PIPELINE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          Pipeline Status Pengiriman
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* Step 1: Muat */}
          <div
            className={`p-3 rounded-xl border flex flex-col justify-between ${
              shipment.loadedAt
                ? 'bg-teal-50/70 border-teal-300 text-teal-950'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div>
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                1. Muat Gudang Asal
              </div>
              <div className="text-[11px] mt-1 text-slate-600">
                Checker: {shipment.checkerName}
              </div>
            </div>
            <div className="text-[10px] font-mono text-teal-800 font-semibold mt-2">
              {shipment.date} {shipment.loadedAt}
            </div>
          </div>

          {/* Step 2: Check In Berangkat */}
          <div
            className={`p-3 rounded-xl border flex flex-col justify-between ${
              shipment.attendance.checkIn
                ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div>
              <div className="font-bold flex items-center gap-1.5">
                {shipment.attendance.checkIn ? (
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                2. Check In Berangkat
              </div>
              <div className="text-[11px] mt-1 text-slate-600 truncate" title={shipment.attendance.checkIn?.locationName}>
                {shipment.attendance.checkIn ? shipment.attendance.checkIn.locationName : 'Menunggu Check In Sopir'}
              </div>
            </div>
            <div className="text-[10px] font-mono text-amber-800 font-semibold mt-2">
              {shipment.departedAt || '-'}
            </div>
          </div>

          {/* Step 3: Check Out Tiba */}
          <div
            className={`p-3 rounded-xl border flex flex-col justify-between ${
              shipment.attendance.checkOut
                ? 'bg-sky-50/70 border-sky-300 text-sky-950'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div>
              <div className="font-bold flex items-center gap-1.5">
                {shipment.attendance.checkOut ? (
                  <CheckCircle2 className="w-4 h-4 text-sky-600" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                3. Tiba di Tujuan
              </div>
              <div className="text-[11px] mt-1 text-slate-600 truncate" title={shipment.attendance.checkOut?.locationName}>
                {shipment.attendance.checkOut ? shipment.attendance.checkOut.locationName : 'Belum Tiba'}
              </div>
            </div>
            <div className="text-[10px] font-mono text-sky-800 font-semibold mt-2">
              {shipment.arrivedAt || '-'}
            </div>
          </div>

          {/* Step 4: Serah Terima */}
          <div
            className={`p-3 rounded-xl border flex flex-col justify-between ${
              shipment.status === 'Selesai'
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : shipment.status === 'Selisih/Claim'
                ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div>
              <div className="font-bold flex items-center gap-1.5">
                {shipment.status === 'Selesai' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : shipment.status === 'Selisih/Claim' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                4. Bongkar / Serah Terima
              </div>
              <div className="text-[11px] mt-1 text-slate-600">
                Penerima: {shipment.recipientName}
              </div>
            </div>
            <div className="text-[10px] font-mono font-semibold mt-2">
              {shipment.completedAt || '-'}
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL PERBANDINGAN BARANG: MUAT VS TERIMA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-teal-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Perbandingan Detail Barang (Muat vs Terima)
            </h2>
          </div>
          <div className="text-xs font-bold">
            Total Muat: <span className="text-slate-900">{shipment.totalQtyLoaded} Koli</span> | Diterima: <span className={isSelisih ? 'text-rose-600' : 'text-emerald-700'}>{shipment.totalQtyReceived ?? '-'} Koli</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-200">
                <th className="p-3 w-10 text-center">No</th>
                <th className="p-3 w-28">Kode</th>
                <th className="p-3">Nama Barang</th>
                <th className="p-3 text-center w-24">Qty Muat</th>
                <th className="p-3 text-center w-28">Kondisi Muat</th>
                <th className="p-3 text-center w-24">Qty Terima</th>
                <th className="p-3 text-center w-28">Kondisi Terima</th>
                <th className="p-3 text-center w-24">Selisih Koli</th>
                <th className="p-3">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shipment.items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                  <td className="p-3 font-mono text-[11px] text-slate-700">{item.code}</td>
                  <td className="p-3 font-semibold text-slate-900">{item.name}</td>
                  <td className="p-3 text-center font-bold text-slate-900">{item.qtyLoaded}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {item.conditionLoaded}
                    </span>
                  </td>
                  <td className="p-3 text-center font-bold">
                    {item.qtyReceived !== undefined ? (
                      <span className={item.qtyReceived < item.qtyLoaded ? 'text-rose-600' : 'text-slate-900'}>
                        {item.qtyReceived}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {item.conditionReceived ? (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.conditionReceived === 'Bagus'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.conditionReceived}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-3 text-center font-black">
                    {item.discrepancy !== undefined ? (
                      <span
                        className={
                          item.discrepancy < 0
                            ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200'
                            : item.discrepancy > 0
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }
                      >
                        {item.discrepancy === 0 ? '0' : item.discrepancy}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-600 text-[11px]">{item.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t border-slate-200">
                <td colSpan={3} className="p-3 text-right uppercase text-slate-600">
                  Total Muatan Koli:
                </td>
                <td className="p-3 text-center text-teal-800 text-sm">
                  {shipment.totalQtyLoaded} Koli
                </td>
                <td></td>
                <td className="p-3 text-center text-teal-800 text-sm">
                  {shipment.totalQtyReceived !== undefined ? `${shipment.totalQtyReceived} Koli` : '-'}
                </td>
                <td></td>
                <td className="p-3 text-center text-sm">
                  {discrepancyTotal !== 0 ? (
                    <span className="text-rose-600">{discrepancyTotal} Koli</span>
                  ) : (
                    <span className="text-emerald-600">Lengkap</span>
                  )}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* FOTO BUKTI & ABSENSI WATERMARK DARI SOPIR & PENERIMA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-teal-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Galeri Foto Bukti Lapangan &amp; Absensi GPS Ber-Watermark
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">
            Watermark permanen koordinat, tanggal, sopir &amp; no. plat
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Check In Photo */}
          {shipment.attendance.checkIn && (
            <div
              className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 group cursor-pointer"
              onClick={() => setSelectedPhoto(shipment.attendance.checkIn?.photoUrl || null)}
            >
              <div className="p-2 bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-between">
                <span>CHECK IN BERANGKAT</span>
                <span>{shipment.attendance.checkIn.formattedTime}</span>
              </div>
              <img
                src={shipment.attendance.checkIn.photoUrl}
                alt="Foto Check In"
                className="w-full h-44 object-cover group-hover:opacity-90 transition-opacity"
              />
              <div className="p-2 text-[10px] text-slate-300 bg-slate-950 truncate">
                📍 {shipment.attendance.checkIn.locationName}
              </div>
            </div>
          )}

          {/* Check Out Photo */}
          {shipment.attendance.checkOut && (
            <div
              className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 group cursor-pointer"
              onClick={() => setSelectedPhoto(shipment.attendance.checkOut?.photoUrl || null)}
            >
              <div className="p-2 bg-sky-500 text-slate-950 font-bold text-[10px] flex items-center justify-between">
                <span>CHECK OUT TIBA</span>
                <span>{shipment.attendance.checkOut.formattedTime}</span>
              </div>
              <img
                src={shipment.attendance.checkOut.photoUrl}
                alt="Foto Check Out"
                className="w-full h-44 object-cover group-hover:opacity-90 transition-opacity"
              />
              <div className="p-2 text-[10px] text-slate-300 bg-slate-950 truncate">
                📍 {shipment.attendance.checkOut.locationName}
              </div>
            </div>
          )}

          {/* Extra Evidence Photos (Muat / Klaim / Kendala) */}
          {shipment.evidencePhotos.map((photo) => (
            <div
              key={photo.id}
              className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 group cursor-pointer"
              onClick={() => setSelectedPhoto(photo.url)}
            >
              <div
                className={`p-2 font-bold text-[10px] flex items-center justify-between text-white ${
                  photo.category === 'klaim'
                    ? 'bg-rose-600'
                    : photo.category === 'kendala'
                    ? 'bg-orange-600'
                    : 'bg-teal-700'
                }`}
              >
                <span className="uppercase">Foto {photo.category}</span>
                <span>{photo.timestamp}</span>
              </div>
              <img
                src={photo.url}
                alt={photo.caption}
                className="w-full h-44 object-cover group-hover:opacity-90 transition-opacity"
              />
              <div className="p-2 text-[10px] text-slate-300 bg-slate-950 truncate">
                {photo.caption} ({photo.uploadedBy})
              </div>
            </div>
          ))}

          {!shipment.attendance.checkIn &&
            !shipment.attendance.checkOut &&
            shipment.evidencePhotos.length === 0 && (
              <div className="col-span-3 p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Belum ada foto absensi atau bukti dokumentasi yang diunggah oleh sopir/penerima.
              </div>
            )}
        </div>
      </div>

      {/* TANDA TANGAN DIGITAL TIGA PIHAK */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">
          Tanda Tangan Digital Resmi (Checker, Driver, Penerima)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-xs">
          {/* Checker */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between h-44">
            <span className="text-[10px] font-bold uppercase text-slate-500">1. Checker Muat</span>
            <div className="h-20 flex items-center justify-center my-1">
              {shipment.checkerSignature ? (
                <img
                  src={shipment.checkerSignature}
                  alt="Checker Signature"
                  className="max-h-20 max-w-full object-contain"
                />
              ) : (
                <span className="text-slate-400 italic">Belum bertanda tangan</span>
              )}
            </div>
            <div>
              <div className="font-bold text-slate-800 underline">{shipment.checkerName}</div>
              <div className="text-[10px] text-slate-500">Petugas Muat Gudang Asal</div>
            </div>
          </div>

          {/* Driver */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between h-44">
            <span className="text-[10px] font-bold uppercase text-slate-500">2. Driver / Pengemudi</span>
            <div className="h-20 flex items-center justify-center my-1">
              {shipment.driverSignature ? (
                <img
                  src={shipment.driverSignature}
                  alt="Driver Signature"
                  className="max-h-20 max-w-full object-contain"
                />
              ) : (
                <span className="text-slate-400 italic">Belum bertanda tangan</span>
              )}
            </div>
            <div>
              <div className="font-bold text-slate-800 underline">{shipment.driverName}</div>
              <div className="text-[10px] text-slate-500">Armada {shipment.plateNumber}</div>
            </div>
          </div>

          {/* Recipient */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between h-44">
            <span className="text-[10px] font-bold uppercase text-slate-500">3. Penerima Gudang</span>
            <div className="h-20 flex items-center justify-center my-1">
              {shipment.recipientSignature ? (
                <img
                  src={shipment.recipientSignature}
                  alt="Recipient Signature"
                  className="max-h-20 max-w-full object-contain"
                />
              ) : (
                <span className="text-slate-400 italic">Menunggu Penerimaan</span>
              )}
            </div>
            <div>
              <div className="font-bold text-slate-800 underline">{shipment.recipientName}</div>
              <div className="text-[10px] text-slate-500">{shipment.destination}</div>
            </div>
          </div>
        </div>
      </div>

      {/* LOG MONITORING ARMADA & PERJALANAN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">
          Log Monitoring Posisi &amp; Perubahan Status Armada
        </h2>

        <div className="space-y-3">
          {shipment.logs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={log.status} size="sm" />
                  <span className="font-bold text-slate-800">{log.location}</span>
                </div>
                <p className="text-slate-600">{log.notes}</p>
              </div>

              <div className="text-right text-[10px] text-slate-400 font-mono shrink-0">
                <div>{log.timestamp}</div>
                <div className="text-slate-600 font-sans font-medium">{log.author}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FULLSIZE PHOTO LIGHTBOX MODAL */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={selectedPhoto}
              alt="Bukti Foto Full"
              className="max-w-full max-h-[85vh] rounded-xl object-contain border-2 border-teal-500 shadow-2xl"
            />
            <div className="text-center text-xs text-white mt-2">
              Klik di mana saja untuk menutup pratinjau gambar ber-watermark.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
