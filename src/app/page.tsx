"use client";

import { TypographyLogo } from "@/components/TypographyLogo";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  Search,
  Truck,
  ArrowRight,
  ShieldCheck,
  Clock,
  MapPin,
  CheckCircle2,
  PackageCheck,
  HelpCircle,
  KeyRound,
} from "lucide-react";

export default function HomePage() {
  const [resiInput, setResiInput] = useState("");
  const [searching, setSearching] = useState(false);
  const router = useRouter();

  const verifyAndRedirect = async (cleanResi: string, cleanPin: string) => {
    try {
      setSearching(true);
      // Fetch shipment to verify PIN or 4 digit phone
      const res = await fetch(`/api/track/${cleanResi}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Nomor resi tidak terdaftar di sistem");
      }

      const shipment = data.data;
      const cleanPhone = (shipment.receiver_phone || "").replace(/\D/g, "");
      const cleanDbPin = (shipment.pin_code || "").trim();

      const isMatchPhone = cleanPin.length >= 4 && cleanPhone.endsWith(cleanPin);
      const isMatchPin = cleanDbPin && cleanPin.toUpperCase() === cleanDbPin.toUpperCase();

      if (!isMatchPhone && !isMatchPin) {
        throw new Error("PIN Resi atau 4 digit nomor telepon penerima tidak cocok!");
      }

      // Store verified session token in sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`track_verified_${cleanResi}`, cleanPin);
      }

      await Swal.fire({
        icon: "success",
        title: "Akses Terverifikasi!",
        text: `Membuka data pelacakan resi ${cleanResi}...`,
        timer: 1400,
        showConfirmButton: false,
      });

      router.push(`/track/${cleanResi}`);
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Verifikasi Gagal",
        text: err.message || "Gagal memverifikasi resi dan PIN",
        confirmButtonColor: "#2563EB",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent, customResi?: string, samplePin?: string) => {
    if (e) e.preventDefault();
    const cleanResi = (customResi || resiInput).trim().toUpperCase();

    if (!cleanResi) {
      Swal.fire({
        icon: "warning",
        title: "Nomor Resi Kosong",
        text: "Silakan masukkan nomor resi terlebih dahulu.",
        confirmButtonColor: "#2563EB",
      });
      return;
    }

    // SweetAlert Modal for entering PIN / 4 Digit Phone
    const { value: inputPin } = await Swal.fire({
      title: "Verifikasi Keamanan Kargo",
      html: `
        <div style="text-align: left; font-size: 13px; color: #475569; margin-bottom: 12px;">
          Nomor Resi: <strong style="color: #0f172a; font-family: monospace;">${cleanResi}</strong>
        </div>
        <div style="text-align: left; font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 8px;">
          Demi privasi dan keamanan pengiriman B2B, silakan masukkan <strong>PIN Resi (6 digit)</strong> yang ada pada surat jalan atau <strong>4 digit terakhir nomor telepon penerima</strong>:
        </div>
      `,
      input: "password",
      inputPlaceholder: samplePin ? `Contoh demo: ${samplePin}` : "Masukkan PIN Resi atau 4 digit HP...",
      inputValue: samplePin || "",
      inputAttributes: {
        autocapitalize: "off",
        autocorrect: "off",
        style: "font-family: monospace; letter-spacing: 2px; font-weight: bold; text-align: center; font-size: 16px;",
      },
      showCancelButton: true,
      confirmButtonText: "Buka Pelacakan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#2563EB",
      cancelButtonColor: "#94a3b8",
      focusConfirm: false,
      preConfirm: (val) => {
        if (!val || !val.trim()) {
          Swal.showValidationMessage("PIN Resi atau 4 digit nomor HP wajib diisi!");
          return false;
        }
        return val.trim();
      },
    });

    if (inputPin) {
      await verifyAndRedirect(cleanResi, inputPin);
    }
  };

  const sampleResis = [
    { resi: "KG123456789ID", pin: "5432", label: "KG123456789ID (PIN: 5432)" },
    { resi: "KG123456790ID", pin: "4321", label: "KG123456790ID (PIN: 4321)" },
    { resi: "KG123456791ID", pin: "9876", label: "KG123456791ID (PIN: 9876)" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <TypographyLogo
              variant="cargo"
              theme="light"
              style="velocity"
              size="md"
              subtitle="PT LAUTAN INDAH EXPRESS"
            />
          </Link>

          {/* <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-lg shadow-sm transition"
            >
              Login Admin
            </Link>
          </div> */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-20">
        <div className="max-w-2xl w-full text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-4 border border-blue-100">
            <Truck className="w-3.5 h-3.5" />
            Sistem Pelacakan Kargo B2B Realtime
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Lacak Pengiriman Kargo Anda
          </h1>
          <p className="mt-3 text-slate-500 text-sm sm:text-base max-w-lg mx-auto">
            Pantau posisi armada, rute checkpoint berkala, konfirmasi penerimaan barang, dan kendala perjalanan secara transparan.
          </p>

          {/* Search Box (Input Resi -> Trigger SweetAlert PIN) */}
          <form
            onSubmit={(e) => handleSearch(e)}
            className="mt-8 bg-white p-2.5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col sm:flex-row gap-2 text-left"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={resiInput}
                onChange={(e) => setResiInput(e.target.value)}
                placeholder="Masukkan Nomor Resi (contoh: KG123456789ID)"
                className="w-full pl-12 pr-4 py-3.5 text-slate-800 font-mono text-sm sm:text-base outline-none bg-transparent placeholder:text-slate-400 uppercase font-bold"
                required
              />
            </div>

            <button
              type="submit"
              disabled={searching}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-md shadow-blue-500/20 shrink-0 disabled:opacity-50"
            >
              <span>{searching ? "Memeriksa..." : "Lacak Resi"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Resi Helper */}
          {/* <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span>Contoh Resi Demo:</span>
            {sampleResis.map((item) => (
              <button
                key={item.resi}
                type="button"
                onClick={() => {
                  setResiInput(item.resi);
                  handleSearch(undefined, item.resi, item.pin);
                }}
                className="font-mono bg-slate-200/80 hover:bg-blue-100 hover:text-blue-700 px-2 py-0.5 rounded text-slate-700 transition"
              >
                {item.label}
              </button>
            ))}
          </div> */}

          {/* Feature Highlights */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">Peta Rute Interaktif</h3>
              <p className="text-xs text-slate-500 mt-1">
                Visualisasi titik berangkat, transit, dan tujuan lengkap dengan posisi truk supir terkini.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <PackageCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">Konfirmasi Penerima</h3>
              <p className="text-xs text-slate-500 mt-1">
                Penerima dapat mengonfirmasi serah terima aman langsung dengan upload foto bukti.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">Aman dengan PIN Resi</h3>
              <p className="text-xs text-slate-500 mt-1">
                Verifikasi 6 digit PIN atau 4 digit nomor telepon penerima menjaga kerahasiaan kargo.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} LIE Cargo (PT Lautan Indah Express). All rights reserved.
        </div>
      </footer>
    </div>
  );
}
