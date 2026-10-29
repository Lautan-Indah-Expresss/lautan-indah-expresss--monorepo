"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Truck,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  Trash2,
  Send,
  Boxes,
  MapPin,
  RefreshCw,
  Info,
  Filter,
} from "lucide-react";

interface ShipmentItem {
  id: number;
  resi: string;
  reference_po: string | null;
  sender_company: string;
  origin_city: string;
  receiver_company: string;
  destination_city: string;
  destination_address: string;
  total_colli: number;
  actual_weight_kg: string;
  trip_code: string | null;
  drop_sequence: number | null;
  fleet_id: number | null;
  driver_id: number | null;
  driver_name: string | null;
  nopol: string | null;
}

interface DriverItem {
  id: number;
  name: string;
  phone: string;
}

interface FleetItem {
  id: number;
  nopol: string;
  vehicle_name: string;
  default_driver_id: number | null;
}

export default function MultiDropPlanningPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [fleets, setFleets] = useState<FleetItem[]>([]);

  // Driver yang sedang difilter/dipilih untuk direncanakan Multi-Drop
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedFleetId, setSelectedFleetId] = useState<string>("");
  
  // Daftar resi yang dipilih beserta urutan drop-nya: { shipment, sequence }
  const [selectedDrops, setSelectedDrops] = useState<{ shipment: ShipmentItem; sequence: number }[]>([]);

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/multidrop");
      const json = await res.json();
      if (json.success) {
        const loadedShipments: ShipmentItem[] = json.data.pendingShipments || [];
        const loadedDrivers: DriverItem[] = json.data.drivers || [];
        const loadedFleets: FleetItem[] = json.data.fleets || [];

        setShipments(loadedShipments);
        setDrivers(loadedDrivers);
        setFleets(loadedFleets);

        // Jika belum ada driver yang dipilih, pilih driver pertama yang punya tugas tertunda
        if (!selectedDriverId && loadedDrivers.length > 0) {
          const driverWithPending = loadedDrivers.find((d) =>
            loadedShipments.some((s) => s.driver_id === d.id && !s.trip_code)
          );
          if (driverWithPending) {
            setSelectedDriverId(String(driverWithPending.id));
          } else {
            setSelectedDriverId(String(loadedDrivers[0].id));
          }
        }
      }
    } catch (err) {
      console.error(err);
      setNotification({ type: "error", message: "Gagal memuat data dari server." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Saat supir berganti, bersihkan checklist draft sebelumnya dan otomatis pasangkan truk supir tersebut
  const handleDriverChange = (driverIdStr: string) => {
    setSelectedDriverId(driverIdStr);
    setSelectedDrops([]); // Reset checklist karena beda supir
    const matchingFleet = fleets.find((f) => f.default_driver_id === Number(driverIdStr));
    if (matchingFleet) {
      setSelectedFleetId(String(matchingFleet.id));
    } else {
      setSelectedFleetId("");
    }
  };

  // Saat fleet dipilih manual
  const handleFleetChange = (fleetIdStr: string) => {
    setSelectedFleetId(fleetIdStr);
  };

  // Toggle checklist resi ke dalam draft multi-drop
  const toggleSelectShipment = (shipment: ShipmentItem) => {
    const exists = selectedDrops.some((d) => d.shipment.id === shipment.id);
    if (exists) {
      const filtered = selectedDrops.filter((d) => d.shipment.id !== shipment.id);
      // Re-index urutan 1, 2, 3...
      const reindexed = filtered.map((item, idx) => ({ ...item, sequence: idx + 1 }));
      setSelectedDrops(reindexed);
    } else {
      setSelectedDrops([...selectedDrops, { shipment, sequence: selectedDrops.length + 1 }]);
    }
  };

  // Geser urutan drop ke atas
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newDrops = [...selectedDrops];
    const temp = newDrops[index - 1];
    newDrops[index - 1] = newDrops[index];
    newDrops[index] = temp;
    setSelectedDrops(newDrops.map((d, idx) => ({ ...d, sequence: idx + 1 })));
  };

  // Geser urutan drop ke bawah
  const moveDown = (index: number) => {
    if (index === selectedDrops.length - 1) return;
    const newDrops = [...selectedDrops];
    const temp = newDrops[index + 1];
    newDrops[index + 1] = newDrops[index];
    newDrops[index] = temp;
    setSelectedDrops(newDrops.map((d, idx) => ({ ...d, sequence: idx + 1 })));
  };

  // Terbitkan tugas Multi-Drop
  const handlePublishTrip = async () => {
    if (!selectedDriverId) {
      setNotification({ type: "error", message: "Harap pilih Supir terlebih dahulu." });
      return;
    }

    if (!selectedFleetId) {
      setNotification({ type: "error", message: "Harap pilih Truk Armada pengangkut." });
      return;
    }

    if (selectedDrops.length < 2) {
      setNotification({ type: "error", message: "Multi-Drop minimal memerlukan 2 resi yang digabungkan." });
      return;
    }

    try {
      setSubmitting(true);
      setNotification(null);

      const res = await fetch("/api/admin/multidrop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_id: Number(selectedDriverId),
          fleet_id: Number(selectedFleetId),
          drops: selectedDrops.map((d) => ({
            shipment_id: d.shipment.id,
            drop_sequence: d.sequence,
          })),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setNotification({ type: "success", message: json.message });
        setSelectedDrops([]);
        fetchData();
      } else {
        setNotification({ type: "error", message: json.error || "Gagal menerbitkan trip." });
      }
    } catch (err) {
      console.error(err);
      setNotification({ type: "error", message: "Terjadi kesalahan jaringan." });
    } finally {
      setSubmitting(false);
    }
  };

  // Batalkan trip yang sudah ada
  const handleCancelTrip = async (tripCode: string) => {
    if (!confirm(`Batalkan Trip Multi-Drop ${tripCode}? Seluruh resi akan dikembalikan menjadi resi biasa.`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/admin/multidrop?trip_code=${encodeURIComponent(tripCode)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setNotification({ type: "success", message: json.message });
        fetchData();
      } else {
        setNotification({ type: "error", message: json.error || "Gagal membatalkan trip." });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter resi HANYA milik Supir yang sedang dipilih:
  // 1. Resi tertunda milik driver yang BELUM masuk trip_code
  const currentDriverPendingShipments = shipments.filter(
    (s) => s.driver_id === Number(selectedDriverId) && !s.trip_code
  );

  // 2. Trip Multi-Drop milik supir yang sedang aktif
  const currentDriverTripsMap: { [tripCode: string]: ShipmentItem[] } = {};
  shipments
    .filter((s) => s.driver_id === Number(selectedDriverId) && s.trip_code)
    .forEach((s) => {
      const tc = s.trip_code!;
      if (!currentDriverTripsMap[tc]) currentDriverTripsMap[tc] = [];
      currentDriverTripsMap[tc].push(s);
    });

  // Urutkan per drop_sequence
  Object.keys(currentDriverTripsMap).forEach((trip) => {
    currentDriverTripsMap[trip].sort((a, b) => (a.drop_sequence || 1) - (b.drop_sequence || 1));
  });

  const activeDriverObj = drivers.find((d) => d.id === Number(selectedDriverId));

  // Hitung total koli & berat di draft
  const draftTotalColli = selectedDrops.reduce((acc, d) => acc + (d.shipment.total_colli || 1), 0);
  const draftTotalWeight = selectedDrops.reduce((acc, d) => acc + (Number(d.shipment.actual_weight_kg) || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Layers className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Perencanaan Rute & Muatan</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Dispatcher Multi-Drop Per Supir
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Pilih supir untuk melihat resi-resi tertundanya, centang resi yang searah, dan satukan menjadi rombongan Multi-Drop.
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Segarkan Data
          </button>
        </div>

        {/* Tab / Dropdown Pemilih Supir Utama */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                Supir yang Dikelola:
              </span>
              <strong className="text-base font-black text-slate-900">
                {activeDriverObj?.name || "Pilih Supir"} ({activeDriverObj?.phone || "-"})
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap hidden sm:inline">
              Ganti Supir:
            </span>
            <select
              value={selectedDriverId}
              onChange={(e) => handleDriverChange(e.target.value)}
              className="w-full md:w-64 text-xs font-extrabold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {drivers.map((d) => {
                const count = shipments.filter((s) => s.driver_id === d.id && !s.trip_code).length;
                return (
                  <option key={d.id} value={d.id}>
                    {d.name} ({count} resi siap)
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Notifikasi Banner */}
        {notification && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-semibold ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Tutup
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Tabel Resi Yang Tersedia untuk Supir Ini */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-blue-600" />
                    Resi Belum Berangkat Milik {activeDriverObj?.name || "Supir"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hanya menampilkan resi tertunda yang awalnya ditugaskan ke supir ini. Centang yang ingin digabung.
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg shrink-0">
                  {currentDriverPendingShipments.length} Resi Tersedia
                </span>
              </div>

              {currentDriverPendingShipments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Tidak ada resi baru yang menunggu perencanaan untuk supir ini.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {currentDriverPendingShipments.map((s) => {
                    const isSelected = selectedDrops.some((d) => d.shipment.id === s.id);
                    const selectedItem = selectedDrops.find((d) => d.shipment.id === s.id);

                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleSelectShipment(s)}
                        className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-50/70" : "hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by container onClick
                          className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 pointer-events-none"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-black text-slate-900">
                              {s.resi}
                            </span>
                            {isSelected && (
                              <span className="px-2 py-0.5 bg-blue-600 text-white text-[11px] font-black rounded-md">
                                DROP {selectedItem?.sequence}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                            <span className="font-semibold text-slate-700">{s.sender_company}</span>
                            <span>→</span>
                            <span className="font-semibold text-blue-700">{s.receiver_company} ({s.destination_city})</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {s.destination_address}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-slate-800">
                            {s.total_colli} Koli
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {s.actual_weight_kg} Kg
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Daftar Trip Multi-Drop yang Sedang Aktif untuk Supir Ini */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                Trip Multi-Drop Aktif Milik {activeDriverObj?.name || "Supir"}
              </h2>

              {Object.keys(currentDriverTripsMap).length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  Supir ini belum memiliki rombongan Multi-Drop terjadwal.
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(currentDriverTripsMap).map(([tripCode, tripShipments]) => (
                    <div
                      key={tripCode}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-indigo-700 text-sm">
                              {tripCode}
                            </span>
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-extrabold rounded">
                              {tripShipments.length} Drop
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Truk: <strong className="text-slate-800">{tripShipments[0]?.nopol || "-"}</strong>
                          </p>
                        </div>
                        <button
                          onClick={() => handleCancelTrip(tripCode)}
                          className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Batalkan Trip
                        </button>
                      </div>

                      {/* Timeline Drop */}
                      <div className="space-y-2 pt-2 border-t border-slate-200/60">
                        {tripShipments.map((ts) => (
                          <div
                            key={ts.id}
                            className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-200/70"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center">
                                {ts.drop_sequence}
                              </span>
                              <span className="font-mono font-bold text-slate-900">{ts.resi}</span>
                              <span className="text-slate-500">→ {ts.receiver_company} ({ts.destination_city})</span>
                            </div>
                            <span className="text-slate-500 font-medium">
                              {ts.total_colli} Koli • {ts.actual_weight_kg} Kg
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Pengaturan Urutan Drop & Penerbitan Tugas */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-5 sticky top-24">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  Penerbitan Multi-Drop ({activeDriverObj?.name || "Supir"})
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Atur urutan rute drop untuk resi yang dicentang milik supir ini.
                </p>
              </div>

              {/* Truk Armada */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-500" />
                    Truk Armada Pengangkut:
                  </label>
                  <select
                    value={selectedFleetId}
                    onChange={(e) => handleFleetChange(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">-- Pilih Armada --</option>
                    {fleets.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nopol} - {f.vehicle_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Urutan Drop Rombongan */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Urutan Pengantaran ({selectedDrops.length} Resi Terpilih)
                  </span>
                  <span className="text-[11px] text-slate-400">Gunakan panah untuk atur</span>
                </div>

                {selectedDrops.length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                    Pilih minimal 2 resi milik {activeDriverObj?.name || "supir"} dari daftar di sebelah kiri.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDrops.map((item, idx) => (
                      <div
                        key={item.shipment.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                            {item.sequence}
                          </span>
                          <div className="min-w-0">
                            <div className="font-mono font-black text-slate-900 truncate">
                              {item.shipment.resi}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {item.shipment.destination_city} • {item.shipment.receiver_company}
                            </div>
                          </div>
                        </div>

                        {/* Control Arrows */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveUp(idx)}
                            disabled={idx === 0}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded disabled:opacity-20"
                            title="Pindah ke Atas"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => moveDown(idx)}
                            disabled={idx === selectedDrops.length - 1}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded disabled:opacity-20"
                            title="Pindah ke Bawah"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ringkasan & Total */}
              {selectedDrops.length > 0 && (
                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block">Total Muatan:</span>
                    <strong className="text-blue-900 font-extrabold text-sm">
                      {draftTotalColli} Koli • {draftTotalWeight} Kg
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block">Total Drop Point:</span>
                    <strong className="text-blue-900 font-extrabold text-sm">
                      {selectedDrops.length} Titik
                    </strong>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handlePublishTrip}
                disabled={submitting || selectedDrops.length < 2 || !selectedDriverId || !selectedFleetId}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menerbitkan Tugas Multi-Drop...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Terbitkan Tugas Multi-Drop ({selectedDrops.length} Drop)
                  </>
                )}
              </button>

              <div className="text-[11px] text-slate-400 flex items-start gap-1.5 leading-relaxed">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Resi milik supir ini yang tidak dicentang tetap berstatus reguler biasa.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
