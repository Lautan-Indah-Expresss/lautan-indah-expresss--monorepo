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
  HelpCircle,
  AlertCircle,
  Loader2,
  FileText,
  DollarSign,
  Layers,
  ChevronRight,
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

export default function CreateShipmentPage() {
  const router = useRouter();

  // Data sources
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [fleets, setFleets] = useState<FleetOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // 4-Step Stepper Active Step
  const [currentStep, setCurrentStep] = useState(1);

  // Form: Sender
  const [senderCustId, setSenderCustId] = useState<string>("");
  const [senderCompany, setSenderCompany] = useState("");
  const [senderContact, setSenderContact] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [senderCity, setSenderCity] = useState("Jakarta Timur");
  const [senderProvince, setSenderProvince] = useState("DKI Jakarta");
  const [senderPostal, setSenderPostal] = useState("13920");

  // Form: Receiver
  const [receiverCustId, setReceiverCustId] = useState<string>("");
  const [receiverCompany, setReceiverCompany] = useState("");
  const [receiverContact, setReceiverContact] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [receiverCity, setReceiverCity] = useState("Bandung");
  const [receiverProvince, setReceiverProvince] = useState("Jawa Barat");
  const [receiverPostal, setReceiverPostal] = useState("40266");

  // Form: Detail & Fleet
  const [shipDate, setShipDate] = useState("2026-10-25");
  const [selectedFleetId, setSelectedFleetId] = useState<string>("");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [preChecklist, setPreChecklist] = useState(true);
  const [serviceType, setServiceType] = useState<"Reguler" | "Express">("Reguler");
  const [hasInsurance, setHasInsurance] = useState(true);
  const [notes, setNotes] = useState("");
  const [referencePO, setReferencePO] = useState("");

  // Form: Items (Dynamic Rows)
  const [items, setItems] = useState<ItemRow[]>([
    {
      item_name: "Spare Part Mesin Industri",
      qty: 1,
      weight_kg: 5.2,
      item_value: 2500000,
    },
  ]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch customers, fleets, and drivers
  useEffect(() => {
    async function loadAll() {
      try {
        const [resCust, resFleet, resDriver] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/fleets"),
          fetch("/api/drivers"),
        ]);
        const dataCust = await resCust.json();
        const dataFleet = await resFleet.json();
        const dataDriver = await resDriver.json();

        if (dataCust.success) {
          setCustomers(dataCust.data);
          // Set default sender if available
          const sentosa = dataCust.data.find((c: CustomerOption) =>
            c.company_name.includes("Sentosa")
          );
          if (sentosa) {
            setSenderCustId(String(sentosa.id));
            setSenderCompany(sentosa.company_name);
            setSenderContact(sentosa.contact_name);
            setSenderPhone(sentosa.phone);
            setSenderAddress(sentosa.address);
            setSenderCity(sentosa.city);
            setSenderProvince(sentosa.province);
            setSenderPostal(sentosa.postal_code);
          }

          const maju = dataCust.data.find((c: CustomerOption) =>
            c.company_name.includes("Maju")
          );
          if (maju) {
            setReceiverCustId(String(maju.id));
            setReceiverCompany(maju.company_name);
            setReceiverContact(maju.contact_name);
            setReceiverPhone(maju.phone);
            setReceiverAddress(maju.address);
            setReceiverCity(maju.city);
            setReceiverProvince(maju.province);
            setReceiverPostal(maju.postal_code);
          }
        }

        if (dataFleet.success) {
          setFleets(dataFleet.data);
          if (dataFleet.data.length > 0) {
            const firstFleet = dataFleet.data[0];
            setSelectedFleetId(String(firstFleet.id));
            if (firstFleet.default_driver_id) {
              setSelectedDriverId(String(firstFleet.default_driver_id));
            }
          }
        }

        if (dataDriver.success) {
          setDrivers(dataDriver.data);
        }
      } catch (e) {
        console.error("Error loading master data:", e);
      } finally {
        setLoadingData(false);
      }
    }
    loadAll();
  }, []);

  // When sender customer dropdown changes
  const handleSenderChange = (idStr: string) => {
    setSenderCustId(idStr);
    const found = customers.find((c) => String(c.id) === idStr);
    if (found) {
      setSenderCompany(found.company_name);
      setSenderContact(found.contact_name);
      setSenderPhone(found.phone);
      setSenderAddress(found.address);
      setSenderCity(found.city);
      setSenderProvince(found.province);
      setSenderPostal(found.postal_code);
    }
  };

  // When receiver customer dropdown changes
  const handleReceiverChange = (idStr: string) => {
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

  // Quick Action: Gunakan Data Pengirim for Receiver
  const handleCopySenderToReceiver = () => {
    setReceiverCompany(senderCompany);
    setReceiverContact(senderContact);
    setReceiverPhone(senderPhone);
    setReceiverAddress(senderAddress);
    setReceiverCity(senderCity);
    setReceiverProvince(senderProvince);
    setReceiverPostal(senderPostal);
  };

  // When Fleet (No. Plat) dropdown changes -> auto select default driver
  const handleFleetChange = (fleetIdStr: string) => {
    setSelectedFleetId(fleetIdStr);
    const foundFleet = fleets.find((f) => String(f.id) === fleetIdStr);
    if (foundFleet && foundFleet.default_driver_id) {
      setSelectedDriverId(String(foundFleet.default_driver_id));
    }
  };

  // Dynamic Item handlers
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
    return items.reduce((sum, item) => sum + (Number(item.weight_kg) || 0) * (Number(item.qty) || 1), 0);
  }, [items]);

  const totalColli = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
  }, [items]);

  const totalCargoValue = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.item_value) || 0) * (Number(item.qty) || 1), 0);
  }, [items]);

  // Shipping cost: Base Rp 25.000 + Rp 6.000/kg for Reguler, Rp 45.000 + Rp 12.000/kg for Express
  const shippingCost = useMemo(() => {
    const ratePerKg = serviceType === "Express" ? 12000 : 6000;
    const baseRate = serviceType === "Express" ? 45000 : 25000;
    return Math.max(35000, baseRate + Math.round(totalWeight * ratePerKg));
  }, [totalWeight, serviceType]);

  // Insurance cost: 0.1% of item value, min Rp 2.500
  const insuranceCost = useMemo(() => {
    if (!hasInsurance) return 0;
    const calculated = Math.round(totalCargoValue * 0.001);
    return Math.max(2500, calculated);
  }, [hasInsurance, totalCargoValue]);

  const totalCost = shippingCost + insuranceCost;

  // Estimated arrival text
  const estimatedArrivalDate = useMemo(() => {
    if (!shipDate) return { dateFormatted: "-", daysText: "-" };
    const parts = shipDate.split("-");
    const y = parseInt(parts[0], 10) || 2026;
    const m = (parseInt(parts[1], 10) || 1) - 1;
    const day = parseInt(parts[2], 10) || 1;
    const d = new Date(y, m, day);
    const addDays = serviceType === "Express" ? 1 : 3;
    d.setDate(d.getDate() + addDays);
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return {
      dateFormatted: `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,
      daysText: `${addDays} hari kerja`,
    };
  }, [shipDate, serviceType]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!senderCompany || !receiverCompany) {
      setErrorMessage("Silakan lengkapi nama perusahaan pengirim dan penerima");
      return;
    }

    if (!preChecklist) {
      setErrorMessage("Ceklist Kesiapan Armada & Muatan Awal wajib dicentang oleh Admin");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        sender_customer_id: senderCustId ? Number(senderCustId) : null,
        receiver_customer_id: receiverCustId ? Number(receiverCustId) : null,
        fleet_id: selectedFleetId ? Number(selectedFleetId) : null,
        driver_id: selectedDriverId ? Number(selectedDriverId) : null,
        sender_company: senderCompany,
        sender_contact: senderContact,
        sender_phone: senderPhone,
        sender_address: senderAddress,
        origin_city: senderCity,
        origin_province: senderProvince,
        origin_postal_code: senderPostal,
        receiver_company: receiverCompany,
        receiver_contact: receiverContact,
        receiver_phone: receiverPhone,
        receiver_address: receiverAddress,
        destination_city: receiverCity,
        destination_province: receiverProvince,
        destination_postal_code: receiverPostal,
        service_type: serviceType,
        service_name: serviceType === "Express" ? "Express Kilat" : "Pengiriman Biasa",
        has_insurance: hasInsurance,
        actual_weight_kg: totalWeight.toFixed(2),
        volume_weight_kg: totalWeight.toFixed(2),
        total_colli: totalColli,
        payment_method: "Prepaid",
        notes: notes || null,
        reference_po: referencePO || null,
        shipping_cost: shippingCost.toFixed(2),
        insurance_cost: insuranceCost.toFixed(2),
        other_cost: "0.00",
        total_cost: totalCost.toFixed(2),
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

      // Redirect directly to Print Resi page as specified in Gate 3
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header & 4-Step Wizard Indicator */}
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
          <span className="text-slate-700">Buat Pengiriman Baru</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Buat Pengiriman</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Isi detail pengiriman untuk membuat resi dan surat jalan baru.
        </p>

        {/* Horizontal Stepper */}
        <div className="mt-5 p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="grid grid-cols-4 gap-2 text-xs">
            {[
              { num: 1, label: "Detail Pengiriman", active: currentStep >= 1 },
              { num: 2, label: "Barang & Muatan", active: currentStep >= 2 },
              { num: 3, label: "Layanan & Biaya", active: currentStep >= 3 },
              { num: 4, label: "Konfirmasi & Resi", active: currentStep >= 4 },
            ].map((st) => (
              <div
                key={st.num}
                onClick={() => setCurrentStep(st.num)}
                className={`flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-pointer ${
                  currentStep === st.num
                    ? "bg-blue-50 text-blue-700 font-bold border border-blue-200"
                    : st.active
                    ? "text-slate-700 font-semibold"
                    : "text-slate-400 font-medium"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                    currentStep === st.num
                      ? "bg-blue-600 text-white font-bold"
                      : st.active
                      ? "bg-emerald-500 text-white font-bold"
                      : "bg-slate-200 text-slate-600 font-bold"
                  }`}
                >
                  {st.active && currentStep > st.num ? "✓" : st.num}
                </div>
                <span className="truncate hidden sm:inline">{st.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main 3-Column Form Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= COLUMN 1 (Left: Pengirim & Penerima) ================= */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card: Informasi Pengirim */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800">Informasi Pengirim</h3>
              </div>
              <Link
                href="/admin/customers"
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                + Tambah Baru
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Pelanggan Pengirim *
                </label>
                <select
                  value={senderCustId}
                  onChange={(e) => handleSenderChange(e.target.value)}
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
                <label className="block font-bold text-slate-700 mb-1">Nama Perusahaan *</label>
                <input
                  type="text"
                  required
                  value={senderCompany}
                  onChange={(e) => setSenderCompany(e.target.value)}
                  placeholder="PT. Sentosa Abadi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Kontak *</label>
                  <input
                    type="text"
                    required
                    value={senderContact}
                    onChange={(e) => setSenderContact(e.target.value)}
                    placeholder="Budi Santoso"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telepon *</label>
                  <input
                    type="text"
                    required
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="081288990011"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-700">Alamat Lengkap *</label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {senderAddress.length}/200
                  </span>
                </div>
                <textarea
                  required
                  rows={2}
                  maxLength={200}
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                  placeholder="Jl. Industri Raya No. 45, Kawasan Industri Pulogadung"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kota Asal *</label>
                  <input
                    type="text"
                    required
                    value={senderCity}
                    onChange={(e) => setSenderCity(e.target.value)}
                    placeholder="Jakarta Timur"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Pos</label>
                  <input
                    type="text"
                    value={senderPostal}
                    onChange={(e) => setSenderPostal(e.target.value)}
                    placeholder="13920"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Informasi Penerima */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">Informasi Penerima</h3>
              </div>
              <button
                type="button"
                onClick={handleCopySenderToReceiver}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Gunakan Data Pengirim
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Pelanggan Penerima *
                </label>
                <select
                  value={receiverCustId}
                  onChange={(e) => handleReceiverChange(e.target.value)}
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
                <label className="block font-bold text-slate-700 mb-1">Nama Perusahaan *</label>
                <input
                  type="text"
                  required
                  value={receiverCompany}
                  onChange={(e) => setReceiverCompany(e.target.value)}
                  placeholder="CV. Maju Bersama"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Kontak *</label>
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
                  <label className="block font-bold text-slate-700 mb-1">Telepon *</label>
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
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-700">Alamat Lengkap *</label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {receiverAddress.length}/200
                  </span>
                </div>
                <textarea
                  required
                  rows={2}
                  maxLength={200}
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  placeholder="Jl. Soekarno Hatta No. 512, Batununggal"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
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
          </div>
        </div>

        {/* ================= COLUMN 2 (Center: Penugasan Armada, Detail, Barang) ================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Detail & Penugasan Armada */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Truck className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-800">Detail & Penugasan Armada</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tanggal Pengiriman *
                </label>
                <input
                  type="date"
                  required
                  value={shipDate}
                  onChange={(e) => setShipDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Penugasan Armada & Auto-fill Kurir */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/70 space-y-3">
                <span className="font-bold text-blue-900 block">
                  Penugasan Armada (No. Plat & Sopir)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Pilih Armada (No. Plat) *
                    </label>
                    <select
                      value={selectedFleetId}
                      onChange={(e) => handleFleetChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Kurir / Sopir *
                    </label>
                    <select
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
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

                {/* Mandatory Checkbox */}
                <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preChecklist}
                    onChange={(e) => setPreChecklist(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-700 leading-tight">
                    <strong>Ceklist Kesiapan Armada & Muatan Awal (Oleh Admin)</strong>
                    <span className="block text-[10px] text-slate-500">
                      Telah diverifikasi kelayakan rem, ban, dokumen jalan, dan muatan kargo.
                    </span>
                  </span>
                </label>
              </div>

              {/* Jenis Layanan & 2-Card Radio Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Jenis Pengiriman *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setServiceType("Reguler")}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      serviceType === "Reguler"
                        ? "border-blue-600 bg-blue-50/50 text-blue-900 font-bold shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Reguler</span>
                      {serviceType === "Reguler" && (
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1 font-normal">
                      Pengiriman standar (3 hari kerja)
                    </span>
                  </div>

                  <div
                    onClick={() => setServiceType("Express")}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      serviceType === "Express"
                        ? "border-blue-600 bg-blue-50/50 text-blue-900 font-bold shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Express</span>
                      {serviceType === "Express" && (
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1 font-normal">
                      Pengiriman kilat prioritas (1 hari kerja)
                    </span>
                  </div>
                </div>
              </div>

              {/* Asuransi Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                <div>
                  <span className="font-bold text-slate-800 block">Asuransi Pengiriman</span>
                  <span className="text-[10px] text-slate-500">
                    Lindungi barang Anda dari risiko kerusakan atau kehilangan di jalan.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setHasInsurance(!hasInsurance)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    hasInsurance ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      hasInsurance ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Referensi / PO & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Referensi / PO (Opsional)
                  </label>
                  <input
                    type="text"
                    value={referencePO}
                    onChange={(e) => setReferencePO(e.target.value)}
                    placeholder="PO-2024-05-9921"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Catatan Pengiriman
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Barang presisi, jangan ditumpuk"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Informasi Barang (Dynamic Rows) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  Informasi Barang ({items.length} Macam)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Baris</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Item #{idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Nama Barang *
                    </label>
                    <input
                      type="text"
                      required
                      value={item.item_name}
                      onChange={(e) => handleItemChange(idx, "item_name", e.target.value)}
                      placeholder="Misal: Spare Part Mesin Industri"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Qty (Koli) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.qty}
                        onChange={(e) =>
                          handleItemChange(idx, "qty", parseInt(e.target.value) || 1)
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-center font-bold focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Berat (kg) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        required
                        value={item.weight_kg}
                        onChange={(e) =>
                          handleItemChange(idx, "weight_kg", parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-right font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Nilai Barang (Rp)
                      </label>
                      <input
                        type="number"
                        step="1000"
                        min="0"
                        value={item.item_value}
                        onChange={(e) =>
                          handleItemChange(idx, "item_value", parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-right font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= COLUMN 3 (Right: Sticky Ringkasan & Kalkulasi Biaya) ================= */}
        <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
              Ringkasan Pengiriman
            </h3>

            {/* Blue Tinted ETA Box */}
            <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/80 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                ESTIMASI TIBA
              </span>
              <div className="font-black text-blue-900 text-base mt-0.5">
                {estimatedArrivalDate.dateFormatted}
              </div>
              <span className="text-[11px] text-blue-700 font-semibold block mt-0.5">
                {estimatedArrivalDate.daysText} ({serviceType})
              </span>
            </div>

            {/* Cargo Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 py-1">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Total Koli</span>
                <span className="text-sm font-bold text-slate-800">{totalColli} Box</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Total Berat</span>
                <span className="text-sm font-bold text-slate-800 font-mono">
                  {totalWeight.toFixed(2)} kg
                </span>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal (Estimasi Ongkir):</span>
                <span className="font-mono font-semibold">{formatRupiah(shippingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Asuransi:</span>
                <span className="font-mono font-semibold">{formatRupiah(insuranceCost)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Biaya Lainnya:</span>
                <span className="font-mono">Rp 0</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 text-sm">Total Estimasi:</span>
                <span className="font-black text-blue-700 text-lg font-mono">
                  {formatRupiah(totalCost)}
                </span>
              </div>
            </div>

            {/* Tips Card */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Tips Pengiriman B2B</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Pastikan informasi alamat jalan, nomor gudang, dan nomor telepon PIC penerima sudah sesuai sebelum surat jalan dicetak.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Membuat Resi & Surat Jalan...</span>
                </>
              ) : (
                <>
                  <span>Lanjutkan -&gt;</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
