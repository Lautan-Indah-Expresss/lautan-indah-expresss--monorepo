"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ChartProps {
  totalCount: number;
  dalamPengirimanCount: number;
  terkirimCount: number;
  tertundaCount: number;
  kendalaCount: number;
}

export default function DashboardCharts({
  totalCount,
  dalamPengirimanCount,
  terkirimCount,
  tertundaCount,
  kendalaCount,
}: ChartProps) {
  const [mounted, setMounted] = useState(false);
  const [timeRange, setTimeRange] = useState("7hari");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 h-[340px] animate-pulse bg-slate-100" />
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 h-[340px] animate-pulse bg-slate-100" />
      </div>
    );
  }

  // 7-day trend data
  const trendData = [
    { day: "Senin", kirim: 18, selesai: 14 },
    { day: "Selasa", kirim: 24, selesai: 19 },
    { day: "Rabu", kirim: 22, selesai: 20 },
    { day: "Kamis", kirim: 30, selesai: 25 },
    { day: "Jumat", kirim: 28, selesai: 26 },
    { day: "Sabtu", kirim: 35, selesai: 31 },
    { day: "Minggu", kirim: Math.max(totalCount * 5, 20), selesai: Math.max(terkirimCount * 4, 15) },
  ];

  // Donut chart status data
  const pieData = [
    { name: "Terkirim", value: terkirimCount || 1, color: "#10B981" },
    { name: "Dalam Pengiriman", value: dalamPengirimanCount || 2, color: "#3B82F6" },
    { name: "Tertunda", value: tertundaCount || 1, color: "#F59E0B" },
    { name: "Kendala", value: kendalaCount || 1, color: "#EF4444" },
  ];

  const pieTotal = pieData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* 2/3 Column: Area Line Chart */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">
              Grafik Pengiriman
            </h3>
            <p className="text-xs text-slate-500">
              Tren volume kargo dan penyelesaian barang minggu ini
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                Pengiriman
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Terkirim
              </span>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="7hari">7 Hari Terakhir</option>
              <option value="30hari">30 Hari Terakhir</option>
              <option value="bulan">Bulan Ini</option>
            </select>
          </div>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorKirim" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorSelesai" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#64748B" }}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748B" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="kirim"
                name="Pengiriman"
                stroke="#2563EB"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorKirim)"
              />
              <Area
                type="monotone"
                dataKey="selesai"
                name="Terkirim"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorSelesai)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 1/3 Column: Donut Status Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800 tracking-tight">
            Status Pengiriman
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Komposisi status operasional saat ini
          </p>

          <div className="relative h-[180px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "0.5rem",
                    fontSize: "11px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Count */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-slate-800">{pieTotal}</span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total</span>
            </div>
          </div>
        </div>

        {/* Legend List */}
        <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
          {pieData.map((item, idx) => {
            const pct = Math.round((item.value / (pieTotal || 1)) * 100);
            return (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-600 font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{item.value}</span>
                  <span className="text-[10px] text-slate-400 w-8 text-right font-mono">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
