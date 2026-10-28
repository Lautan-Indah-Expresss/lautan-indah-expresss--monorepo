import React, { useState, useMemo } from 'react';
import { Shipment } from '../../types';
import { exportShipmentsToCsv, exportDriverRecapToCsv } from '../../services/exportExcel';
import {
  BarChart3,
  Download,
  Calendar,
  Truck,
  Users,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
} from 'lucide-react';

interface AdminReportsProps {
  shipments: Shipment[];
}

export const AdminReports: React.FC<AdminReportsProps> = ({ shipments }) => {
  const [timeRange, setTimeRange] = useState<'harian' | 'mingguan' | 'bulanan'>('bulanan');
  const [activeReportTab, setActiveReportTab] = useState<'driver' | 'absensi' | 'armada' | 'tujuan'>('driver');

  // Driver metrics aggregation
  const driverStats = useMemo(() => {
    const map = new Map<
      string,
      {
        driverName: string;
        totalTrips: number;
        completedTrips: number;
        claimTrips: number;
        totalKoli: number;
        lastTripDate: string;
      }
    >();

    shipments.forEach((s) => {
      const existing = map.get(s.driverName) || {
        driverName: s.driverName,
        totalTrips: 0,
        completedTrips: 0,
        claimTrips: 0,
        totalKoli: 0,
        lastTripDate: s.date,
      };

      existing.totalTrips += 1;
      if (s.status === 'Selesai') existing.completedTrips += 1;
      if (s.status === 'Selisih/Claim') existing.claimTrips += 1;
      existing.totalKoli += s.totalQtyLoaded;
      map.set(s.driverName, existing);
    });

    return Array.from(map.values());
  }, [shipments]);

  // Truck metrics aggregation
  const truckStats = useMemo(() => {
    const map = new Map<
      string,
      {
        plateNumber: string;
        totalTrips: number;
        totalKoli: number;
        destinations: Set<string>;
      }
    >();

    shipments.forEach((s) => {
      const existing = map.get(s.plateNumber) || {
        plateNumber: s.plateNumber,
        totalTrips: 0,
        totalKoli: 0,
        destinations: new Set<string>(),
      };

      existing.totalTrips += 1;
      existing.totalKoli += s.totalQtyLoaded;
      existing.destinations.add(s.destinationCity);
      map.set(s.plateNumber, existing);
    });

    return Array.from(map.values()).map((t) => ({
      ...t,
      destinationsCount: t.destinations.size,
    }));
  }, [shipments]);

  // Destination metrics aggregation
  const destinationStats = useMemo(() => {
    const map = new Map<
      string,
      {
        destinationCity: string;
        totalTrips: number;
        totalKoli: number;
        claimsCount: number;
      }
    >();

    shipments.forEach((s) => {
      const city = s.destinationCity || s.destination;
      const existing = map.get(city) || {
        destinationCity: city,
        totalTrips: 0,
        totalKoli: 0,
        claimsCount: 0,
      };

      existing.totalTrips += 1;
      existing.totalKoli += s.totalQtyLoaded;
      if (s.status === 'Selisih/Claim') existing.claimsCount += 1;
      map.set(city, existing);
    });

    return Array.from(map.values());
  }, [shipments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-600" />
            <span>Laporan Rekapitulasi Operasional &amp; Absensi</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Analisis ritase armada, kepatuhan absensi GPS sopir, dan efektivitas pengiriman PT LAUTAN INDAH Express.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Period selector */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold shadow-xs">
            <button
              onClick={() => setTimeRange('harian')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === 'harian' ? 'bg-teal-600 text-white font-bold' : 'text-slate-600'
              }`}
            >
              Harian
            </button>
            <button
              onClick={() => setTimeRange('mingguan')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === 'mingguan' ? 'bg-teal-600 text-white font-bold' : 'text-slate-600'
              }`}
            >
              Mingguan
            </button>
            <button
              onClick={() => setTimeRange('bulanan')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === 'bulanan' ? 'bg-teal-600 text-white font-bold' : 'text-slate-600'
              }`}
            >
              Bulanan
            </button>
          </div>

          <button
            type="button"
            onClick={() => exportShipmentsToCsv(shipments, `Laporan-Rekap-${timeRange}.csv`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Tab Selector */}
      <div className="flex border-b border-slate-200 space-x-4 text-xs font-bold">
        <button
          onClick={() => setActiveReportTab('driver')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
            activeReportTab === 'driver'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Performa Driver ({driverStats.length})</span>
        </button>

        <button
          onClick={() => setActiveReportTab('absensi')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
            activeReportTab === 'absensi'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Rekap Absensi &amp; GPS Sopir</span>
        </button>

        <button
          onClick={() => setActiveReportTab('armada')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
            activeReportTab === 'armada'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Utilisasi Armada</span>
        </button>

        <button
          onClick={() => setActiveReportTab('tujuan')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
            activeReportTab === 'tujuan'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Rekap Kota Tujuan</span>
        </button>
      </div>

      {/* TAB 1: PERFORMA DRIVER */}
      {activeReportTab === 'driver' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Tabel Rekapitulasi Pengiriman Per Sopir / Kurir
            </h3>
            <button
              onClick={() => exportDriverRecapToCsv(shipments)}
              className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              Download Rekap Driver CSV
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-200">
                <th className="p-3 text-center w-12">No</th>
                <th className="p-3">Nama Pengemudi</th>
                <th className="p-3 text-center">Total Ritase</th>
                <th className="p-3 text-center">Selesai Sukses</th>
                <th className="p-3 text-center">Total Koli Diantar</th>
                <th className="p-3 text-center">Kasus Klaim</th>
                <th className="p-3 text-center">Tingkat Ketepatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driverStats.map((driver, idx) => {
                const successRate = driver.totalTrips > 0
                  ? Math.round((driver.completedTrips / driver.totalTrips) * 100)
                  : 100;

                return (
                  <tr key={driver.driverName} className="hover:bg-slate-50/50">
                    <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        {driver.driverName}
                      </div>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-900">
                      {driver.totalTrips} Ritase
                    </td>
                    <td className="p-3 text-center font-bold text-emerald-700">
                      {driver.completedTrips} Ritase
                    </td>
                    <td className="p-3 text-center font-bold text-teal-800">
                      {driver.totalKoli} Koli
                    </td>
                    <td className="p-3 text-center">
                      {driver.claimTrips > 0 ? (
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {driver.claimTrips} Klaim
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">0</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-mono font-bold text-slate-800">
                        {successRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* TAB 2: REKAP ABSENSI SOPIR */}
      {activeReportTab === 'absensi' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Rekap Log Absensi Check In &amp; Check Out GPS Sopir
            </h3>
            <button
              onClick={() => exportDriverRecapToCsv(shipments)}
              className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              Download Log Absensi
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-200">
                  <th className="p-3 text-center w-12">No</th>
                  <th className="p-3">Sopir &amp; Plat</th>
                  <th className="p-3">No. SJ</th>
                  <th className="p-3">Check In Berangkat</th>
                  <th className="p-3">Lokasi Check In</th>
                  <th className="p-3">Check Out Tiba</th>
                  <th className="p-3">Lokasi Check Out</th>
                  <th className="p-3 text-center">Verifikasi Foto GPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shipments.map((s, idx) => {
                  const cin = s.attendance.checkIn;
                  const cout = s.attendance.checkOut;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{s.driverName}</div>
                        <div className="font-mono text-[10px] text-slate-500">{s.plateNumber}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-teal-800">{s.sjNumber}</td>
                      <td className="p-3 text-slate-700 font-medium">
                        {cin ? cin.formattedTime : <span className="text-slate-400 italic">Belum</span>}
                      </td>
                      <td className="p-3 text-slate-600 max-w-[180px] truncate" title={cin?.locationName}>
                        {cin ? cin.locationName : '-'}
                      </td>
                      <td className="p-3 text-slate-700 font-medium">
                        {cout ? cout.formattedTime : <span className="text-slate-400 italic">Belum</span>}
                      </td>
                      <td className="p-3 text-slate-600 max-w-[180px] truncate" title={cout?.locationName}>
                        {cout ? cout.locationName : '-'}
                      </td>
                      <td className="p-3 text-center">
                        {cin || cout ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Watermark OK
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: UTILISASI ARMADA */}
      {activeReportTab === 'armada' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Rekapitulasi Utilisasi Truk &amp; Muatan Koli
            </h3>
          </div>

          <div className="overflow-x-auto custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-200">
                <th className="p-3 text-center w-12">No</th>
                <th className="p-3">No. Polisi Armada</th>
                <th className="p-3 text-center">Total Pengiriman</th>
                <th className="p-3 text-center">Total Muatan (Koli)</th>
                <th className="p-3 text-center">Kota Jangkauan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {truckStats.map((trk, idx) => (
                <tr key={trk.plateNumber} className="hover:bg-slate-50/50">
                  <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                  <td className="p-3 font-mono font-bold text-blue-950 text-sm">
                    {trk.plateNumber}
                  </td>
                  <td className="p-3 text-center font-bold text-slate-900">
                    {trk.totalTrips} Ritase
                  </td>
                  <td className="p-3 text-center font-bold text-teal-800">
                    {trk.totalKoli} Koli
                  </td>
                  <td className="p-3 text-center font-semibold text-slate-700">
                    {trk.destinationsCount} Kota Tujuan
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* TAB 4: REKAP KOTA TUJUAN */}
      {activeReportTab === 'tujuan' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Rekap Distribusi Barang Per Kota / Gudang Tujuan
            </h3>
          </div>

          <div className="overflow-x-auto custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-200">
                <th className="p-3 text-center w-12">No</th>
                <th className="p-3">Kota / Gudang Hub</th>
                <th className="p-3 text-center">Volume Ritase</th>
                <th className="p-3 text-center">Total Koli Masuk</th>
                <th className="p-3 text-center">Status Klaim Masuk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {destinationStats.map((dest, idx) => (
                <tr key={dest.destinationCity} className="hover:bg-slate-50/50">
                  <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                  <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    {dest.destinationCity}
                  </td>
                  <td className="p-3 text-center font-bold text-slate-900">
                    {dest.totalTrips} Pengiriman
                  </td>
                  <td className="p-3 text-center font-bold text-teal-800">
                    {dest.totalKoli} Koli
                  </td>
                  <td className="p-3 text-center">
                    {dest.claimsCount > 0 ? (
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {dest.claimsCount} Klaim
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold">Aman (0 Klaim)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
};
