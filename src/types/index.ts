export type UserRole = 'admin' | 'penerima' | 'sopir';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  assignedWarehouse?: string; // For receiver
  assignedDriverId?: string; // For driver
}

export type ShipmentStatus =
  | 'Siap Muat'
  | 'Dalam Perjalanan'
  | 'Istirahat'
  | 'Terkendala'
  | 'Tiba di Tujuan'
  | 'Selesai'
  | 'Selisih/Claim';

export type ChecklistCondition = 'Baik' | 'Buruk';

export interface FleetChecklist {
  cleanliness: {
    status: ChecklistCondition;
    notes: string;
  };
  tarpaulinSeal: {
    status: ChecklistCondition;
    notes: string;
  };
  tiresRoadworthy: {
    status: ChecklistCondition;
    notes: string;
  };
}

export interface CargoItem {
  id: string;
  code: string;
  name: string;
  qtyLoaded: number; // in koli/units
  conditionLoaded: 'Bagus' | 'Rusak';
  qtyReceived?: number;
  conditionReceived?: 'Bagus' | 'Rusak' | 'Hilang';
  discrepancy?: number; // qtyReceived - qtyLoaded
  notes?: string;
}

export interface AttendanceRecord {
  type: 'check_in' | 'check_out';
  timestamp: string; // ISO
  formattedTime: string;
  latitude: number;
  longitude: number;
  locationName: string;
  accuracy?: number;
  photoUrl: string; // watermarked canvas data URL
  driverName: string;
  plateNumber: string;
  sjNumber: string;
}

export interface EvidencePhoto {
  id: string;
  category: 'muat' | 'perjalanan' | 'bongkar' | 'kendala' | 'klaim';
  url: string; // Watermarked data URL
  caption: string;
  timestamp: string;
  locationName?: string;
  uploadedBy: string;
}

export interface MonitoringLog {
  id: string;
  timestamp: string;
  status: ShipmentStatus;
  location: string;
  notes: string;
  author: string;
}

export interface ClaimReport {
  id: string;
  baNumber: string; // Berita Acara Number
  date: string;
  description: string;
  estimatedLoss: number; // in Rupiah
  status: 'Menunggu Investigasi' | 'Proses Investigasi' | 'Selesai Diganti' | 'Ditolak';
  resolvedAt?: string;
  resolutionNotes?: string;
  evidencePhotoUrls?: string[];
}

export interface Shipment {
  id: string;
  sjNumber: string; // e.g. SJ-001
  date: string; // YYYY-MM-DD
  loadedAt: string; // ISO or HH:mm
  departedAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  driverId: string;
  destination: string; // e.g. "Gudang Lautan Indah Surabaya"
  destinationCity: string;
  destinationAddress: string;
  recipientName: string;
  recipientPhone: string;
  status: ShipmentStatus;
  checklist: FleetChecklist;
  items: CargoItem[];
  totalQtyLoaded: number;
  totalQtyReceived?: number;
  cargoConditionSummary?: 'Bagus' | 'Ada Rusak' | 'Ada Selisih' | 'Belum Diterima';
  notes: string;
  checkerName: string;
  checkerSignature?: string;
  driverSignature?: string;
  recipientSignature?: string;
  attendance: {
    checkIn?: AttendanceRecord;
    checkOut?: AttendanceRecord;
  };
  evidencePhotos: EvidencePhoto[];
  logs: MonitoringLog[];
  claimReport?: ClaimReport;
}

export interface Truck {
  id: string;
  plateNumber: string;
  type: string; // CDD Box, Engkel Box, Fuso, Tronton
  capacity: string;
  driverDefault?: string;
  status: 'Tersedia' | 'Dalam Perjalanan' | 'Perbaikan';
}

export interface DriverMaster {
  id: string;
  name: string;
  phone: string;
  simNumber: string;
  status: 'Aktif' | 'Tugas' | 'Cuti';
  assignedTruck?: string;
}

export interface WarehouseMaster {
  id: string;
  name: string;
  city: string;
  address: string;
  picName: string;
  picPhone: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  targetRole: 'admin' | 'penerima' | 'sopir' | 'all';
  targetRecipient?: string;
  targetDriver?: string;
  shipmentId: string;
  sjNumber: string;
  read: boolean;
  type: 'departure' | 'arrival' | 'claim' | 'status_update';
}
