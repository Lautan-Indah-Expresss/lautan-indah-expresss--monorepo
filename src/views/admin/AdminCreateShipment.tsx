import React, { useState } from 'react';
import {
  Shipment,
  CargoItem,
  FleetChecklist,
  Truck,
  DriverMaster,
  WarehouseMaster,
} from '../../types';
import { StorageService } from '../../services/storage';
import { SignaturePad } from '../../components/SignaturePad';
import { formatIndonesianDateTime } from '../../services/watermark';
import { ScrollableDropdown, DropdownOption } from '../../components/ScrollableDropdown';
import {
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Truck as TruckIcon,
  Package,
  ClipboardCheck,
  PenTool,
  ArrowLeft,
  Save,
} from 'lucide-react';

interface AdminCreateShipmentProps {
  onCancel: () => void;
  onSuccess: (newShipment: Shipment) => void;
}

export const AdminCreateShipment: React.FC<AdminCreateShipmentProps> = ({
  onCancel,
  onSuccess,
}) => {
  const trucks = StorageService.getTrucks();
  const drivers = StorageService.getDrivers();
  const warehouses = StorageService.getWarehouses();

  // Auto-generated Surat Jalan
  const [sjNumber] = useState<string>(() => StorageService.getNextSjNumber());
  const todayStr = new Date().toISOString().split('T')[0];

  // Form State: Data Armada & Driver
  const [date, setDate] = useState(todayStr);
  const [loadedAtTime, setLoadedAtTime] = useState('08:00');
  const [selectedPlate, setSelectedPlate] = useState(trucks[0]?.plateNumber || 'B 9283 UXZ');
  const [driverName, setDriverName] = useState(drivers[0]?.name || 'Agus Santoso');
  const [driverPhone, setDriverPhone] = useState(drivers[0]?.phone || '081234567890');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || 'wh-1');
  const [checkerName, setCheckerName] = useState('Surya Dimas (Checker Operasional)');
  const [notes, setNotes] = useState('');

  // Auto sync driver when plate is picked if default driver exists
  const handlePlateChange = (plate: string) => {
    setSelectedPlate(plate);
    const matchedTruck = trucks.find((t) => t.plateNumber === plate);
    if (matchedTruck && matchedTruck.driverDefault) {
      setDriverName(matchedTruck.driverDefault);
      const matchedDriver = drivers.find((d) => d.name === matchedTruck.driverDefault);
      if (matchedDriver) setDriverPhone(matchedDriver.phone);
    }
  };

  const handleDriverChange = (name: string) => {
    setDriverName(name);
    const matched = drivers.find((d) => d.name === name);
    if (matched) {
      setDriverPhone(matched.phone);
      if (matched.assignedTruck) setSelectedPlate(matched.assignedTruck);
    }
  };

  // Ceklist Kondisi Armada sebelum muat (Kebersihan, Terpal/Segel, Ban)
  const [checklist, setChecklist] = useState<FleetChecklist>({
    cleanliness: { status: 'Baik', notes: 'Box disapu bersih & kering' },
    tarpaulinSeal: { status: 'Baik', notes: 'Gembok & segel kontainer siap' },
    tiresRoadworthy: { status: 'Baik', notes: 'Tekanan ban & kelistrikan aman' },
  });

  // Items (Muatan Barang)
  const [items, setItems] = useState<CargoItem[]>([
    {
      id: `itm-${Date.now()}-1`,
      code: 'BRG-ELK-01',
      name: 'Smart TV LED 43 Inch Polytron',
      qtyLoaded: 40,
      conditionLoaded: 'Bagus',
      notes: 'Bungkus kardus & bubble wrap rapi',
    },
    {
      id: `itm-${Date.now()}-2`,
      code: 'BRG-FMC-02',
      name: 'Karton Minyak Goreng 2 Liter',
      qtyLoaded: 100,
      conditionLoaded: 'Bagus',
      notes: 'Palet bawah',
    },
  ]);

  // Signatures
  const [checkerSignature, setCheckerSignature] = useState<string>('');
  const [driverSignature, setDriverSignature] = useState<string>('');

  // Has warning if any checklist is "Buruk"
  const hasBadCondition =
    checklist.cleanliness.status === 'Buruk' ||
    checklist.tarpaulinSeal.status === 'Buruk' ||
    checklist.tiresRoadworthy.status === 'Buruk';

  // Dynamic row methods
  const handleAddItem = () => {
    const newItem: CargoItem = {
      id: `itm-${Date.now()}-${items.length + 1}`,
      code: `BRG-LOG-${(items.length + 1).toString().padStart(2, '0')}`,
      name: '',
      qtyLoaded: 10,
      conditionLoaded: 'Bagus',
      notes: '',
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert('Minimal wajib ada 1 baris barang dalam pengiriman.');
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof CargoItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const totalKoli = items.reduce((sum, item) => sum + (Number(item.qtyLoaded) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!selectedPlate || !driverName || !driverPhone) {
      alert('Lengkapi data No. Polisi, Driver, dan No. Handphone.');
      return;
    }

    if (items.some((i) => !i.name.trim() || i.qtyLoaded <= 0)) {
      alert('Pastikan semua baris barang memiliki nama barang dan jumlah muat lebih dari 0.');
      return;
    }

    if (!checkerSignature) {
      alert('Tanda tangan Checker Muat wajib diisi sebelum menyimpan surat jalan.');
      return;
    }

    const matchedWarehouse = warehouses.find((w) => w.id === selectedWarehouseId) || warehouses[0];
    const matchedDriver = drivers.find((d) => d.name === driverName);

    const nowFormatted = formatIndonesianDateTime();

    const newShipmentData: Omit<Shipment, 'id'> = {
      sjNumber,
      date,
      loadedAt: `${loadedAtTime} WIB`,
      plateNumber: selectedPlate,
      driverName,
      driverPhone,
      driverId: matchedDriver?.id || 'drv-1',
      destination: matchedWarehouse.name,
      destinationCity: matchedWarehouse.city,
      destinationAddress: matchedWarehouse.address,
      recipientName: matchedWarehouse.picName,
      recipientPhone: matchedWarehouse.picPhone,
      status: 'Siap Muat',
      checklist,
      items,
      totalQtyLoaded: totalKoli,
      cargoConditionSummary: 'Belum Diterima',
      notes,
      checkerName,
      checkerSignature,
      driverSignature: driverSignature || undefined,
      attendance: {},
      evidencePhotos: [],
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: nowFormatted,
          status: 'Siap Muat',
          location: 'Pool Logistik Utama PT Lautan Indah',
          notes: `Surat Jalan ${sjNumber} berhasil diterbitkan dengan ${totalKoli} koli muatan. Armada siap berangkat.`,
          author: `${checkerName} (Checker Muat)`,
        },
      ],
    };

    const saved = StorageService.createShipment(newShipmentData);
    onSuccess(saved);
  };

  const truckOptions: DropdownOption[] = trucks.map((t) => ({
    value: t.plateNumber,
    label: `${t.plateNumber} (${t.type})`,
    subtext: `Kapasitas: ${t.capacity} • Status: ${t.status}`,
  }));

  const driverOptions: DropdownOption[] = drivers.map((d) => ({
    value: d.name,
    label: d.name,
    subtext: d.simNumber,
  }));

  const warehouseOptions: DropdownOption[] = warehouses.map((w) => ({
    value: w.id,
    label: `${w.city} - ${w.name}`,
    subtext: w.address,
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Buat Pengiriman Baru (Form Muat)
            </h1>
            <p className="text-xs text-slate-500">
              Input data armada, verifikasi ceklist kelayakan, muatan koli, dan tanda tangan digital.
            </p>
          </div>
        </div>

        {/* Auto SJ Badge */}
        <div className="text-right bg-teal-50 border border-teal-200 px-3.5 py-1.5 rounded-xl">
          <div className="text-[10px] text-teal-700 uppercase font-semibold">No. Surat Jalan (Auto)</div>
          <div className="font-mono font-black text-base text-teal-900">{sjNumber}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: DATA ARMADA & DRIVER */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <TruckIcon className="w-4 h-4 text-teal-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              1. Data Armada, Driver &amp; Tujuan Pengiriman
            </h2>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            {/* Tanggal Muat */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal Muat <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>

            {/* Jam Muat */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jam Muat Selesai
              </label>
              <input
                type="time"
                value={loadedAtTime}
                onChange={(e) => setLoadedAtTime(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>

            {/* No. Polisi Armada */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                No. Polisi Armada <span className="text-rose-500">*</span>
              </label>
              <ScrollableDropdown
                value={selectedPlate}
                options={truckOptions}
                onChange={(val) => handlePlateChange(val)}
                searchable={true}
                searchPlaceholder="Cari plat..."
                maxHeight="max-h-48"
              />
            </div>

            {/* Nama Driver */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Pengemudi / Driver <span className="text-rose-500">*</span>
              </label>
              <ScrollableDropdown
                value={driverName}
                options={driverOptions}
                onChange={(val) => handleDriverChange(val)}
                searchable={true}
                searchPlaceholder="Cari driver..."
                maxHeight="max-h-48"
              />
            </div>

            {/* No. Handphone Driver */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                No. WhatsApp / HP Driver <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white font-mono"
              />
            </div>

            {/* Gudang / Tujuan */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Gudang / Lokasi Tujuan <span className="text-rose-500">*</span>
              </label>
              <ScrollableDropdown
                value={selectedWarehouseId}
                options={warehouseOptions}
                onChange={(val) => setSelectedWarehouseId(val)}
                searchable={true}
                searchPlaceholder="Cari kota / gudang..."
                maxHeight="max-h-48"
              />
            </div>

            {/* Checker Name */}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Petugas Checker Muat Asal
              </label>
              <input
                type="text"
                required
                value={checkerName}
                onChange={(e) => setCheckerName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>

            {/* Catatan Operasional */}
            <div className="sm:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan Pengiriman / Instruksi Khusus
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Muatan fragile, wajib segel utuh, rute via Tol Trans Jawa."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: CEKLIST KONDISI ARMADA */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-teal-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                2. Ceklist Kondisi Armada Sebelum Muat
              </h2>
            </div>
            {hasBadCondition && (
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Ada Poin Buruk
              </span>
            )}
          </div>

          {/* WARNING BANNER JIKA ADA KONDISI BURUK */}
          {hasBadCondition && (
            <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">PERINGATAN KELAYAKAN ARMADA:</p>
                <p className="text-[11px] mt-0.5 leading-relaxed">
                  Terdapat item pemeriksaan dengan status <strong>"Buruk"</strong>. Pastikan perbaikan, pembersihan, atau penggantian armada dilakukan sebelum armada diberangkatkan demi keamanan barang cargo.
                </p>
              </div>
            </div>
          )}

          <div className="p-5 space-y-4 text-xs">
            {/* 1. Kebersihan Box */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="sm:w-1/3">
                <div className="font-bold text-slate-800">1. Kebersihan Dalam Box / Bak</div>
                <div className="text-[11px] text-slate-500">
                  Bebas bau menyengat, kering, bebas paku menonjol &amp; sampah.
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="cleanliness"
                      checked={checklist.cleanliness.status === 'Baik'}
                      onChange={() =>
                        setChecklist({
                          ...checklist,
                          cleanliness: { ...checklist.cleanliness, status: 'Baik' },
                        })
                      }
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-bold text-emerald-700">Baik</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer ml-3">
                    <input
                      type="radio"
                      name="cleanliness"
                      checked={checklist.cleanliness.status === 'Buruk'}
                      onChange={() =>
                        setChecklist({
                          ...checklist,
                          cleanliness: { ...checklist.cleanliness, status: 'Buruk' },
                        })
                      }
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-bold text-rose-700">Buruk</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={checklist.cleanliness.notes}
                  onChange={(e) =>
                    setChecklist({
                      ...checklist,
                      cleanliness: { ...checklist.cleanliness, notes: e.target.value },
                    })
                  }
                  placeholder="Catatan kebersihan..."
                  className="p-2 rounded-lg border border-slate-300 text-xs w-48 sm:w-60 bg-white"
                />
              </div>
            </div>

            {/* 2. Terpal / Segel / Kunci */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="sm:w-1/3">
                <div className="font-bold text-slate-800">2. Terpal, Segel &amp; Kunci Box</div>
                <div className="text-[11px] text-slate-500">
                  Gembok kokoh, segel bernomor, dan terpal tidak sobek/bocor.
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="tarpaulinSeal"
                      checked={checklist.tarpaulinSeal.status === 'Baik'}
                      onChange={() =>
                        setChecklist({
                          ...checklist,
                          tarpaulinSeal: { ...checklist.tarpaulinSeal, status: 'Baik' },
                        })
                      }
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-bold text-emerald-700">Baik</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer ml-3">
                    <input
                      type="radio"
                      name="tarpaulinSeal"
                      checked={checklist.tarpaulinSeal.status === 'Buruk'}
                      onChange={() =>
                        setChecklist({
                          ...checklist,
                          tarpaulinSeal: { ...checklist.tarpaulinSeal, status: 'Buruk' },
                        })
                      }
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-bold text-rose-700">Buruk</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={checklist.tarpaulinSeal.notes}
                  onChange={(e) =>
                    setChecklist({
                      ...checklist,
                      tarpaulinSeal: { ...checklist.tarpaulinSeal, notes: e.target.value },
                    })
                  }
                  placeholder="No. Segel / Catatan kunci..."
                  className="p-2 rounded-lg border border-slate-300 text-xs w-48 sm:w-60 bg-white"
                />
              </div>
            </div>

            {/* 3. Ban & Kelayakan Armada */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="sm:w-1/3">
                <div className="font-bold text-slate-800">3. Ban &amp; Kelayakan Fisik Armada</div>
                <div className="text-[11px] text-slate-500">
                  Kembang ban tebal, ban serep, rem, lampu sein, &amp; dongkrak lengkap.
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="tiresRoadworthy"
                      checked={checklist.tiresRoadworthy.status === 'Baik'}
                      onChange={() =>
                        setChecklist({
                          ...checklist,
                          tiresRoadworthy: { ...checklist.tiresRoadworthy, status: 'Baik' },
                        })
                      }
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-bold text-emerald-700">Baik</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer ml-3">
                    <input
                      type="radio"
                      name="tiresRoadworthy"
                      checked={checklist.tiresRoadworthy.status === 'Buruk'}
                      onChange={() =>
                        setChecklist({
                          ...checklist,
                          tiresRoadworthy: { ...checklist.tiresRoadworthy, status: 'Buruk' },
                        })
                      }
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-bold text-rose-700">Buruk</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={checklist.tiresRoadworthy.notes}
                  onChange={(e) =>
                    setChecklist({
                      ...checklist,
                      tiresRoadworthy: { ...checklist.tiresRoadworthy, notes: e.target.value },
                    })
                  }
                  placeholder="Catatan ban / mesin..."
                  className="p-2 rounded-lg border border-slate-300 text-xs w-48 sm:w-60 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: DETAIL BARANG (MUATAN KOLI) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-teal-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                3. Detail Muatan Barang (Daftar Koli)
              </h2>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Baris Barang
            </button>
          </div>

          <div className="p-5 space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-200">
                    <th className="p-2.5 w-10 text-center">No</th>
                    <th className="p-2.5 w-28">Kode Barang</th>
                    <th className="p-2.5">Nama &amp; Deskripsi Barang</th>
                    <th className="p-2.5 w-24 text-center">Qty Muat</th>
                    <th className="p-2.5 w-28 text-center">Kondisi Muat</th>
                    <th className="p-2.5 min-w-[140px]">Catatan / Palet</th>
                    <th className="p-2.5 w-12 text-center">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-2 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.code}
                          onChange={(e) => handleItemChange(item.id, 'code', e.target.value)}
                          placeholder="Kode"
                          className="w-full p-1.5 rounded border border-slate-300 font-mono text-[11px]"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                          placeholder="Nama barang..."
                          className="w-full p-1.5 rounded border border-slate-300 font-medium"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.qtyLoaded}
                          onChange={(e) =>
                            handleItemChange(item.id, 'qtyLoaded', parseInt(e.target.value, 10) || 0)
                          }
                          className="w-full p-1.5 rounded border border-slate-300 text-center font-bold text-slate-900"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <select
                          value={item.conditionLoaded}
                          onChange={(e) => handleItemChange(item.id, 'conditionLoaded', e.target.value)}
                          className="p-1.5 rounded border border-slate-300 text-xs font-semibold"
                        >
                          <option value="Bagus">Bagus</option>
                          <option value="Rusak">Rusak</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                          placeholder="Bungkus / posisi..."
                          className="w-full p-1.5 rounded border border-slate-300 text-[11px]"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t border-slate-200">
                    <td colSpan={3} className="p-3 text-right uppercase text-slate-600">
                      Total Jumlah Muatan:
                    </td>
                    <td className="p-3 text-center text-teal-800 text-sm">
                      {totalKoli} Koli
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* SECTION 4: TANDA TANGAN DIGITAL CHECKER & DRIVER */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <PenTool className="w-4 h-4 text-teal-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              4. Tanda Tangan Digital Pemeriksaan Muat
            </h2>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Checker Muat Signature */}
            <SignaturePad
              label="Tanda Tangan Checker Muat"
              signeeName={checkerName}
              required={true}
              onSave={(dataUrl) => setCheckerSignature(dataUrl)}
            />

            {/* Driver Signature */}
            <SignaturePad
              label="Tanda Tangan Pengemudi / Driver"
              signeeName={driverName}
              required={false}
              onSave={(dataUrl) => setDriverSignature(dataUrl)}
            />
          </div>
        </div>

        {/* SUBMIT BUTTON BAR */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-teal-600 via-teal-700 to-blue-900 hover:from-teal-700 hover:to-blue-950 text-white font-bold rounded-xl text-xs shadow-md shadow-teal-700/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Terbitkan Surat Jalan &amp; Simpan Muatan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
