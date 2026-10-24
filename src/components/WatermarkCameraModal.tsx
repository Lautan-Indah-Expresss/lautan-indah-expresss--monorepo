import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  MapPin,
  Clock,
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  Compass,
} from 'lucide-react';
import {
  applyWatermarkToImage,
  getCurrentCoordinates,
  getGeocodedAddress,
  formatIndonesianDateTime,
} from '../services/watermark';
import { Shipment } from '../types';

interface WatermarkCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment;
  actionType: 'check_in' | 'check_out' | 'evidence';
  title?: string;
  category?: 'muat' | 'perjalanan' | 'bongkar' | 'kendala' | 'klaim';
  onSuccess: (result: {
    photoUrl: string;
    latitude: number;
    longitude: number;
    locationName: string;
    accuracy?: number;
    caption?: string;
  }) => void;
}

export const WatermarkCameraModal: React.FC<WatermarkCameraModalProps> = ({
  isOpen,
  onClose,
  shipment,
  actionType,
  title,
  category = 'perjalanan',
  onSuccess,
}) => {
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('Mencari titik alamat...');

  // Camera stream state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Processing & Preview
  const [isProcessing, setIsProcessing] = useState(false);
  const [watermarkedPreview, setWatermarkedPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  // Determine modal title
  const modalHeading =
    title ||
    (actionType === 'check_in'
      ? 'Absensi Check In Berangkat'
      : actionType === 'check_out'
      ? 'Absensi Check Out Paket Sampai'
      : 'Unggah Bukti Dokumentasi Lapangan');

  // Trigger GPS acquisition whenever modal opens
  const fetchGps = async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const position = await getCurrentCoordinates();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const acc = position.coords.accuracy;

      setCoords({ lat, lng, accuracy: acc });

      // Reverse geocode
      const addr = await getGeocodedAddress(lat, lng);
      setLocationName(addr);
      setGpsLoading(false);
    } catch (err: any) {
      setGpsError(err.message || 'Gagal membaca GPS. Wajib aktifkan GPS perangkat.');
      setGpsLoading(false);
    }
  };

  // Start video stream
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
        }
      } else {
        setCameraError('Kamera langsung tidak didukung di browser ini. Gunakan tombol ambil berkas foto.');
      }
    } catch (err: any) {
      // Permission denied or stream not supported
      setCameraActive(false);
      setCameraError('Akses kamera tidak diizinkan atau kamera sedang dipakai. Anda dapat menggunakan tombol ambil foto di bawah.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      setWatermarkedPreview(null);
      setCaption('');
      fetchGps();
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Capture from live video stream
  const handleSnapCamera = async () => {
    if (!coords) {
      alert('Tunggu hingga lokasi GPS terdeteksi atau aktifkan izin lokasi.');
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    setIsProcessing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context error');

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);

      // Now apply permanent watermark with GPS & PT LAUTAN INDAH Express info
      const watermarked = await applyWatermarkToImage(rawDataUrl, {
        driverName: shipment.driverName,
        plateNumber: shipment.plateNumber,
        sjNumber: shipment.sjNumber,
        latitude: coords.lat,
        longitude: coords.lng,
        accuracy: coords.accuracy,
        locationName,
        customNote: caption || (actionType === 'check_in' ? 'Check In Berangkat' : actionType === 'check_out' ? 'Check Out Tiba' : undefined),
      });

      setWatermarkedPreview(watermarked);
      stopCamera();
    } catch (err: any) {
      alert('Gagal memproses foto: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file capture fallback (e.g. native camera input)
  const handleFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!coords) {
      alert('Lokasi GPS belum didapatkan. Harap izinkan akses lokasi.');
      return;
    }

    setIsProcessing(true);
    try {
      const watermarked = await applyWatermarkToImage(file, {
        driverName: shipment.driverName,
        plateNumber: shipment.plateNumber,
        sjNumber: shipment.sjNumber,
        latitude: coords.lat,
        longitude: coords.lng,
        accuracy: coords.accuracy,
        locationName,
        customNote: caption || undefined,
      });

      setWatermarkedPreview(watermarked);
      stopCamera();
    } catch (err: any) {
      alert('Gagal memproses foto ber-watermark: ' + err.message);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRetake = () => {
    setWatermarkedPreview(null);
    startCamera();
  };

  const handleSubmit = () => {
    if (!watermarkedPreview || !coords) return;
    onSuccess({
      photoUrl: watermarkedPreview,
      latitude: coords.lat,
      longitude: coords.lng,
      locationName,
      accuracy: coords.accuracy,
      caption,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-blue-950 via-teal-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">{modalHeading}</h3>
              <p className="text-[11px] text-slate-300">
                {shipment.plateNumber} • {shipment.driverName} • {shipment.sjNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto custom-scrollbar flex-1">
          {/* GPS Status Indicator Banner */}
          <div
            className={`p-3 rounded-xl border transition-all text-xs flex items-start gap-2.5 ${
              gpsError
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : gpsLoading
                ? 'bg-amber-50 border-amber-200 text-amber-900 animate-pulse'
                : 'bg-emerald-50 border-emerald-300 text-emerald-950'
            }`}
          >
            {gpsError ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : gpsLoading ? (
              <RefreshCw className="w-5 h-5 text-amber-600 animate-spin shrink-0 mt-0.5" />
            ) : (
              <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}

            <div className="flex-1">
              <div className="font-semibold flex items-center justify-between">
                <span>
                  {gpsError
                    ? 'GPS Diperlukan (Wajib Aktif)'
                    : gpsLoading
                    ? 'Sedang Mengunci Sinyal GPS...'
                    : 'GPS Terkunci & Valid'}
                </span>
                {coords && coords.accuracy && (
                  <span className="text-[11px] text-emerald-700 font-mono">
                    Akurasi ±{Math.round(coords.accuracy)}m
                  </span>
                )}
              </div>
              <p className="text-[11px] mt-0.5 opacity-90">
                {gpsError ? (
                  <span>
                    {gpsError}{' '}
                    <button
                      onClick={fetchGps}
                      className="font-bold underline text-rose-700 hover:text-rose-900 ml-1"
                    >
                      Coba Ulang GPS
                    </button>
                  </span>
                ) : (
                  <span>{locationName}</span>
                )}
              </p>
              {coords && (
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Lat: {coords.lat.toFixed(6)}, Lng: {coords.lng.toFixed(6)}
                </div>
              )}
            </div>
          </div>

          {/* If GPS error, block proceeding with clear instructions */}
          {gpsError && (
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <p className="font-semibold text-slate-900">Petunjuk Aktivasi GPS:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                <li>Buka Pengaturan HP Anda dan aktifkan "Lokasi / GPS".</li>
                <li>Pilih "Izinkan saat aplikasi digunakan" pada browser.</li>
                <li>Klik tombol "Coba Ulang GPS" di atas untuk memverifikasi.</li>
              </ol>
            </div>
          )}

          {/* Camera Viewport or Watermarked Preview */}
          {watermarkedPreview ? (
            <div className="space-y-2">
              <div className="relative rounded-xl overflow-hidden border-2 border-teal-500 shadow-md bg-black">
                <img
                  src={watermarkedPreview}
                  alt="Watermarked Preview"
                  className="w-full h-auto max-h-72 object-contain mx-auto"
                />
                <div className="absolute top-2 left-2 bg-teal-600/90 text-white text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 shadow-xs">
                  <Check className="w-3 h-3" />
                  Watermark GPS Berhasil Dicetak
                </div>
              </div>

              {actionType === 'evidence' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Keterangan / Catatan Bukti Lapangan
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Contoh: Barang tertata rapi di dalam box / Ban serep terpasang"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-teal-500"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative w-full aspect-4/3 bg-slate-900 rounded-xl overflow-hidden border border-slate-300 flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                />

                {!cameraActive && (
                  <div className="text-center p-4 space-y-2 text-slate-300">
                    <Camera className="w-10 h-10 mx-auto text-slate-500 animate-pulse" />
                    <p className="text-xs">
                      {cameraError || 'Mempersiapkan kamera langsung...'}
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!!gpsError || gpsLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-medium shadow-xs disabled:opacity-50"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Buka Kamera / Ambil Foto
                    </button>
                  </div>
                )}

                {/* Live Overlaid Watermark Preview Badge */}
                {cameraActive && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-2 text-white pointer-events-none">
                    <div className="text-[10px] text-teal-300 font-bold">
                      PT LAUTAN INDAH Express • WATERMARK AKTIF
                    </div>
                    <div className="text-[10px] text-slate-200 truncate">
                      📍 {locationName}
                    </div>
                    <div className="text-[9px] text-amber-300">
                      🚚 {shipment.plateNumber} | {shipment.driverName} | {shipment.sjNumber}
                    </div>
                  </div>
                )}
              </div>

              {/* Hidden file capture fallback */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileCapture}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          {watermarkedPreview ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Foto Ulang
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Check className="w-4 h-4" />
                Konfirmasi &amp; Simpan Absensi
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>

              <div className="flex items-center gap-2 flex-1 justify-end">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!!gpsError || gpsLoading || isProcessing}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                  title="Ambil foto dari pemilih kamera perangkat"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Kamera HP
                </button>

                <button
                  type="button"
                  onClick={handleSnapCamera}
                  disabled={!cameraActive || !!gpsError || gpsLoading || isProcessing}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-all"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Memproses Watermark...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Jepret Foto Sekarang
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
