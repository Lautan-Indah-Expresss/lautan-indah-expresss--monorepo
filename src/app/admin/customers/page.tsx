"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Search, Building2, Phone, MapPin, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface CustomerItem {
  id: number;
  company_name: string;
  contact_name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [formCompany, setFormCompany] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("Jakarta");
  const [formProvince, setFormProvince] = useState("DKI Jakarta");
  const [formPostal, setFormPostal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: formCompany,
          contact_name: formContact,
          phone: formPhone,
          address: formAddress,
          city: formCity,
          province: formProvince,
          postal_code: formPostal,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan pelanggan");
      }

      setSuccessMessage("Pelanggan B2B berhasil disimpan!");
      setFormCompany("");
      setFormContact("");
      setFormPhone("");
      setFormAddress("");
      setFormPostal("");
      setShowModal(false);
      fetchCustomers();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Terjadi kesalahan sistem");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Master Pelanggan B2B</h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar rekanan bisnis, pabrik, distributor, dan toko yang bertindak sebagai Pengirim atau Penerima kargo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowModal(true);
            setErrorMessage(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Pelanggan Baru</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama PT/CV, kontak, atau kota..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
        <span className="text-xs text-slate-400 font-semibold">{filtered.length} Perusahaan Terdaftar</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Nama Perusahaan / Entitas</th>
                <th className="px-5 py-3.5">PIC / Kontak Utama</th>
                <th className="px-5 py-3.5">Telepon</th>
                <th className="px-5 py-3.5">Kota & Provinsi</th>
                <th className="px-5 py-3.5">Alamat Lengkap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Memuat data pelanggan...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    Tidak ada data pelanggan ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                        <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                        {c.company_name}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {c.contact_name}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-600 flex items-center gap-1.5 pt-4">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {c.phone}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700">
                      <div>{c.city}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{c.province}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate" title={c.address}>
                      {c.address}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Pelanggan */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">Tambah Pelanggan B2B Baru</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Perusahaan / Toko *</label>
                <input
                  type="text"
                  required
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  placeholder="Misal: PT. Sinar Mas Logistik"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama PIC / Kontak *</label>
                  <input
                    type="text"
                    required
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    placeholder="Budi Santoso"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Telepon *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap *</label>
                <textarea
                  required
                  rows={2}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Nama jalan, nomor gudang, kawasan industri..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kota / Kab *</label>
                  <input
                    type="text"
                    required
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Jakarta"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={formProvince}
                    onChange={(e) => setFormProvince(e.target.value)}
                    placeholder="DKI Jakarta"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Pos</label>
                  <input
                    type="text"
                    value={formPostal}
                    onChange={(e) => setFormPostal(e.target.value)}
                    placeholder="12345"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan Pelanggan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
