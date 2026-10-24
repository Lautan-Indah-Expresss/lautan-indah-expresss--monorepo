/**
 * Excel / CSV Exporter for PT LAUTAN INDAH Express
 */

import { Shipment } from '../types';

export function exportShipmentsToCsv(shipments: Shipment[], filename = 'Laporan-Pengiriman-PT-Lautan-Indah-Express.csv'): void {
  const headers = [
    'No',
    'Tanggal',
    'No. Polisi',
    'Nama Driver',
    'No. Surat Jalan',
    'Tujuan',
    'Kota Tujuan',
    'Qty Muat (Koli)',
    'Jam Berangkat',
    'Status Armada',
    'Qty Diterima (Koli)',
    'Kondisi Barang',
    'Status Selesai',
    'Catatan / Kendala',
    'Penerima',
    'Jam Tiba',
    'Jam Selesai',
  ];

  const rows = shipments.map((s, idx) => {
    const isCompleted = s.status === 'Selesai' ? 'YA' : s.status === 'Selisih/Claim' ? 'KLAIM' : 'BELUM';
    const notes = s.notes || (s.claimReport ? `[KLAIM] ${s.claimReport.description}` : '-');

    return [
      idx + 1,
      s.date,
      `"${s.plateNumber}"`,
      `"${s.driverName}"`,
      `"${s.sjNumber}"`,
      `"${s.destination}"`,
      `"${s.destinationCity}"`,
      s.totalQtyLoaded,
      `"${s.departedAt || s.loadedAt || '-'}"`,
      `"${s.status}"`,
      s.totalQtyReceived ?? '-',
      `"${s.cargoConditionSummary || '-'}"`,
      `"${isCompleted}"`,
      `"${notes.replace(/"/g, '""')}"`,
      `"${s.recipientName}"`,
      `"${s.arrivedAt || '-'}"`,
      `"${s.completedAt || '-'}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  // Prepend UTF-8 BOM so Excel opens special characters and Indonesian letters accurately
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportDriverRecapToCsv(shipments: Shipment[], filename = 'Rekap-Absensi-Driver-PT-Lautan-Indah.csv'): void {
  const headers = [
    'No',
    'Tanggal',
    'Nama Driver',
    'No. Polisi',
    'No. SJ',
    'Tujuan',
    'Status Pengiriman',
    'Jam Check In Berangkat',
    'Lokasi Check In',
    'Jam Check Out Tiba',
    'Lokasi Check Out',
    'Total Koli',
  ];

  const rows = shipments.map((s, idx) => {
    const checkIn = s.attendance.checkIn;
    const checkOut = s.attendance.checkOut;

    return [
      idx + 1,
      s.date,
      `"${s.driverName}"`,
      `"${s.plateNumber}"`,
      `"${s.sjNumber}"`,
      `"${s.destinationCity}"`,
      `"${s.status}"`,
      `"${checkIn ? checkIn.formattedTime : '-'}"`,
      `"${checkIn ? checkIn.locationName.replace(/"/g, '""') : '-'}"`,
      `"${checkOut ? checkOut.formattedTime : '-'}"`,
      `"${checkOut ? checkOut.locationName.replace(/"/g, '""') : '-'}"`,
      s.totalQtyLoaded,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
