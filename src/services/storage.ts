/**
 * Storage Service Layer
 * Clean abstraction layer separating data persistence from UI components.
 * Easily swappable with Firebase Firestore or Supabase.
 */

import {
  Shipment,
  ShipmentStatus,
  Truck,
  DriverMaster,
  WarehouseMaster,
  User,
  AppNotification,
  AttendanceRecord,
  EvidencePhoto,
  ClaimReport,
  CargoItem,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_TRUCKS,
  INITIAL_DRIVERS,
  INITIAL_WAREHOUSES,
  INITIAL_SHIPMENTS,
  INITIAL_NOTIFICATIONS,
} from './dummyData';
import { formatIndonesianDateTime } from './watermark';

const STORAGE_KEYS = {
  SHIPMENTS: 'ptli_express_shipments_v1',
  TRUCKS: 'ptli_express_trucks_v1',
  DRIVERS: 'ptli_express_drivers_v1',
  WAREHOUSES: 'ptli_express_warehouses_v1',
  USERS: 'ptli_express_users_v1',
  NOTIFICATIONS: 'ptli_express_notifications_v1',
  CURRENT_USER: 'ptli_express_active_user_v1',
};

// Custom event name for state reactivity across components
export const STORAGE_CHANGE_EVENT = 'ptli_express_storage_update';

function notifyStorageChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT));
  }
}

/**
 * Initialize localStorage with default data if empty
 */
export function initializeStorage(): void {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.SHIPMENTS)) {
    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(INITIAL_SHIPMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TRUCKS)) {
    localStorage.setItem(STORAGE_KEYS.TRUCKS, JSON.stringify(INITIAL_TRUCKS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.DRIVERS)) {
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(INITIAL_DRIVERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.WAREHOUSES)) {
    localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(INITIAL_WAREHOUSES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  }
}

export const StorageService = {
  // ---- SHIPMENTS ----

  getShipments(): Shipment[] {
    initializeStorage();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHIPMENTS);
      return data ? JSON.parse(data) : INITIAL_SHIPMENTS;
    } catch {
      return INITIAL_SHIPMENTS;
    }
  },

  getShipmentById(id: string): Shipment | null {
    const list = this.getShipments();
    return list.find((s) => s.id === id) || null;
  },

  getShipmentBySj(sjNumber: string): Shipment | null {
    const list = this.getShipments();
    const clean = sjNumber.trim().toUpperCase();
    return list.find((s) => s.sjNumber.toUpperCase() === clean) || null;
  },

  getNextSjNumber(): string {
    const shipments = this.getShipments();
    const numbers = shipments
      .map((s) => {
        const match = s.sjNumber.match(/SJ-(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));

    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNum = max + 1;
    return `SJ-${nextNum.toString().padStart(3, '0')}`;
  },

  createShipment(shipmentData: Omit<Shipment, 'id'>): Shipment {
    const shipments = this.getShipments();
    const newId = `shp-${Date.now()}`;
    const newShipment: Shipment = {
      ...shipmentData,
      id: newId,
    };

    // Update truck status to Dalam Perjalanan if applicable
    this.updateTruckStatus(newShipment.plateNumber, 'Dalam Perjalanan');

    const updated = [newShipment, ...shipments];
    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(updated));

    // Create system notification
    this.createNotification({
      title: 'Pengiriman Baru Dibuat',
      message: `Surat Jalan ${newShipment.sjNumber} dibuat untuk armada ${newShipment.plateNumber} (Driver: ${newShipment.driverName}).`,
      targetRole: 'all',
      shipmentId: newId,
      sjNumber: newShipment.sjNumber,
      type: 'status_update',
    });

    notifyStorageChange();
    return newShipment;
  },

  updateShipment(updatedShipment: Shipment): void {
    const shipments = this.getShipments();
    const index = shipments.findIndex((s) => s.id === updatedShipment.id);
    if (index !== -1) {
      shipments[index] = updatedShipment;
      localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(shipments));
      notifyStorageChange();
    }
  },

  updateShipmentStatus(
    shipmentId: string,
    status: ShipmentStatus,
    location: string,
    notes: string,
    author: string
  ): Shipment | null {
    const shipments = this.getShipments();
    const shipment = shipments.find((s) => s.id === shipmentId);
    if (!shipment) return null;

    shipment.status = status;
    const nowStr = formatIndonesianDateTime();

    shipment.logs = [
      {
        id: `log-${Date.now()}`,
        timestamp: nowStr,
        status,
        location: location || 'Titik Operasional',
        notes: notes || `Status armada diperbarui menjadi ${status}`,
        author,
      },
      ...shipment.logs,
    ];

    if (status === 'Dalam Perjalanan' && !shipment.departedAt) {
      shipment.departedAt = nowStr;
    } else if (status === 'Tiba di Tujuan' && !shipment.arrivedAt) {
      shipment.arrivedAt = nowStr;
    } else if (status === 'Selesai' && !shipment.completedAt) {
      shipment.completedAt = nowStr;
      this.updateTruckStatus(shipment.plateNumber, 'Tersedia');
    }

    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(shipments));

    // Notification broadcast
    let notifType: AppNotification['type'] = 'status_update';
    if (status === 'Dalam Perjalanan') notifType = 'departure';
    if (status === 'Tiba di Tujuan') notifType = 'arrival';
    if (status === 'Selisih/Claim') notifType = 'claim';

    this.createNotification({
      title: `Status Armada: ${status}`,
      message: `Armada ${shipment.plateNumber} (${shipment.sjNumber}) status: ${status} di ${location}.`,
      targetRole: 'all',
      shipmentId: shipment.id,
      sjNumber: shipment.sjNumber,
      type: notifType,
    });

    notifyStorageChange();
    return shipment;
  },

  recordAttendance(shipmentId: string, record: AttendanceRecord): Shipment | null {
    const shipments = this.getShipments();
    const shipment = shipments.find((s) => s.id === shipmentId);
    if (!shipment) return null;

    if (record.type === 'check_in') {
      shipment.attendance.checkIn = record;
      shipment.status = 'Dalam Perjalanan';
      shipment.departedAt = record.formattedTime;
    } else {
      shipment.attendance.checkOut = record;
      shipment.status = 'Tiba di Tujuan';
      shipment.arrivedAt = record.formattedTime;
    }

    const actionText = record.type === 'check_in' ? 'Check In Berangkat' : 'Check Out Tiba di Tujuan';
    shipment.logs = [
      {
        id: `log-${Date.now()}`,
        timestamp: record.formattedTime,
        status: shipment.status,
        location: record.locationName,
        notes: `Absensi GPS terverifikasi (${actionText}) beserta foto selfie watermark koordinat`,
        author: `${record.driverName} (Sopir)`,
      },
      ...shipment.logs,
    ];

    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(shipments));

    this.createNotification({
      title: actionText,
      message: `Sopir ${record.driverName} (${shipment.plateNumber}) telah melakukan ${actionText} di ${record.locationName}.`,
      targetRole: 'all',
      shipmentId: shipment.id,
      sjNumber: shipment.sjNumber,
      type: record.type === 'check_in' ? 'departure' : 'arrival',
    });

    notifyStorageChange();
    return shipment;
  },

  addEvidencePhoto(shipmentId: string, photo: Omit<EvidencePhoto, 'id'>): Shipment | null {
    const shipments = this.getShipments();
    const shipment = shipments.find((s) => s.id === shipmentId);
    if (!shipment) return null;

    const newPhoto: EvidencePhoto = {
      ...photo,
      id: `ev-${Date.now()}`,
    };

    shipment.evidencePhotos = [newPhoto, ...shipment.evidencePhotos];
    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(shipments));
    notifyStorageChange();
    return shipment;
  },

  completeUnloading(
    shipmentId: string,
    receivedItems: CargoItem[],
    recipientSignature: string,
    claimBaNotes?: string,
    claimPhotoUrl?: string
  ): Shipment | null {
    const shipments = this.getShipments();
    const shipment = shipments.find((s) => s.id === shipmentId);
    if (!shipment) return null;

    shipment.items = receivedItems;
    shipment.recipientSignature = recipientSignature;
    shipment.completedAt = formatIndonesianDateTime();

    const totalQtyReceived = receivedItems.reduce((acc, itm) => acc + (itm.qtyReceived ?? 0), 0);
    shipment.totalQtyReceived = totalQtyReceived;

    const hasShortage = receivedItems.some((i) => (i.discrepancy || 0) < 0);
    const hasDamaged = receivedItems.some((i) => i.conditionReceived === 'Rusak' || i.conditionReceived === 'Hilang');

    if (hasShortage || hasDamaged) {
      shipment.status = 'Selisih/Claim';
      shipment.cargoConditionSummary = hasDamaged ? 'Ada Rusak' : 'Ada Selisih';

      // Auto generate Berita Acara
      const now = new Date();
      const baNumber = `BA-CLM/${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${shipment.sjNumber.replace('SJ-', '')}`;

      shipment.claimReport = {
        id: `clm-${Date.now()}`,
        baNumber,
        date: formatIndonesianDateTime(now).split(' ')[0],
        description: claimBaNotes || `Ditemukan selisih koli / kerusakan barang pada saat pembongkaran muatan ${shipment.sjNumber}.`,
        estimatedLoss: 500000, // default estimation
        status: 'Menunggu Investigasi',
        evidencePhotoUrls: claimPhotoUrl ? [claimPhotoUrl] : [],
      };

      if (claimPhotoUrl) {
        shipment.evidencePhotos = [
          {
            id: `ev-${Date.now()}`,
            category: 'klaim',
            url: claimPhotoUrl,
            caption: 'Foto bukti selisih/kerusakan barang saat bongkar',
            timestamp: formatIndonesianDateTime(now),
            locationName: shipment.destination,
            uploadedBy: shipment.recipientName,
          },
          ...shipment.evidencePhotos,
        ];
      }

      shipment.logs = [
        {
          id: `log-${Date.now()}`,
          timestamp: formatIndonesianDateTime(now),
          status: 'Selisih/Claim',
          location: shipment.destination,
          notes: `Penerimaan selesai dengan catatan SELISIH/KLAIM. Diterbitkan Berita Acara ${baNumber}.`,
          author: `${shipment.recipientName} (Penerima)`,
        },
        ...shipment.logs,
      ];
    } else {
      shipment.status = 'Selesai';
      shipment.cargoConditionSummary = 'Bagus';
      this.updateTruckStatus(shipment.plateNumber, 'Tersedia');

      shipment.logs = [
        {
          id: `log-${Date.now()}`,
          timestamp: formatIndonesianDateTime(),
          status: 'Selesai',
          location: shipment.destination,
          notes: `Seluruh muatan (${totalQtyReceived} koli) telah diterima lengkap dalam kondisi bagus tanpa selisih.`,
          author: `${shipment.recipientName} (Penerima)`,
        },
        ...shipment.logs,
      ];
    }

    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(shipments));

    this.createNotification({
      title: shipment.status === 'Selesai' ? 'Pengiriman Selesai Sukses' : 'Pemberitahuan Klaim / Selisih',
      message: `Penerima ${shipment.recipientName} telah menyelesaikan cek bongkar ${shipment.sjNumber}. Status: ${shipment.status}`,
      targetRole: 'all',
      shipmentId: shipment.id,
      sjNumber: shipment.sjNumber,
      type: shipment.status === 'Selesai' ? 'status_update' : 'claim',
    });

    notifyStorageChange();
    return shipment;
  },

  updateClaimReport(shipmentId: string, report: ClaimReport): void {
    const shipments = this.getShipments();
    const shipment = shipments.find((s) => s.id === shipmentId);
    if (!shipment) return;

    shipment.claimReport = report;
    shipment.logs = [
      {
        id: `log-${Date.now()}`,
        timestamp: formatIndonesianDateTime(),
        status: 'Selisih/Claim',
        location: 'Kantor Operasional Pusat',
        notes: `Update Berita Acara Klaim ${report.baNumber}: Status -> ${report.status}. Catatan: ${report.resolutionNotes || '-'}`,
        author: 'Tim Klaim & Operasional (Admin)',
      },
      ...shipment.logs,
    ];

    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(shipments));
    notifyStorageChange();
  },

  // ---- TRUCKS ----

  getTrucks(): Truck[] {
    initializeStorage();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRUCKS);
      return data ? JSON.parse(data) : INITIAL_TRUCKS;
    } catch {
      return INITIAL_TRUCKS;
    }
  },

  updateTruckStatus(plateNumber: string, status: Truck['status']): void {
    const trucks = this.getTrucks();
    const truck = trucks.find((t) => t.plateNumber === plateNumber);
    if (truck) {
      truck.status = status;
      localStorage.setItem(STORAGE_KEYS.TRUCKS, JSON.stringify(trucks));
    }
  },

  saveTruck(truck: Truck): void {
    const trucks = this.getTrucks();
    const idx = trucks.findIndex((t) => t.id === truck.id);
    if (idx !== -1) {
      trucks[idx] = truck;
    } else {
      trucks.push(truck);
    }
    localStorage.setItem(STORAGE_KEYS.TRUCKS, JSON.stringify(trucks));
    notifyStorageChange();
  },

  deleteTruck(id: string): void {
    const trucks = this.getTrucks().filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRUCKS, JSON.stringify(trucks));
    notifyStorageChange();
  },

  // ---- DRIVERS ----

  getDrivers(): DriverMaster[] {
    initializeStorage();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DRIVERS);
      return data ? JSON.parse(data) : INITIAL_DRIVERS;
    } catch {
      return INITIAL_DRIVERS;
    }
  },

  saveDriver(driver: DriverMaster): void {
    const drivers = this.getDrivers();
    const idx = drivers.findIndex((d) => d.id === driver.id);
    if (idx !== -1) {
      drivers[idx] = driver;
    } else {
      drivers.push(driver);
    }
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers));
    notifyStorageChange();
  },

  deleteDriver(id: string): void {
    const drivers = this.getDrivers().filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers));
    notifyStorageChange();
  },

  // ---- WAREHOUSES ----

  getWarehouses(): WarehouseMaster[] {
    initializeStorage();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WAREHOUSES);
      return data ? JSON.parse(data) : INITIAL_WAREHOUSES;
    } catch {
      return INITIAL_WAREHOUSES;
    }
  },

  saveWarehouse(wh: WarehouseMaster): void {
    const list = this.getWarehouses();
    const idx = list.findIndex((w) => w.id === wh.id);
    if (idx !== -1) {
      list[idx] = wh;
    } else {
      list.push(wh);
    }
    localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(list));
    notifyStorageChange();
  },

  deleteWarehouse(id: string): void {
    const list = this.getWarehouses().filter((w) => w.id !== id);
    localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(list));
    notifyStorageChange();
  },

  // ---- USERS & AUTH ----

  getUsers(): User[] {
    initializeStorage();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  },

  getActiveUser(): User | null {
    initializeStorage();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    return null;
  },

  setActiveUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    notifyStorageChange();
  },

  // ---- NOTIFICATIONS ----

  getNotifications(): AppNotification[] {
    initializeStorage();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  },

  createNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): void {
    const list = this.getNotifications();
    const item: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: formatIndonesianDateTime(),
      read: false,
    };
    const updated = [item, ...list].slice(0, 30);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    notifyStorageChange();
  },

  markNotificationAsRead(id: string): void {
    const list = this.getNotifications();
    const item = list.find((n) => n.id === id);
    if (item) {
      item.read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
      notifyStorageChange();
    }
  },

  markAllNotificationsRead(): void {
    const list = this.getNotifications();
    list.forEach((n) => (n.read = true));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    notifyStorageChange();
  },

  // Reset database for test convenience
  resetDatabase(): void {
    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(INITIAL_SHIPMENTS));
    localStorage.setItem(STORAGE_KEYS.TRUCKS, JSON.stringify(INITIAL_TRUCKS));
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(INITIAL_DRIVERS));
    localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(INITIAL_WAREHOUSES));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    notifyStorageChange();
  },
};
