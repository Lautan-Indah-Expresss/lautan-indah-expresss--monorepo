"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Truck,
  CheckCircle2,
  Calendar,
  Building2,
  MapPin,
  ShieldCheck,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  FileText,
  User,
} from "lucide-react";

interface CustomerOption {
  id: number;
  company_name: string;
  contact_name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
}

interface FleetOption {
  id: number;
  nopol: string;
  vehicle_name: string;
  default_driver_id: number | null;
  default_driver_name: string | null;
  status: string;
}

interface DriverOption {
  id: number;
  name: string;
  username: string;
  phone: string;
}

interface ItemRow {
  item_name: string;
  qty: number;
  weight_kg: number;
  item_value: number;
}

export default function CreateShipmentWizardPage() {
  const router = useRouter();

  // Wizard active step: 1 (Detail Pengiriman) -> 2 (Barang & Muatan) -> 3 (Konfirmasi & Resi)
  const [currentStep, setCurrentStep] = useState(1);

  // Data sources
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [fleets, setFleets] = useState<FleetOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Pengirim Statis: LIE Cargo (PT Lautan Indah Express)
  const senderFixed = {
    company: "PT Lautan Indah Express (LIE Cargo)",
    contact: "Dispatch Office (Admin Kargo)",
    phone: "0812-3456-7890",
    address: "Jl. Pergudangan Utama No. 88, Kamal Muara, Penjaringan",
    city: "Jakarta Utara",
    province: "DKI Jakarta",
    postal: "14470",
  };

  // Step 1: Penerima / Pelanggan & Penugasan Armada
  const [receiverCustId, setReceiverCustId] = useState<string>("");
  const [receiverCompany, setReceiverCompany] = useState("");
  const [receiverContact, setReceiverContact] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [receiverCity, setReceiverCity] = useState("Bandung");
  const [receiverProvince, setReceiverProvince] = useState("Jawa Barat");
  const [receiverPostal, setReceiverPostal] = useState("40266");

  const [shipDate, setShipDate] = useState("2026-10-25");
  const [selectedFleetId, setSelectedFleetId] = useState<string>("");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [preChecklist, setPreChecklist] = useState(true);

  // Step 2: Barang & Muatan
  const [items, setItems] = useState<ItemRow[]>([
    {
      item_name: "Spare Part Mesin Industri",
      qty: 1,
      weight_kg: 5.2,
      item_value: 2500000,
    },
  ]);
  const [referencePO, setReferencePO] = useState("");
  const [notes, setNotes] = useState("");

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadMaster() {
      try {
        const [resCust, resFleet, resDriver] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/fleets"),
          fetch("/api/drivers"),
        ]);
        const dataCust = await resCust.json();
        const dataFleet = await resFleet.json();
        const dataDriver = await resDriver.json();

        if (dataCust.success && dataCust.data.length > 0) {
          setCustomers(dataCust.data);
          const defaultCust = dataCust.data[0];
          setReceiverCustId(String(defaultCust.id));
          setReceiverCompany(defaultCust.company_name);
          setReceiverContact(defaultCust.contact_name);
          setReceiverPhone(defaultCust.phone);
          setReceiverAddress(defaultCust.address);
          setReceiverCity(defaultCust.city);
          setReceiverProvince(defaultCust.province);
          setReceiverPostal(defaultCust.postal_code);
        }

        if (dataFleet.success && dataFleet.data.length > 0) {
          setFleets(dataFleet.data);
          const firstFleet = dataFleet.data[0];
          setSelectedFleetId(String(firstFleet.id));
          if (firstFleet.default_driver_id) {
            setSelectedDriverId(String(firstFleet.default_driver_id));
          }
        }

        if (dataDriver.success) {
          setDrivers(dataDriver.data);
        }
      } catch (err) {
        console.error("Master load error:", err);
      } finally {
        setLoadingData(false);
      }
    }
    loadMaster();
  }, []);

  const handleReceiverSelect = (idStr: string) => {
    setReceiverCustId(idStr);
    const found = customers.find((c) => String(c.id) === idStr);
    if (found) {
      setReceiverCompany(found.company_name);
      setReceiverContact(found.contact_name);
      setReceiverPhone(found.phone);
      setReceiverAddress(found.address);
      setReceiverCity(found.city);
      setReceiverProvince(found.province);
      setReceiverPostal(found.postal_code);
    }
  };

  const handleFleetChange = (fleetIdStr: string) => {
    setSelectedFleetId(fleetIdStr);
    const found = fleets.find((f) => String(f.id) === fleetIdStr);
    if (found && found.default_driver_id) {
      setSelectedDriverId(String(found.default_driver_id));
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        item_name: "",
        qty: 1,
        weight_kg: 1.0,
        item_value: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof ItemRow, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Calculations
  const totalWeight = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.weight_kg) || 0) * (Number(it.qty) || 1), 0);
  }, [items]);

  const totalColli = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.qty) || 1), 0);
  }, [items]);

  const estimatedArrivalDate = useMemo(() => {
    if (!shipDate) return { dateFormatted: "-", daysText: "-" };
    const parts = shipDate.split("-");
    const y = parseInt(parts[0], 10) || 2026;
    const m = (parseInt(parts[1], 10) || 1) - 1;
    const day = parseInt(parts[2], 10) || 1;
    const d = new Date(y, m, day);
    d.setDate(d.getDate() + 3);
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ];
    return {
      dateFormatted: `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,
      daysText: `3 hari kerja`,
    };
  }, [shipDate]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (currentStep === 1) {
      if (!receiverCompany || !receiverCity || !receiverContact) {
        setErrorMessage("Silakan lengkapi informasi tujuan / penerima kargo.");
        return;
      }
      if (!preChecklist) {
        setErrorMessage("Ceklist kesiapan armada awal wajib dicentang oleh Admin.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const hasEmptyName = items.some((it) => !it.item_name.trim());
      if (hasEmptyName) {
        setErrorMessage("Nama barang pada tiap baris wajib diisi.");
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleSubmitFinal = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        sender_customer_id: null,
        receiver_customer_id: receiverCustId ? Number(receiverCustId) : null,
        fleet_id: selectedFleetId ? Number(selectedFleetId) : null,
        driver_id: selectedDriverId ? Number(selectedDriverId) : null,
        sender_company: senderFixed.company,
        sender_contact: senderFixed.contact,
        sender_phone: senderFixed.phone,
        sender_address: senderFixed.address,
        origin_city: senderFixed.city,
        origin_province: senderFixed.province,
        origin_postal_code: senderFixed.postal,
        receiver_company: receiverCompany,
        receiver_contact: receiverContact,
        receiver_phone: receiverPhone,
        receiver_address: receiverAddress,
        destination_city: receiverCity,
        destination_province: receiverProvince,
        destination_postal_code: receiverPostal,
        service_type: "Reguler",
        service_name: "Pengiriman Biasa",
        has_insurance: false,
        actual_weight_kg: totalWeight.toFixed(2),
        volume_weight_kg: totalWeight.toFixed(2),
        total_colli: totalColli,
        payment_method: "Prepaid",
        notes: notes || null,
        reference_po: referencePO || null,
        shipping_cost: "0.00",
        insurance_cost: "0.00",
        other_cost: "0.00",
        total_cost: "0.00",
        pre_departure_checked: preChecklist,
        items: items.map((it) => ({
          item_name: it.item_name || "Barang Kargo",
          qty: Number(it.qty) || 1,
          weight_kg: Number(it.weight_kg) || 1,
          item_value: Number(it.item_value) || 0,
        })),
      };

      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat surat jalan pengiriman");
      }

      router.push(`/admin/shipments/${data.resi}/print`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Terjadi kesalahan sistem saat membuat pengiriman");
      }
      setSubmitting(false);
    }
  };

  const selectedFleet = fleets.find((f) => String(f.id) === selectedFleetId);
  const selectedDriver = drivers.find((d) => String(d.id) === selectedDriverId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
          <Link href="/admin" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/admin/shipments" className="hover:text-blue-600 transition-colors">
            Pengiriman
          </Link>
          <span>/</span>
          <span className="text-slate-700">Buat Surat Jalan</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Buat Pengiriman Baru</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Pengirim default: <strong className="text-slate-700">{senderFixed.company}</strong> ({senderFixed.city})
        </p>
      </div>

      {/* Stepper Tabs Bar (3 Steps: Detail -> Barang -> Konfirmasi) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="grid grid-cols-3 gap-3 text-xs">
          {[
            { num: 1, label: "Detail Pengiriman" },
            { num: 2, label: "Barang & Muatan" },
            { num: 3, label: "Konfirmasi & Resi" },
          ].map((st) => (
            <button
              type="button"
              key={st.num}
              onClick={() => setCurrentStep(st.num)}
              className={`flex items-center justify-center sm:justify-start gap-2.5 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                currentStep === st.num
                  ? "bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-xs"
                  : currentStep > st.num
                  ? "text-slate-700 font-semibold hover:bg-slate-50"
                  : "text-slate-400 font-medium"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  currentStep === st.num
                    ? "bg-blue-600 text-white font-bold"
                    : currentStep > st.num
                    ? "bg-emerald-500 text-white font-bold"
                    : "bg-slate-200 text-slate-600 font-bold"
                }`}
              >
                {currentStep > st.num ? "✓" : st.num}
              </div>
              <span className="truncate hidden sm:inline">{st.label}</span>
            </button>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Wizard Step Views Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        {/* ================= STEP 1: DETAIL PENGIRIMAN ================= */}
        {currentStep === 1 && (
          <form onSubmit={handleNext} className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">Langkah 1: Tujuan & Penugasan Armada</h3>
                  <p className="text-xs text-slate-500">Pilih pelanggan penerima serta armada & sopir bertugas</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                Step 1/3
              </span>
            </div>

            {/* Banner Pengirim Tetap */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Pengirim (Asal Muatan)
                </span>
                <span className="font-bold text-slate-800 text-sm">{senderFixed.company}</span>
                <span className="text-slate-500 block">{senderFixed.address}, {senderFixed.city}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Hub Pusat Jakarta
              </span>
            </div>

            {/* Penerima / Pelanggan Form */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">Pilih Pelanggan / Penerima *</label>
                    <Link href="/admin/customers" className="text-[11px] font-bold text-blue-600 hover:underline">
                      + Tambah Baru
                    </Link>
                  </div>
                  <select
                    value={receiverCustId}
                    onChange={(e) => handleReceiverSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">-- Pilih dari Master Pelanggan --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name} ({c.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Perusahaan Penerima *</label>
                  <input
                    type="text"
                    required
                    value={receiverCompany}
                    onChange={(e) => setReceiverCompany(e.target.value)}
                    placeholder="CV. Maju Bersama"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Kontak PIC *</label>
                  <input
                    type="text"
                    required
                    value={receiverContact}
                    onChange={(e) => setReceiverContact(e.target.value)}
                    placeholder="Hendra Gunawan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telepon / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    placeholder="081377889900"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap Tujuan *</label>
                <textarea
                  required
                  rows={2}
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  placeholder="Jl. Soekarno Hatta No. 512, Batununggal"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kota Tujuan *</label>
                  <input
                    type="text"
                    required
                    value={receiverCity}
                    onChange={(e) => setReceiverCity(e.target.value)}
                    placeholder="Bandung"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={receiverProvince}
                    onChange={(e) => setReceiverProvince(e.target.value)}
                    placeholder="Jawa Barat"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Pos</label>
                  <input
                    type="text"
                    value={receiverPostal}
                    onChange={(e) => setReceiverPostal(e.target.value)}
                    placeholder="40266"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Penugasan Armada & No. Plat */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Penugasan Armada & Sopir</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Berangkat *</label>
                  <input
                    type="date"
                    required
                    value={shipDate}
                    onChange={(e) => setShipDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih No. Plat Armada *</label>
                  <select
                    value={selectedFleetId}
                    onChange={(e) => handleFleetChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">-- Pilih Armada --</option>
                    {fleets.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nopol} - {f.vehicle_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Sopir Bertugas *</label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">-- Pilih Sopir --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} (@{d.username})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preChecklist}
                    onChange={(e) => setPreChecklist(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-800 leading-tight">
                    <strong>Ceklist Kesiapan Armada & Muatan Awal (Oleh Admin)</strong>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      Pemeriksaan fisik armada, ban, rem, dan surat jalan telah diverifikasi aman sebelum diberangkatkan.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {/* Next Button */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <span>Lanjut ke Barang & Muatan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 2: BARANG & MUATAN ================= */}
        {currentStep === 2 && (
          <form onSubmit={handleNext} className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">Langkah 2: Rincian Barang Muatan</h3>
                  <p className="text-xs text-slate-500">Tambahkan barang yang akan dibawa oleh armada</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Baris Barang</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">Barang #{idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Nama Barang / Kargo *
                      </label>
                      <input
                        type="text"
                        required
                        value={item.item_name}
                        onChange={(e) => handleItemChange(idx, "item_name", e.target.value)}
                        placeholder="Misal: Spare Part Mesin Industri"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Jumlah (Koli / Box) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.qty}
                        onChange={(e) => handleItemChange(idx, "qty", parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-center font-bold focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Berat Satuan (kg) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        required
                        value={item.weight_kg}
                        onChange={(e) => handleItemChange(idx, "weight_kg", parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-right font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Bar */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
              <span className="font-bold text-blue-900">Total Muatan Terhitung:</span>
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-slate-500">Total Koli: </span>
                  <strong className="text-slate-900">{totalColli} Box</strong>
                </div>
                <div>
                  <span className="text-slate-500">Total Berat: </span>
                  <strong className="font-mono text-slate-900">{totalWeight.toFixed(2)} kg</strong>
                </div>
              </div>
            </div>

            {/* Referensi & Catatan Tambahan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Referensi / PO (Opsional)</label>
                <input
                  type="text"
                  value={referencePO}
                  onChange={(e) => setReferencePO(e.target.value)}
                  placeholder="PO-2024-05-9921"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan untuk Sopir (Opsional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Barang presisi, jangan ditumpuk"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <span>Lanjut ke Konfirmasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 3: KONFIRMASI & TERBITKAN RESI ================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">Langkah 3: Konfirmasi Terbit Surat Jalan</h3>
                  <p className="text-xs text-slate-500">Periksa kembali data muatan sebelum mencetak resi resmi</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                Final Step
              </span>
            </div>

            {/* Summary Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Origin -> Destination Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  RUTE PENGIRIMAN
                </span>
                <div className="flex items-center gap-2 font-black text-slate-800 text-sm">
                  <span>{senderFixed.city}</span>
                  <span className="text-blue-600">→</span>
                  <span className="text-blue-700">{receiverCity}</span>
                </div>
                <div className="text-slate-600 pt-1">
                  <strong>Penerima:</strong> {receiverCompany} (U.P: {receiverContact})
                </div>
                <div className="text-slate-500">{receiverAddress}</div>
              </div>

              {/* Fleet & Driver Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  PENUGASAN ARMADA
                </span>
                <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5 font-mono">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>{selectedFleet?.nopol || "-"}</span>
                  <span className="text-xs font-sans text-slate-500">({selectedFleet?.vehicle_name || "-"})</span>
                </div>
                <div className="text-slate-600 pt-1">
                  <strong>Sopir:</strong> {selectedDriver?.name || "-"} (@{selectedDriver?.username || "-"})
                </div>
                <div className="text-slate-500">
                  Estimasi Tiba: <strong>{estimatedArrivalDate.dateFormatted}</strong> ({estimatedArrivalDate.daysText})
                </div>
              </div>
            </div>

            {/* Cargo Table Preview */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Nama Barang</th>
                    <th className="px-3 py-2 text-center">Koli</th>
                    <th className="px-3 py-2 text-right">Berat (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-bold text-slate-800">{it.item_name}</td>
                      <td className="px-3 py-2 text-center">{it.qty} Box</td>
                      <td className="px-3 py-2 text-right font-mono">{it.weight_kg} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes / PO Preview if available */}
            {(referencePO || notes) && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                {referencePO && (
                  <div>
                    <span className="text-slate-500">No. Referensi / PO: </span>
                    <strong className="font-mono text-slate-800">{referencePO}</strong>
                  </div>
                )}
                {notes && (
                  <div>
                    <span className="text-slate-500">Catatan Sopir: </span>
                    <span className="italic text-slate-700">{notes}</span>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Ubah Data</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitFinal}
                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menerbitkan Surat Jalan...</span>
                  </>
                ) : (
                  <>
                    <span>Terbitkan & Cetak Resi Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
