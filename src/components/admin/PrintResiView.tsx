"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Printer,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Package,
  Calendar,
  MapPin,
  ExternalLink,
} from "lucide-react";

// Dynamic import for Barcode & QR Code to prevent SSR/hydration mismatch
const Barcode = dynamic(() => import("react-barcode"), { ssr: false });
const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeSVG),
  { ssr: false }
);

interface ShipmentPrintData {
  resi: string;
  reference_po: string | null;
  pin_code: string;
  sender_company: string;
  sender_contact: string;
  sender_phone: string;
  sender_address: string;
  origin_city: string;
  origin_province: string;
  origin_postal_code: string | null;
  receiver_company: string;
  receiver_contact: string;
  receiver_phone: string;
  receiver_address: string;
  destination_city: string;
  destination_province: string;
  destination_postal_code: string | null;
  service_type: string;
  service_name: string;
  has_insurance: boolean;
  actual_weight_kg: string;
  volume_weight_kg: string;
  total_colli: number;
  payment_method: string;
  notes: string | null;
  shipping_cost: string;
  insurance_cost: string;
  other_cost: string;
  total_cost: string;
  shipped_date: string;
  shipped_date_formatted?: string;
  estimated_days: string | null;
  inspected_by: string | null;
  fleet_nopol?: string | null;
  fleet_name?: string | null;
  driver_name?: string | null;
  items: Array<{
    id: number;
    item_name: string;
    qty: number;
    weight_kg: string;
    item_value: string;
  }>;
}

export default function PrintResiView({ shipment }: { shipment: ShipmentPrintData }) {
  const [mounted, setMounted] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState("http://localhost:3000");

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setCurrentOrigin(window.location.origin);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (val: string | number) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const trackUrl = `${currentOrigin}/track/${shipment.resi}`;

  return (
    <div className="bg-slate-100 min-h-screen py-6 px-4 sm:px-6 print:p-0 print:bg-white text-slate-800 font-sans">
      {/* Action Bar (Hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between no-print">
        <Link
          href="/admin/shipments"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Pengiriman</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={`/track/${shipment.resi}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            <span>Buka Lacak Publik</span>
          </Link>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Resi (Print / PDF)</span>
          </button>
        </div>
      </div>

      {/* Main Print Slip Sheet (A4 / A5 proportion) */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8 sm:p-10 print:shadow-none print:border-none print:p-4 print:rounded-none">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-900 pb-5 gap-4">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white print:border print:border-slate-800">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-wider text-slate-900">LIE CARGO</span>
              </div>
              <p className="text-[11px] font-semibold text-blue-600 tracking-wide uppercase">
                Smart Cargo Solutions
              </p>
            </div>
          </div>

          {/* Resi Center Info */}
          <div className="text-left sm:text-center">
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              RESI PENGIRIMAN
            </h1>
            <p className="text-sm font-mono font-bold text-blue-700 tracking-wider">
              {shipment.resi}
            </p>
          </div>

          {/* 1D Barcode */}
          <div className="flex flex-col items-start sm:items-end">
            {mounted ? (
              <Barcode
                value={shipment.resi}
                width={1.6}
                height={45}
                fontSize={11}
                margin={0}
                displayValue={false}
              />
            ) : (
              <div className="w-36 h-10 bg-slate-100 rounded animate-pulse" />
            )}
            <span className="text-[10px] font-mono text-slate-500 mt-1">
              PIN Verifikasi: <strong className="text-slate-900">{shipment.pin_code}</strong>
            </span>
          </div>
        </div>

        {/* 3-Column Info Grid: Pengirim, Penerima, Detail */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-5 border-b border-slate-200 text-xs">
          {/* Col 1: PENGIRIM */}
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              PENGIRIM
            </span>
            <p className="font-bold text-slate-900 text-sm">{shipment.sender_company}</p>
            <p className="text-slate-600 font-medium">U.P: {shipment.sender_contact}</p>
            <p className="text-slate-600">Telp: {shipment.sender_phone}</p>
            <p className="text-slate-500 text-[11px] leading-relaxed pt-1">
              {shipment.sender_address}
            </p>
            <p className="font-semibold text-slate-700 pt-0.5">
              {shipment.origin_city}, {shipment.origin_province}{" "}
              {shipment.origin_postal_code && `(${shipment.origin_postal_code})`}
            </p>
          </div>

          {/* Col 2: PENERIMA */}
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              PENERIMA
            </span>
            <p className="font-bold text-slate-900 text-sm">{shipment.receiver_company}</p>
            <p className="text-slate-600 font-medium">U.P: {shipment.receiver_contact}</p>
            <p className="text-slate-600">Telp: {shipment.receiver_phone}</p>
            <p className="text-slate-500 text-[11px] leading-relaxed pt-1">
              {shipment.receiver_address}
            </p>
            <p className="font-semibold text-slate-700 pt-0.5">
              {shipment.destination_city}, {shipment.destination_province}{" "}
              {shipment.destination_postal_code && `(${shipment.destination_postal_code})`}
            </p>
          </div>

          {/* Col 3: DETAIL PENGIRIMAN */}
          <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px]">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              DETAIL PENGIRIMAN
            </span>
            <div className="flex justify-between py-0.5 border-b border-slate-200/60">
              <span className="text-slate-500">Layanan:</span>
              <span className="font-bold text-slate-800">
                {shipment.service_type} ({shipment.service_name})
              </span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-200/60">
              <span className="text-slate-500">Tanggal Kirim:</span>
              <span className="font-semibold text-slate-800">
                {shipment.shipped_date_formatted || shipment.shipped_date.slice(0, 10)}
              </span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-200/60">
              <span className="text-slate-500">Pembayaran:</span>
              <span className="font-bold text-emerald-700">{shipment.payment_method}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-200/60">
              <span className="text-slate-500">Asuransi:</span>
              <span className="font-semibold text-slate-800">
                {shipment.has_insurance ? "Ya (Tercakup)" : "Tidak"}
              </span>
            </div>
            {shipment.reference_po && (
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">No. Referensi / PO:</span>
                <span className="font-mono font-bold text-slate-900">{shipment.reference_po}</span>
              </div>
            )}
          </div>
        </div>

        {/* Route Bar & ETA */}
        <div className="my-5 p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="font-black text-slate-800 text-sm uppercase">
              {shipment.origin_city}
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <span className="w-8 h-0.5 bg-blue-400"></span>
              <div className="px-2 py-0.5 bg-blue-600 text-white rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm">
                <Truck className="w-3 h-3" />
                <span>
                  {shipment.fleet_nopol || "B 9123 KRG"} • {shipment.driver_name || "Sopir Utama"}
                </span>
              </div>
              <span className="w-8 h-0.5 bg-blue-400"></span>
            </div>
            <div className="font-black text-slate-800 text-sm uppercase">
              {shipment.destination_city}
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              ESTIMASI TIBA
            </span>
            <span className="font-extrabold text-blue-900 text-sm">
              {shipment.estimated_days || "3 hari kerja"}
            </span>
          </div>
        </div>

        {/* Table Informasi Barang & Catatan vs Biaya */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-3">
          {/* Left 2/3: Informasi Barang Table */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                INFORMASI BARANG ({shipment.total_colli} Kolli, Total {shipment.actual_weight_kg} kg)
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 w-8 text-center">No</th>
                      <th className="px-3 py-2">Nama Barang</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Berat (kg)</th>
                      <th className="px-3 py-2 text-right">Nilai Barang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shipment.items.length > 0 ? (
                      shipment.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="px-3 py-2 text-center font-medium text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2 font-bold text-slate-800">{item.item_name}</td>
                          <td className="px-3 py-2 text-center font-semibold">{item.qty}</td>
                          <td className="px-3 py-2 text-right font-mono">
                            {Number(item.weight_kg).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-medium">
                            {formatRupiah(item.item_value)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-3 py-2 text-center">1</td>
                        <td className="px-3 py-2 font-bold text-slate-800">
                          Spare Part Mesin Industri
                        </td>
                        <td className="px-3 py-2 text-center font-semibold">1</td>
                        <td className="px-3 py-2 text-right font-mono">
                          {shipment.actual_weight_kg}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-medium">
                          {formatRupiah(2500000)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Catatan Pengiriman */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                CATATAN PENGIRIMAN
              </span>
              <p className="text-slate-700 italic">
                {shipment.notes || "Harap hati-hati barang presisi dan mudah lecet."}
              </p>
            </div>
          </div>

          {/* Right 1/3: Rincian Biaya Pengiriman */}
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                BIAYA PENGIRIMAN
              </span>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Ongkos Kirim:</span>
                  <span className="font-mono font-semibold">
                    {formatRupiah(shipment.shipping_cost)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Asuransi:</span>
                  <span className="font-mono font-semibold">
                    {formatRupiah(shipment.insurance_cost)}
                  </span>
                </div>
                {Number(shipment.other_cost) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Lainnya:</span>
                    <span className="font-mono font-semibold">
                      {formatRupiah(shipment.other_cost)}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-sm">TOTAL BIAYA:</span>
                  <span className="font-black text-blue-700 text-base font-mono">
                    {formatRupiah(shipment.total_cost)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800">
              <div className="flex items-center gap-1.5 font-bold mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Jaminan Pengiriman Aman</span>
              </div>
              <p className="text-[10px] text-emerald-700 leading-tight">
                Penerima wajib memeriksa kondisi fisik koli dan kemasan sebelum menandatangani bukti serah terima.
              </p>
            </div>
          </div>
        </div>

        {/* Footer: 2D QR Code & Signatures */}
        <div className="mt-8 pt-5 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-4 gap-6 text-xs">
          {/* QR Code Lacak Publik */}
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              SCAN UNTUK MELACAK
            </span>
            <div className="p-2 bg-white rounded-lg border border-slate-300 shadow-sm inline-block">
              {mounted ? (
                <QRCodeSVG value={trackUrl} size={84} level="M" />
              ) : (
                <div className="w-[84px] h-[84px] bg-slate-100 rounded animate-pulse" />
              )}
            </div>
            <span className="text-[9px] font-mono text-slate-400 mt-1">kargo.id/track/{shipment.resi}</span>
          </div>

          {/* Diperiksa Oleh */}
          <div className="flex flex-col justify-between text-center border border-dashed border-slate-300 rounded-xl p-3 h-32">
            <span className="text-[10px] font-bold text-slate-500 uppercase">DIPERIKSA OLEH</span>
            <div className="text-[10px] text-slate-400 italic">( Tanda Tangan & Cap )</div>
            <div className="border-t border-slate-300 pt-1 font-bold text-slate-800 text-[11px]">
              {shipment.inspected_by || "Admin Kargo"}
            </div>
          </div>

          {/* Diterima Oleh */}
          <div className="flex flex-col justify-between text-center border border-dashed border-slate-300 rounded-xl p-3 h-32">
            <span className="text-[10px] font-bold text-slate-500 uppercase">DITERIMA OLEH</span>
            <div className="text-[10px] text-slate-400 italic">( Tanda Tangan & Nama Terang )</div>
            <div className="border-t border-slate-300 pt-1 font-bold text-slate-800 text-[11px]">
              {shipment.receiver_contact}
            </div>
          </div>

          {/* Tanggal Terima */}
          <div className="flex flex-col justify-between text-center border border-dashed border-slate-300 rounded-xl p-3 h-32">
            <span className="text-[10px] font-bold text-slate-500 uppercase">TANGGAL TERIMA</span>
            <div className="text-[10px] text-slate-400 italic">Tgl: ..... / ..... / 202...</div>
            <div className="border-t border-slate-300 pt-1 font-bold text-slate-800 text-[11px]">
              Stempel Perusahaan Penerima
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
