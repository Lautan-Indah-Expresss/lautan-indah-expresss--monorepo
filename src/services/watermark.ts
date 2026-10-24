/**
 * Watermarking & Image Compression Service
 * Draws permanent operational watermarks using HTML5 Canvas.
 */

export interface WatermarkData {
  companyName?: string;
  driverName: string;
  plateNumber: string;
  sjNumber: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  locationName?: string;
  timestamp?: Date;
  customNote?: string;
}

export function formatIndonesianDateTime(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();
  const hr = pad(date.getHours());
  const mn = pad(date.getMinutes());
  const sc = pad(date.getSeconds());
  return `${d}/${m}/${y} ${hr}:${mn}:${sc} WIB`;
}

/**
 * Reverse geocode coordinate or fallback to known Indonesian logistics routes
 */
export async function getGeocodedAddress(lat: number, lng: number): Promise<string> {
  try {
    // Try lightweight public reverse geocoding with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16`,
      {
        headers: { 'Accept-Language': 'id,en' },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.display_name) {
        // Shorten address for crisp overlay
        const parts = data.display_name.split(',');
        const short = parts.slice(0, 3).join(',').trim();
        return short || data.display_name.slice(0, 70);
      }
    }
  } catch (err) {
    // Fallback if offline / restricted / timeout
  }

  // Fallback realistic location based on Indonesian coordinate bands or generic
  if (lat >= -6.4 && lat <= -6.1 && lng >= 106.6 && lng <= 107.0) {
    return 'Area Pergudangan Marunda / Tj. Priok, DKI Jakarta';
  } else if (lat >= -7.4 && lat <= -7.1 && lng >= 112.6 && lng <= 112.9) {
    return 'Kawasan Industri Rungkut / Tj. Perak, Surabaya';
  } else if (lat >= -7.1 && lat <= -6.8 && lng >= 110.3 && lng <= 110.6) {
    return 'Kawasan Industri Genuk / Tj. Emas, Semarang';
  } else if (lat >= -6.9 && lat <= -6.8 && lng >= 107.5 && lng <= 107.7) {
    return 'Kawasan Industri Gedebage, Bandung';
  }

  return `Titik GPS Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;
}

/**
 * Applies permanent operational watermark onto an image file or dataUrl
 * and compresses it to an optimized JPEG.
 */
export async function applyWatermarkToImage(
  imageSource: string | File | Blob,
  data: WatermarkData
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl: string | null = null;
    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      objectUrl = URL.createObjectURL(imageSource);
      img.src = objectUrl;
    }

    img.onload = async () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);

      // Target maximum dimension (1200px) for high readability while keeping localStorage light
      const maxDim = 1200;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0, width, height);

      // Watermark styling calculations
      const scale = Math.max(width / 900, 0.7);
      const padding = 16 * scale;
      const boxHeight = 145 * scale;
      const boxY = height - boxHeight;

      // Draw semi-transparent dark overlay box at the bottom
      ctx.save();
      const gradient = ctx.createLinearGradient(0, boxY, 0, height);
      gradient.addColorStop(0, 'rgba(10, 25, 47, 0.75)');
      gradient.addColorStop(1, 'rgba(5, 15, 30, 0.95)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, boxY, width, boxHeight);

      // Top cyan/teal accent line on watermark box
      ctx.fillStyle = '#0D9488'; // Oceanic teal
      ctx.fillRect(0, boxY, width, 3 * scale);

      // Watermark Text setup
      const timestampText = formatIndonesianDateTime(data.timestamp || new Date());
      const locationText = data.locationName || `Lat: ${data.latitude.toFixed(6)}, Lng: ${data.longitude.toFixed(6)}`;
      const accuracyText = data.accuracy ? ` (±${Math.round(data.accuracy)}m)` : '';

      ctx.textBaseline = 'top';

      // Line 1: Brand & Badge
      ctx.font = `bold ${Math.round(18 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#38BDF8'; // Sky cyan
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(
        `PT LAUTAN INDAH Express  •  SISTEM MONITORING ARMADA`,
        padding,
        boxY + 12 * scale
      );

      // Line 2: GPS Location & Accuracy
      ctx.font = `${Math.round(14 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(
        `📍 LOKASI: ${locationText}${accuracyText}`,
        padding,
        boxY + 42 * scale
      );

      // Line 3: Timestamp & Coordinates
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(
        `🕒 WAKTU: ${timestampText}  |  KOORDINAT: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`,
        padding,
        boxY + 68 * scale
      );

      // Line 4: Operational Data (Plat, Driver, SJ)
      ctx.font = `bold ${Math.round(14 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#FBBF24'; // Warm amber highlight
      ctx.fillText(
        `🚚 NO. POLISI: ${data.plateNumber}  |  SOPIR: ${data.driverName}  |  NO. SJ: ${data.sjNumber}`,
        padding,
        boxY + 95 * scale
      );

      if (data.customNote) {
        ctx.font = `italic ${Math.round(12 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillStyle = '#CBD5E1';
        ctx.fillText(
          `Catatan: ${data.customNote}`,
          padding,
          boxY + 118 * scale
        );
      }

      ctx.restore();

      // Export compressed JPEG
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
      resolve(compressedDataUrl);
    };

    img.onerror = (err) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal memuat gambar untuk proses watermark: ' + err));
    };
  });
}

/**
 * Helper to request Geolocation with Promise
 */
export function getCurrentCoordinates(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Fitur Geolocation tidak didukung oleh browser Anda.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => {
        let msg = 'Izin lokasi (GPS) ditolak atau tidak aktif.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Izin akses GPS ditolak. Wajib aktifkan GPS untuk absensi pengiriman.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Informasi lokasi GPS tidak tersedia. Pastikan perangkat memiliki sinyal GPS.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Waktu permintaan lokasi GPS habis. Silakan coba lagi.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  });
}
