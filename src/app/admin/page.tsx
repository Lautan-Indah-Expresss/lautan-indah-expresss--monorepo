import React from "react";
import Link from "next/link";
import { db } from "@/db";
import { shipments } from "@/db/schema";
import { desc, eq, or } from "drizzle-orm";
import DashboardCharts from "@/components/admin/DashboardCharts";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Navigation,
  Calendar,
  Receipt,
  History as HistoryIcon,
  Eye,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

// Dynamic server component

export default async function AdminDashboardPage() {
  // Query shipments from MySQL lie-db
  const allShipments = await db.select().from(shipments).orderBy(desc(shipments.created_at));

  const totalCount = allShipments.length;
  const dalamPengirimanCount = allShipments.filter((s) => s.status === "dalam_pengiriman").length;
  const terkirimCount = allShipments.filter((s) => s.status === "terkirim").length;
  const tertundaCount = allShipments.filter((s) => s.status === "tertunda").length;
  const kendalaCount = allShipments.filter((s) => s.status === "kendala" || s.status === "komplain").length;

  const recentShipments = allShipments.slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "dalam_pengiriman":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            Dalam Pengiriman
          </span>
        );
      case "terkirim":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Terkirim
          </span>
        );
      case "tertunda":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Tertunda
          </span>
        );
      case "kendala":
      case "komplain":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
            {status === "kendala" ? "Kendala" : "Komplain"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard Ringkasan</h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau ringkasan performa pengiriman kargo dan operasional armada secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/shipments/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Buat Pengiriman</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Total Pengiriman */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Total Pengiriman</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900">{totalCount}</div>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +12.5%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">vs bulan sebelumnya</p>
        </div>

        {/* KPI 2: Dalam Pengiriman */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Dalam Pengiriman</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900">{dalamPengirimanCount}</div>
            <span className="inline-flex items-center text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +8.2%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">sedang di perjalanan</p>
        </div>

        {/* KPI 3: Terkirim */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Terkirim</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900">{terkirimCount}</div>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +14.1%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">selesai diterima tujuan</p>
        </div>

        {/* KPI 4: Tertunda / Kendala */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Tertunda & Kendala</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900">
              {tertundaCount + kendalaCount}
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> -2.4%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {kendalaCount > 0 ? `${kendalaCount} laporan kendala aktif` : "menunggu muat/jalan"}
          </p>
        </div>
      </div>

      {/* Interactive Charts Component */}
      <DashboardCharts
        totalCount={totalCount}
        dalamPengirimanCount={dalamPengirimanCount}
        terkirimCount={terkirimCount}
        tertundaCount={tertundaCount}
        kendalaCount={kendalaCount}
      />

      {/* Bottom Row: Recent Shipments & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Pengiriman Terbaru Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                Pengiriman Terbaru
              </h3>
              <p className="text-xs text-slate-500">
                5 Surat Jalan kargo terbaru dari database
              </p>
            </div>
            <Link
              href="/admin/shipments"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Lihat Semua
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">No. Resi</th>
                  <th className="px-5 py-3">Pelanggan</th>
                  <th className="px-5 py-3">Tujuan</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Estimasi Tiba</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentShipments.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold font-mono text-slate-900">
                      <Link
                        href={`/admin/shipments/${s.resi}/print`}
                        className="text-blue-600 hover:underline flex items-center gap-1.5"
                      >
                        <Package className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        {s.resi}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">{s.receiver_company}</div>
                      <div className="text-[10px] text-slate-400">Dari: {s.sender_company}</div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">
                      {s.destination_city}
                    </td>
                    <td className="px-5 py-3.5">{getStatusBadge(s.status)}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-500">
                      {s.estimated_days || "3 hari kerja"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/shipments/${s.resi}/print`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-lg text-[11px] font-semibold transition-colors"
                        title="Lihat / Cetak Resi"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Resi</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1/3: Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight mb-1">
              Aksi Cepat
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Pintasan cepat untuk alur operasional harian
            </p>

            <div className="space-y-3">
              <Link
                href="/admin/shipments/create"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                      Buat Pengiriman Baru
                    </div>
                    <div className="text-[11px] text-slate-500">Input surat jalan & penugasan</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </Link>

              <Link
                href="/"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                      Tracking Pengiriman
                    </div>
                    <div className="text-[11px] text-slate-500">Peta live polyline armada</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </Link>

              {/* <Link
                href="/admin/schedule"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                      Jadwal Penjemputan
                    </div>
                    <div className="text-[11px] text-slate-500">Kalender pickup kargo</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </Link> */}

              <Link
                href="/admin/history"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <HistoryIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                      Histori Pengiriman
                    </div>
                    <div className="text-[11px] text-slate-500">Arsip resi & foto POD</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </Link>
            </div>
          </div>

          {/* <div className="mt-5 p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900">
            <span className="font-bold block mb-1">Status MySQL Laragon</span>
            <span className="text-[11px] text-slate-600 block">
              Terkoneksi ke database <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">lie-db</code> (6 tabel aktif).
            </span>
          </div> */}
        </div>
      </div>
    </div>
  );
}
