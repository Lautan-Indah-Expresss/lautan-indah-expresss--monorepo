import React, { useState, useMemo } from 'react';
import { Shipment, User, AttendanceRecord } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { StorageService } from '../../services/storage';
import { WatermarkCameraModal } from '../../components/WatermarkCameraModal';
import { SignaturePad } from '../../components/SignaturePad';
import { formatIndonesianDateTime } from '../../services/watermark';
import {
  Truck,
  MapPin,
  Clock,
  Camera,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileText,
  ShieldCheck,
  Coffee,
  AlertCircle,
  Eye,
  PenTool,
  History,
  Compass,
  Check,
} from 'lucide-react';

interface DriverDashboardProps {
  user: User;
  shipments: Shipment[];
  onOpenPrintModal: (shipment: Shipment) => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  user,
  shipments,
  onOpenPrintModal,
  activeTab,
  onSelectTab,
}) => {
  // Mobile Tab
  const [internalTab, setInternalTab] = useState<'tasks' | 'history' | 'sop'>('tasks');
  const mobileTab = (activeTab as any) || internalTab;
  const setMobileTab = (tab: any) => {
    setInternalTab(tab);
    if (onSelectTab) onSelectTab(tab);
  };

  // Active shipment of driver (first non-completed, or matching driver name)
  const driverShipments = useMemo(() => {
    return shipments.filter(
      (s) =>
        s.driverName.toLowerCase().includes(user.name.toLowerCase()) ||
        user.name.toLowerCase().includes(s.driverName.toLowerCase()) ||
        user.username === 'sopir' // default demo driver
    );
  }, [shipments, user]);

  const activeShipment = driverShipments.find((s) => s.status !== 'Selesai') || driverShipments[0];

  // Watermark Camera Modal state
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraActionType, setCameraActionType] = useState<'check_in' | 'check_out' | 'evidence'>('check_in');
  const [cameraCategory, setCameraCategory] = useState<'muat' | 'perjalanan' | 'bongkar' | 'kendala' | 'klaim'>('perjalanan');

  // Status update modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [manualStatus, setManualStatus] = useState<Shipment['status']>('Dalam Perjalanan');
  const [manualLocation, setManualLocation] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  // Signature modal state
  const [showSignModal, setShowSignModal] = useState(false);

  // Detail / Checklist Modal
  const [showChecklistModal, setShowChecklistModal] = useState(false);

  // Handle Absensi Success (Check In / Check Out)
  const handleAttendanceSuccess = (result: {
    photoUrl: string;
    latitude: number;
    longitude: number;
    locationName: string;
    accuracy?: number;
    caption?: string;
  }) => {
    if (!activeShipment) return;

    if (cameraActionType === 'evidence') {
      StorageService.addEvidencePhoto(activeShipment.id, {
        category: cameraCategory,
        url: result.photoUrl,
        caption: result.caption || 'Foto dokumentasi operasional driver',
        timestamp: formatIndonesianDateTime(),
        locationName: result.locationName,
        uploadedBy: `${activeShipment.driverName} (Sopir)`,
      });
      alert('Foto bukti dokumentasi lapangan ber-watermark berhasil disimpan!');
      return;
    }

    const record: AttendanceRecord = {
      type: cameraActionType,
      timestamp: new Date().toISOString(),
      formattedTime: formatIndonesianDateTime(),
      latitude: result.latitude,
      longitude: result.longitude,
      locationName: result.locationName,
      accuracy: result.accuracy,
      photoUrl: result.photoUrl,
      driverName: activeShipment.driverName,
      plateNumber: activeShipment.plateNumber,
      sjNumber: activeShipment.sjNumber,
    };

    StorageService.recordAttendance(activeShipment.id, record);
    alert(
      cameraActionType === 'check_in'
        ? 'Check In Berangkat Berhasil! Status armada sekarang: Dalam Perjalanan.'
        : 'Check Out Paket Sampai Berhasil! Status armada sekarang: Tiba di Tujuan.'
    );
  };

  const handleSaveManualStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShipment) return;

    if (manualStatus === 'Terkendala' && !manualNotes.trim()) {
      alert('Wajib mengisi keterangan kendala lapangan!');
      return;
    }

    StorageService.updateShipmentStatus(
      activeShipment.id,
      manualStatus,
      manualLocation || 'Lokasi Terkini Driver',
      manualNotes || `Update status lapangan: ${manualStatus}`,
      `${activeShipment.driverName} (Sopir)`
    );

    setShowStatusModal(false);
    setManualNotes('');
    setManualLocation('');
  };

  const handleSaveDriverSignature = (signatureDataUrl: string) => {
    if (!activeShipment) return;
    const updated = {
      ...activeShipment,
      driverSignature: signatureDataUrl,
    };
    StorageService.updateShipment(updated);
    setShowSignModal(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20 px-3 sm:px-0">
      {/* Header Driver Card */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-teal-950 text-white p-4 rounded-2xl shadow-md border border-teal-700/40">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Portal Driver / Pengemudi</span>
            </div>
            <h1 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
              {activeShipment ? activeShipment.driverName : user.name}
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Armada: <span className="font-mono font-bold text-amber-300">{activeShipment?.plateNumber || 'B 9283 UXZ'}</span> • PT LAUTAN INDAH Express
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-teal-300 block uppercase font-semibold">Tugas Aktif</span>
            <span className="font-mono font-black text-sm text-white">
              {activeShipment ? activeShipment.sjNumber : '-'}
            </span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-3 gap-1 mt-4 p-1 bg-white/10 rounded-xl text-xs font-bold">
          <button
            onClick={() => setMobileTab('tasks')}
            className={`py-2 rounded-lg transition-all text-center ${
              mobileTab === 'tasks' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-200 hover:text-white'
            }`}
          >
            Tugas Aktif
          </button>
          <button
            onClick={() => setMobileTab('history')}
            className={`py-2 rounded-lg transition-all text-center ${
              mobileTab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-200 hover:text-white'
            }`}
          >
            Riwayat Absensi
          </button>
          <button
            onClick={() => setMobileTab('sop')}
            className={`py-2 rounded-lg transition-all text-center ${
              mobileTab === 'sop' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-200 hover:text-white'
            }`}
          >
            Panduan SOP
          </button>
        </div>
      </div>

      {/* TAB 1: TUGAS AKTIF DRIVER */}
      {mobileTab === 'tasks' && (
        <div className="space-y-4">
          {!activeShipment ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
              <p className="font-bold text-slate-800 text-sm">Tidak ada tugas pengiriman aktif saat ini.</p>
              <p className="text-xs text-slate-400 mt-1">Silakan tunggu penugasan dari admin checker pusat.</p>
            </div>
          ) : (
            <>
              {/* CURRENT MISSION CARD */}
              <div className="bg-white rounded-2xl border-2 border-teal-600/30 shadow-md p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono text-xs font-black text-teal-800">
                      SURAT JALAN: {activeShipment.sjNumber}
                    </span>
                    <h2 className="text-base font-black text-slate-900">
                      Tujuan: {activeShipment.destinationCity}
                    </h2>
                    <p className="text-xs text-slate-500">{activeShipment.destination}</p>
                  </div>
                  <StatusBadge status={activeShipment.status} />
                </div>

                {/* Destination & Cargo Pill */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Muatan</span>
                    <span className="font-black text-teal-800 text-sm">
                      {activeShipment.totalQtyLoaded} Koli
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Penerima Gudang</span>
                    <span className="font-bold text-slate-800">
                      {activeShipment.recipientName}
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono">{activeShipment.recipientPhone}</div>
                  </div>
                </div>

                {/* PRIMARY ACTIONS: ABSENSI WATERMARK CAMERA BUTTONS */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Absensi Wajib Sopir (Foto Kamera + GPS Watermark):
                  </div>

                  {!activeShipment.attendance.checkIn ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCameraActionType('check_in');
                        setCameraModalOpen(true);
                      }}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Camera className="w-5 h-5" />
                      <span>CHECK IN BERANGKAT (KAMERA + GPS)</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-950">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <div>
                          <div className="font-bold">Check In Berangkat Terverifikasi</div>
                          <div className="text-[10px] text-emerald-800 font-mono">
                            {activeShipment.attendance.checkIn.formattedTime}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                        GPS Valid
                      </span>
                    </div>
                  )}

                  {activeShipment.attendance.checkIn && !activeShipment.attendance.checkOut && (
                    <button
                      type="button"
                      onClick={() => {
                        setCameraActionType('check_out');
                        setCameraModalOpen(true);
                      }}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-black rounded-xl text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Camera className="w-5 h-5 text-teal-200" />
                      <span>CHECK OUT PAKET SAMPAI (KAMERA + GPS)</span>
                    </button>
                  )}

                  {activeShipment.attendance.checkOut && (
                    <div className="p-3 bg-sky-50 border border-sky-300 rounded-xl flex items-center justify-between text-xs text-sky-950">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-sky-600" />
                        <div>
                          <div className="font-bold">Check Out Tiba Terverifikasi</div>
                          <div className="text-[10px] text-sky-800 font-mono">
                            {activeShipment.attendance.checkOut.formattedTime}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-sky-200 text-sky-900 px-2 py-0.5 rounded">
                        Tiba di Gudang
                      </span>
                    </div>
                  )}
                </div>

                {/* SECONDARY OPERATIONAL ACTIONS */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  {/* Manual Status */}
                  <button
                    type="button"
                    onClick={() => setShowStatusModal(true)}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Coffee className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Update Status Jalan</span>
                  </button>

                  {/* Upload Foto Bukti Tambahan */}
                  <button
                    type="button"
                    onClick={() => {
                      setCameraActionType('evidence');
                      setCameraCategory('perjalanan');
                      setCameraModalOpen(true);
                    }}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-teal-600" />
                    <span>Unggah Bukti Lapangan</span>
                  </button>
                </div>

                {/* Surat Jalan & Ceklist Info Button */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenPrintModal(activeShipment)}
                    className="py-2 px-3 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Surat Jalan Digital</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowChecklistModal(true)}
                    className="py-2 px-3 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5 text-teal-600" />
                    <span>Ceklist Muat &amp; Barang</span>
                  </button>
                </div>

                {/* Driver Signature trigger if not signed */}
                {!activeShipment.driverSignature && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900">
                    <span className="font-semibold">Surat jalan belum Anda tandatangani</span>
                    <button
                      type="button"
                      onClick={() => setShowSignModal(true)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs"
                    >
                      Tanda Tangan Sekarang
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: RIWAYAT ABSENSI */}
      {mobileTab === 'history' && (
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <History className="w-4 h-4 text-teal-600" />
              <span>Riwayat Absensi &amp; Perjalanan Driver</span>
            </h2>

            <div className="space-y-3">
              {driverShipments.map((s) => (
                <div key={s.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-teal-800">{s.sjNumber}</span>
                      <div className="font-bold text-slate-900">{s.destinationCity}</div>
                    </div>
                    <StatusBadge status={s.status} size="sm" />
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-200">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Check In:</span>
                      <span className="font-medium text-slate-800">
                        {s.attendance.checkIn ? s.attendance.checkIn.formattedTime : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Check Out:</span>
                      <span className="font-medium text-slate-800">
                        {s.attendance.checkOut ? s.attendance.checkOut.formattedTime : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail foto ber-watermark */}
                  {s.attendance.checkIn?.photoUrl && (
                    <div className="pt-1">
                      <span className="text-[10px] text-slate-400 block mb-1">Foto Selfie Watermark GPS:</span>
                      <img
                        src={s.attendance.checkIn.photoUrl}
                        alt="Foto Absensi"
                        className="w-full h-28 object-cover rounded-lg border border-slate-300"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PANDUAN SOP */}
      {mobileTab === 'sop' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 text-teal-800 font-bold border-b pb-3">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <span className="text-sm">Standar Operasional Prosedur (SOP) Pengemudi PT Lautan Indah Express</span>
          </div>

          <ol className="list-decimal list-inside space-y-3 text-slate-700 leading-relaxed">
            <li>
              <strong>Pemeriksaan Sebelum Berangkat:</strong> Pastikan box bersih, gembok terpasang, nomor segel sesuai Surat Jalan, ban cadangan &amp; dongkrak lengkap.
            </li>
            <li>
              <strong>Wajib Absensi Check In:</strong> Lakukan Check In Berangkat tepat sebelum keluar pool / gudang muat dengan mengaktifkan GPS. Foto selfie wajah bersama plat nomor armada wajib diambil langsung dari kamera.
            </li>
            <li>
              <strong>Perjalanan &amp; Istirahat:</strong> Jika beristirahat atau menghadapi kendala di tol/jalan raya, gunakan menu <em>Update Status Lapangan</em> agar tim monitoring pusat mengetahui posisi armada.
            </li>
            <li>
              <strong>Tiba di Tujuan &amp; Bongkar:</strong> Lakukan Check Out Sampai saat armada parkir di loading dock gudang tujuan. Dampingi petugas gudang dalam menghitung fisik koli dan mencocokkan Surat Jalan.
            </li>
          </ol>
        </div>
      )}

      {/* STATUS MANUAL MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Update Status Perjalanan</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualStatus} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Lapangan Terkini</label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs"
                >
                  <option value="Dalam Perjalanan">Dalam Perjalanan (Lancar)</option>
                  <option value="Istirahat">Istirahat di Rest Area</option>
                  <option value="Terkendala">Terkendala (Macet / Ban / Mesin / Cuaca)</option>
                  <option value="Tiba di Tujuan">Tiba di Tujuan</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lokasi Terkini</label>
                <input
                  type="text"
                  required
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  placeholder="Contoh: Rest Area KM 102 Cipali"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Catatan</label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder={manualStatus === 'Terkendala' ? 'Wajib sebutkan jenis kendala' : 'Catatan perjalanan...'}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs"
                >
                  Simpan Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECKLIST & ITEMS PREVIEW MODAL */}
      {showChecklistModal && activeShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-900 text-sm">
                Ceklist Muat &amp; Muatan: {activeShipment.sjNumber}
              </h3>
              <button onClick={() => setShowChecklistModal(false)} className="text-slate-400">
                ✕
              </button>
            </div>

            {/* Checklist items */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-800">Ceklist Armada Sebelum Muat:</div>
              <div className="text-[11px] space-y-1">
                <div>
                  • Kebersihan Box: <strong>{activeShipment.checklist.cleanliness.status}</strong> ({activeShipment.checklist.cleanliness.notes})
                </div>
                <div>
                  • Segel &amp; Kunci: <strong>{activeShipment.checklist.tarpaulinSeal.status}</strong> ({activeShipment.checklist.tarpaulinSeal.notes})
                </div>
                <div>
                  • Ban &amp; Kelayakan: <strong>{activeShipment.checklist.tiresRoadworthy.status}</strong> ({activeShipment.checklist.tiresRoadworthy.notes})
                </div>
              </div>
            </div>

            {/* Cargo table */}
            <div className="space-y-2">
              <div className="font-bold text-slate-800">Daftar Muatan ({activeShipment.totalQtyLoaded} Koli):</div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold uppercase text-[10px] text-slate-600">
                    <tr>
                      <th className="p-2">Kode</th>
                      <th className="p-2">Nama Barang</th>
                      <th className="p-2 text-center">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeShipment.items.map((it) => (
                      <tr key={it.id}>
                        <td className="p-2 font-mono text-[10px] text-slate-600">{it.code}</td>
                        <td className="p-2 font-medium text-slate-800">{it.name}</td>
                        <td className="p-2 text-center font-bold text-slate-900">{it.qtyLoaded} koli</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowChecklistModal(false)}
              className="w-full py-2 bg-slate-800 text-white font-bold rounded-xl text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* SIGNATURE MODAL */}
      {showSignModal && activeShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Tanda Tangan Pengemudi</h3>
              <button onClick={() => setShowSignModal(false)} className="text-slate-400">
                ✕
              </button>
            </div>

            <SignaturePad
              label="Tanda Tangan Digital Driver"
              signeeName={activeShipment.driverName}
              required={true}
              onSave={handleSaveDriverSignature}
            />

            <button
              type="button"
              onClick={() => setShowSignModal(false)}
              className="w-full py-2 border rounded-xl text-xs text-slate-600"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* WATERMARK CAMERA MODAL */}
      {activeShipment && (
        <WatermarkCameraModal
          isOpen={cameraModalOpen}
          onClose={() => setCameraModalOpen(false)}
          shipment={activeShipment}
          actionType={cameraActionType}
          category={cameraCategory}
          onSuccess={handleAttendanceSuccess}
        />
      )}
    </div>
  );
};
