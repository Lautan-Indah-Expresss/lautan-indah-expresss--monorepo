/**
 * WhatsApp Notification Templates & Quick Sharing Generator
 * Standardized for PT LAUTAN INDAH Express Operational Dispatch
 */

import { Shipment } from '../types';

export type WaMessageType = 'DEPART' | 'ARRIVED' | 'COMPLETED' | 'ISSUE';

export function generateWhatsAppMessage(shipment: Shipment, type: WaMessageType = 'DEPART', customNote?: string): string {
  const plate = shipment.plateNumber;
  const driver = shipment.driverName;
  const sj = shipment.sjNumber;

  if (type === 'DEPART') {
    return `*PT LAUTAN INDAH EXPRESS - UPDATE OPERASIONAL*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[${plate}] [${driver}] [${sj}] - DEPART

📅 *Tanggal:* ${shipment.date}
🚚 *Armada:* ${plate}
👤 *Driver:* ${driver} (${shipment.driverPhone})
📋 *No. SJ:* ${sj}
🏢 *Tujuan:* ${shipment.destination} (${shipment.destinationCity})
📦 *Total Muat:* ${shipment.totalQtyLoaded} Koli
🕒 *Jam Berangkat:* ${shipment.departedAt || shipment.loadedAt || '-'}
${customNote ? `📝 *Catatan:* ${customNote}\n` : ''}
Cek status pengiriman di Portal PT Lautan Indah Express.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Sistem Monitoring Logistik & Armada PT Lautan Indah Express_`;
  }

  if (type === 'ARRIVED') {
    return `*PT LAUTAN INDAH EXPRESS - UPDATE OPERASIONAL*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[${plate}] [${driver}] [${sj}] - ARRIVED

🚚 *Armada:* ${plate}
👤 *Driver:* ${driver}
📋 *No. SJ:* ${sj}
🏢 *Tiba di Tujuan:* ${shipment.destination}
🕒 *Jam Tiba:* ${shipment.arrivedAt || '-'}
📦 *Status:* Siap proses bongkar muatan
${customNote ? `📝 *Catatan:* ${customNote}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Sistem Monitoring Logistik & Armada PT Lautan Indah Express_`;
  }

  if (type === 'COMPLETED') {
    return `*PT LAUTAN INDAH EXPRESS - UPDATE OPERASIONAL*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[${plate}] [${driver}] [${sj}] - COMPLETED

🚚 *Armada:* ${plate}
👤 *Driver:* ${driver}
📋 *No. SJ:* ${sj}
🏢 *Lokasi:* ${shipment.destination}
📦 *Total Diterima:* ${shipment.totalQtyReceived ?? shipment.totalQtyLoaded} Koli
✨ *Kondisi:* Selesai Sesuai & Lengkap (Tanpa Selisih)
✍️ *Penerima:* ${shipment.recipientName}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Sistem Monitoring Logistik & Armada PT Lautan Indah Express_`;
  }

  // ISSUE / CLAIM
  return `*PT LAUTAN INDAH EXPRESS - LAPORAN KENDALA / KLAIM*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[${plate}] [${driver}] [${sj}] - CLAIM/KENDALA

🚨 *Status:* SELISIH / KLAIM BARANG
🚚 *Armada:* ${plate}
👤 *Driver:* ${driver}
📋 *No. SJ:* ${sj}
🏢 *Tujuan:* ${shipment.destination}
📦 *Muat:* ${shipment.totalQtyLoaded} Koli | *Diterima:* ${shipment.totalQtyReceived ?? '-'} Koli
${shipment.claimReport ? `📄 *No. Berita Acara:* ${shipment.claimReport.baNumber}\n⚠️ *Kronologi:* ${shipment.claimReport.description}` : ''}
${customNote ? `📝 *Catatan:* ${customNote}\n` : ''}
Mohon tim Operasional dan Asuransi segera menindaklanjuti.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Sistem Monitoring Logistik & Armada PT Lautan Indah Express_`;
}

export function openWhatsAppShare(text: string, phone?: string): void {
  const encoded = encodeURIComponent(text);
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}?text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;

  window.open(url, '_blank');
}
