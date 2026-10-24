import React, { useState } from 'react';
import { Truck, DriverMaster, WarehouseMaster, User } from '../../types';
import { StorageService } from '../../services/storage';
import {
  Truck as TruckIcon,
  Users,
  Building2,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  Phone,
  CreditCard,
  MapPin,
} from 'lucide-react';

export const AdminMasterData: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trucks' | 'drivers' | 'warehouses' | 'users'>('trucks');

  const [trucks, setTrucks] = useState<Truck[]>(() => StorageService.getTrucks());
  const [drivers, setDrivers] = useState<DriverMaster[]>(() => StorageService.getDrivers());
  const [warehouses, setWarehouses] = useState<WarehouseMaster[]>(() => StorageService.getWarehouses());
  const [users] = useState<User[]>(() => StorageService.getUsers());

  // Form states for adding items
  const [showAddModal, setShowAddModal] = useState(false);

  // New Truck state
  const [newTruckPlate, setNewTruckPlate] = useState('');
  const [newTruckType, setNewTruckType] = useState('CDD Box (4 Ton)');
  const [newTruckCapacity, setNewTruckCapacity] = useState('4.000 Kg');

  // New Driver state
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverSim, setNewDriverSim] = useState('SIM B2 Umum');

  // New Warehouse state
  const [newWhName, setNewWhName] = useState('');
  const [newWhCity, setNewWhCity] = useState('');
  const [newWhAddress, setNewWhAddress] = useState('');
  const [newWhPic, setNewWhPic] = useState('');
  const [newWhPhone, setNewWhPhone] = useState('');

  const handleAddTruck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTruckPlate) return;
    const item: Truck = {
      id: `trk-${Date.now()}`,
      plateNumber: newTruckPlate.toUpperCase(),
      type: newTruckType,
      capacity: newTruckCapacity,
      status: 'Tersedia',
    };
    StorageService.saveTruck(item);
    setTrucks(StorageService.getTrucks());
    setNewTruckPlate('');
    setShowAddModal(false);
  };

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName || !newDriverPhone) return;
    const item: DriverMaster = {
      id: `drv-${Date.now()}`,
      name: newDriverName,
      phone: newDriverPhone,
      simNumber: newDriverSim,
      status: 'Aktif',
    };
    StorageService.saveDriver(item);
    setDrivers(StorageService.getDrivers());
    setNewDriverName('');
    setNewDriverPhone('');
    setShowAddModal(false);
  };

  const handleAddWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhName || !newWhCity) return;
    const item: WarehouseMaster = {
      id: `wh-${Date.now()}`,
      name: newWhName,
      city: newWhCity,
      address: newWhAddress,
      picName: newWhPic,
      picPhone: newWhPhone,
    };
    StorageService.saveWarehouse(item);
    setWarehouses(StorageService.getWarehouses());
    setNewWhName('');
    setNewWhCity('');
    setNewWhAddress('');
    setNewWhPic('');
    setShowAddModal(false);
  };

  const handleDeleteTruck = (id: string) => {
    if (confirm('Hapus armada ini dari daftar master?')) {
      StorageService.deleteTruck(id);
      setTrucks(StorageService.getTrucks());
    }
  };

  const handleDeleteDriver = (id: string) => {
    if (confirm('Hapus sopir ini dari daftar master?')) {
      StorageService.deleteDriver(id);
      setDrivers(StorageService.getDrivers());
    }
  };

  const handleDeleteWarehouse = (id: string) => {
    if (confirm('Hapus gudang tujuan ini?')) {
      StorageService.deleteWarehouse(id);
      setWarehouses(StorageService.getWarehouses());
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Manajemen Data Master Logistik</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pusat database No. Polisi armada, driver tersertifikasi, gudang tujuan, dan akun sistem PT LAUTAN INDAH Express.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>
            {activeTab === 'trucks' && 'Tambah Armada'}
            {activeTab === 'drivers' && 'Tambah Driver'}
            {activeTab === 'warehouses' && 'Tambah Gudang'}
            {activeTab === 'users' && 'Info Pengguna'}
          </span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-200 text-xs font-bold shadow-xs">
        <button
          onClick={() => setActiveTab('trucks')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'trucks'
              ? 'bg-blue-950 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TruckIcon className="w-4 h-4 text-teal-400" />
          <span>Armada ({trucks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('drivers')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'drivers'
              ? 'bg-blue-950 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-amber-400" />
          <span>Driver ({drivers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('warehouses')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'warehouses'
              ? 'bg-blue-950 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Gudang Tujuan ({warehouses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-blue-950 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span>Pengguna ({users.length})</span>
        </button>
      </div>

      {/* TAB 1: ARMADA TRUCKS */}
      {activeTab === 'trucks' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trucks.map((truck) => (
            <div
              key={truck.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-blue-950 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    {truck.plateNumber}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      truck.status === 'Tersedia'
                        ? 'bg-emerald-100 text-emerald-800'
                        : truck.status === 'Dalam Perjalanan'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {truck.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-sm mt-2">{truck.type}</h3>
                <p className="text-xs text-slate-500">Kapasitas: {truck.capacity}</p>
                {truck.driverDefault && (
                  <p className="text-xs text-teal-700 font-medium mt-1">
                    Driver Tetap: {truck.driverDefault}
                  </p>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Siap Kirim Cargo</span>
                <button
                  type="button"
                  onClick={() => handleDeleteTruck(truck.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                  title="Hapus armada"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: DRIVERS */}
      {activeTab === 'drivers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{driver.name}</h3>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      driver.status === 'Aktif'
                        ? 'bg-emerald-100 text-emerald-800'
                        : driver.status === 'Tugas'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {driver.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-2 space-y-1">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-teal-600" />
                    <span>{driver.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>{driver.simNumber}</span>
                  </div>
                  {driver.assignedTruck && (
                    <div className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mt-1">
                      Armada: {driver.assignedTruck}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleDeleteDriver(driver.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                  title="Hapus sopir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: WAREHOUSES */}
      {activeTab === 'warehouses' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {warehouses.map((wh) => (
            <div
              key={wh.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{wh.name}</h3>
                  <span className="font-bold text-xs text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                    {wh.city}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-2 space-y-1">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{wh.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="font-semibold text-slate-800">PIC Gudang:</span>
                    <span>
                      {wh.picName} ({wh.picPhone})
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleDeleteWarehouse(wh.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                  title="Hapus gudang"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-200">
                <th className="p-3">Nama Pengguna</th>
                <th className="p-3">Username</th>
                <th className="p-3">Role Akses</th>
                <th className="p-3">No. Handphone</th>
                <th className="p-3">Demo Password</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-slate-900">{u.name}</td>
                  <td className="p-3 font-mono text-teal-800">{u.username}</td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-blue-100 text-blue-900'
                          : u.role === 'penerima'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-600">{u.phone}</td>
                  <td className="p-3 font-mono text-slate-400">
                    {u.role === 'admin' ? 'admin123' : u.role === 'penerima' ? 'terima123' : 'sopir123'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {activeTab === 'trucks' && 'Tambah Armada Baru'}
                {activeTab === 'drivers' && 'Tambah Pengemudi Baru'}
                {activeTab === 'warehouses' && 'Tambah Gudang Baru'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {/* Form Trucks */}
            {activeTab === 'trucks' && (
              <form onSubmit={handleAddTruck} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. Polisi Armada (Contoh: B 9988 XYZ)
                  </label>
                  <input
                    type="text"
                    required
                    value={newTruckPlate}
                    onChange={(e) => setNewTruckPlate(e.target.value)}
                    placeholder="B 9988 XYZ"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kendaraan / Karoseri</label>
                  <input
                    type="text"
                    required
                    value={newTruckType}
                    onChange={(e) => setNewTruckType(e.target.value)}
                    placeholder="CDD Long Box 4 Ton"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kapasitas Maksimal</label>
                  <input
                    type="text"
                    required
                    value={newTruckCapacity}
                    onChange={(e) => setNewTruckCapacity(e.target.value)}
                    placeholder="4.500 Kg / 24 CBM"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-xl text-xs">
                    Batal
                  </button>
                  <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl text-xs">
                    Simpan Armada
                  </button>
                </div>
              </form>
            )}

            {/* Form Drivers */}
            {activeTab === 'drivers' && (
              <form onSubmit={handleAddDriver} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Driver</label>
                  <input
                    type="text"
                    required
                    value={newDriverName}
                    onChange={(e) => setNewDriverName(e.target.value)}
                    placeholder="Nama driver"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. Handphone / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={newDriverPhone}
                    onChange={(e) => setNewDriverPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor &amp; Golongan SIM</label>
                  <input
                    type="text"
                    required
                    value={newDriverSim}
                    onChange={(e) => setNewDriverSim(e.target.value)}
                    placeholder="990212345678 (SIM B2 Umum)"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-xl text-xs">
                    Batal
                  </button>
                  <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl text-xs">
                    Simpan Driver
                  </button>
                </div>
              </form>
            )}

            {/* Form Warehouses */}
            {activeTab === 'warehouses' && (
              <form onSubmit={handleAddWarehouse} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Gudang / Hub</label>
                  <input
                    type="text"
                    required
                    value={newWhName}
                    onChange={(e) => setNewWhName(e.target.value)}
                    placeholder="Gudang Lautan Indah Malang"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kota</label>
                  <input
                    type="text"
                    required
                    value={newWhCity}
                    onChange={(e) => setNewWhCity(e.target.value)}
                    placeholder="Malang"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                  <input
                    type="text"
                    value={newWhAddress}
                    onChange={(e) => setNewWhAddress(e.target.value)}
                    placeholder="Jl. Raya Karanglo No. 12"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama PIC</label>
                    <input
                      type="text"
                      value={newWhPic}
                      onChange={(e) => setNewWhPic(e.target.value)}
                      placeholder="Bpk. Eko"
                      className="w-full p-2 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">No. Kontak PIC</label>
                    <input
                      type="tel"
                      value={newWhPhone}
                      onChange={(e) => setNewWhPhone(e.target.value)}
                      placeholder="081999888777"
                      className="w-full p-2 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-xl text-xs">
                    Batal
                  </button>
                  <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl text-xs">
                    Simpan Gudang
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
