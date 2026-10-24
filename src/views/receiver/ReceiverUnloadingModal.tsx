import React, { useState } from 'react';
import { Shipment, CargoItem } from '../../types';
import { StorageService } from '../../services/storage';
import { SignaturePad } from '../../components/SignaturePad';
import { applyWatermarkToImage, getCurrentCoordinates, getGeocodedAddress } from '../../services/watermark';
import {
  X,
  Package,
  AlertTriangle,
  CheckCircle2,
  Camera,
  UploadCloud,
  FileText,
  PenTool,
  Check,
  RefreshCw,
} from 'lucide-react';

interface ReceiverUnloadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment;
  receiverName: string;
  onSuccess: (updatedShipment: Shipment) => void;
}

export const ReceiverUnloadingModal: React.FC<ReceiverUnloadingModalProps> = ({
  isOpen,
  onClose,
  shipment,
  receiverName,
  onSuccess,
}) => {
  // Pre-fill received items with loaded quantities as default
  const [items, setItems] = useState<CargoItem[]>(() => {
    return shipment.items.map((it) => ({
      ...it,
      qtyReceived: it.qtyReceived !== undefined ? it.qtyReceived : it.qtyLoaded,
      conditionReceived: it.conditionReceived || 'Bagus',
      discrepancy: it.discrepancy !== undefined ? it.discrepancy : 0,
    }));
  });

  const [claimBaNotes, setClaimBaNotes] = useState('');
  const [claimPhotoUrl, setClaimPhotoUrl] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [signature, setSignature] = useState<string>('');

  if (!isOpen) return null;

  // Handle count change
  const handleQtyChange = (id: string, qty: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const disc = qty - item.qtyLoaded;
          return {
            ...item,
            qtyReceived: qty,
            discrepancy: disc,
          };
        }
        return item;
      })
    );
  };

  const handleConditionChange = (id: string, condition: 'Bagus' | 'Rusak' | 'Hilang') => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, conditionReceived: condition };
        }
        return item;
      })
    );
  };

  const hasShortage = items.some((i) => (i.discrepancy || 0) < 0);
  const hasDamage = items.some(
    (i) => i.conditionReceived === 'Rusak' || i.conditionReceived === 'Hilang'
  );
  const needsClaimDocumentation = hasShortage || hasDamage;

  const totalLoaded = shipment.totalQtyLoaded;
  const totalReceived = items.reduce((sum, i) => sum + (Number(i.qtyReceived) || 0), 0);
  const totalDifference = totalReceived - totalLoaded;

  // Handle photo capture with watermark
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    try {
      let lat = -7.3211;
      let lng = 112.7544;
      let loc = shipment.destination;
      let acc = 10;

      try {
        const pos = await getCurrentCoordinates();
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        acc = pos.coords.accuracy;
        loc = await getGeocodedAddress(lat, lng);
      } catch (gpsErr) {
        // Fallback to warehouse destination coords
      }

      const watermarked = await applyWatermarkToImage(file, {
        driverName: shipment.driverName,
        plateNumber: shipment.plateNumber,
        sjNumber: shipment.sjNumber,
        latitude: lat,
        longitude: lng,
        accuracy: acc,
        locationName: loc,
        customNote: 'BUKTI BONGKAR / KLAIM PENERIMA GUDANG',
      });

      setClaimPhotoUrl(watermarked);
    } catch (err: any) {
      alert('Gagal memproses foto: ' + err.message);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!signature) {
      alert('Wajib mengisi tanda tangan digital penerima.');
      return;
    }

    if (needsClaimDocumentation) {
      if (!claimPhotoUrl) {
        alert(
          'Ditemukan selisih koli atau barang rusak/hilang! Sesuai SOP PT LAUTAN INDAH Express, WAJIB mengunggah foto bukti fisik barang.'
        );
        return;
      }
      if (!claimBaNotes.trim()) {
        alert('Mohon isi keterangan singkat Berita Acara mengenai selisih atau kerusakan barang.');
        return;
      }
    }

    const updated = StorageService.completeUnloading(
      shipment.id,
      items,
      signature,
      claimBaNotes,
      claimPhotoUrl || undefined
    );

    if (updated) {
      onSuccess(updated);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-teal-800 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-300" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Form Penerimaan Barang (Unloading)
              </h3>
              <p className="text-[11px] text-teal-200">
                Surat Jalan: {shipment.sjNumber} • {shipment.plateNumber} (Driver: {shipment.driverName})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Ceklist Muat Info Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>Verifikasi Keberangkatan (Checker Muat):</span>
              <span className="text-[10px] text-teal-700 font-mono font-semibold">
                Total Muat: {totalLoaded} Koli
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-slate-600">
              <div>
                Box: <strong>{shipment.checklist.cleanliness.status}</strong>
              </div>
              <div>
                Segel: <strong>{shipment.checklist.tarpaulinSeal.status}</strong>
              </div>
              <div>
                Ban: <strong>{shipment.checklist.tiresRoadworthy.status}</strong>
              </div>
            </div>
          </div>

          {/* Tabel Pencocokan Koli Per Barang */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-2.5 bg-slate-100/80 font-bold uppercase tracking-wider text-[11px] text-slate-700 flex items-center justify-between">
              <span>Pencocokan Fisik Muatan Barang</span>
              <span className="text-[10px] text-slate-500">Ketik jumlah diterima fisik</span>
            </div>

            <div className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <div key={item.id} className="p-3 space-y-2 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">{item.code}</span>
                      <h4 className="font-bold text-slate-900 text-xs">{item.name}</h4>
                      <p className="text-[10px] text-slate-500">Muat: {item.qtyLoaded} Koli ({item.conditionLoaded})</p>
                    </div>

                    {/* Discrepancy badge */}
                    <div className="text-right">
                      {item.discrepancy !== undefined && item.discrepancy !== 0 ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.discrepancy < 0
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Selisih: {item.discrepancy} Koli
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          Cocok
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Jumlah Diterima (Koli)
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={item.qtyReceived}
                        onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value, 10) || 0)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-center font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Kondisi Diterima
                      </label>
                      <select
                        value={item.conditionReceived}
                        onChange={(e) =>
                          handleConditionChange(item.id, e.target.value as 'Bagus' | 'Rusak' | 'Hilang')
                        }
                        className={`w-full p-2 border rounded-lg font-bold text-xs ${
                          item.conditionReceived === 'Bagus'
                            ? 'border-emerald-300 text-emerald-800 bg-emerald-50/50'
                            : 'border-rose-300 text-rose-800 bg-rose-50'
                        }`}
                      >
                        <option value="Bagus">Bagus (Mulus)</option>
                        <option value="Rusak">Rusak (Pecah/Penyok)</option>
                        <option value="Hilang">Hilang (Kurang)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Recap Row */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between font-bold text-xs">
              <span className="uppercase text-slate-600">Total Koli:</span>
              <div className="flex items-center gap-3">
                <span>Muat: {totalLoaded}</span>
                <span className={needsClaimDocumentation ? 'text-rose-600' : 'text-emerald-700'}>
                  Diterima: {totalReceived} ({totalDifference === 0 ? 'Sesuai' : `${totalDifference} Koli`})
                </span>
              </div>
            </div>
          </div>

          {/* DOKUMENTASI KLAIM WAJIB JIKA ADA SELISIH ATAU KERUSAKAN */}
          {needsClaimDocumentation && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-rose-900 font-bold">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>WAJIB: Unggah Bukti Selisih &amp; Berita Acara Singkat</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Ditemukan barang kurang atau kondisi rusak. Status pengiriman akan otomatis menjadi{' '}
                <strong>"Selisih/Claim"</strong> untuk diproses klaim ke manajemen operasional.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-rose-950 mb-1">
                  Keterangan Singkat Berita Acara <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={claimBaNotes}
                  onChange={(e) => setClaimBaNotes(e.target.value)}
                  placeholder="Contoh: Ditemukan 2 koli kardus robek dan remuk di palet belakang."
                  className="w-full p-2.5 rounded-lg border border-rose-300 bg-white focus:outline-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-rose-950 mb-1">
                  Foto Bukti Fisik Barang Rusak / Selisih (Wajib Ber-Watermark GPS) <span className="text-rose-600">*</span>
                </label>

                {claimPhotoUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-rose-300 bg-black max-w-xs">
                    <img src={claimPhotoUrl} alt="Bukti Selisih" className="w-full h-36 object-cover" />
                    <button
                      type="button"
                      onClick={() => setClaimPhotoUrl(null)}
                      className="absolute top-1 right-1 bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded font-bold"
                    >
                      Ganti Foto
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-rose-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-rose-100/50 transition-colors bg-white">
                    <Camera className="w-6 h-6 text-rose-600 mb-1" />
                    <span className="text-xs font-bold text-rose-900">
                      {isProcessingPhoto ? 'Mencetak Watermark...' : 'Ambil Foto Bukti Kerusakan'}
                    </span>
                    <span className="text-[10px] text-rose-700">Otomatis diberi watermark GPS &amp; No. SJ</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* TANDA TANGAN DIGITAL PENERIMA */}
          <div>
            <SignaturePad
              label="Tanda Tangan Digital Penerima Gudang"
              signeeName={receiverName}
              required={true}
              onSave={(dataUrl) => setSignature(dataUrl)}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 transition-all ${
                needsClaimDocumentation
                  ? 'bg-rose-700 hover:bg-rose-800'
                  : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {needsClaimDocumentation ? 'Submit Penerimaan (Selisih/Claim)' : 'Konfirmasi Selesai (Cocok)'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
