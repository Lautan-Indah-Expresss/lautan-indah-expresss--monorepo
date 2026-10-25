import Link from "next/link";
import { Truck, CheckCircle2 } from "lucide-react";

export default function AdminIndexPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
          <Truck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">KARGO Admin Portal</h1>
          <p className="text-sm text-slate-500">Plan 1 Verification - Admin Session Active</p>
        </div>
      </div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-emerald-800 flex items-start gap-3">
        <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h2 className="font-bold text-lg">Sistem Autentikasi & Database Berhasil Terhubung</h2>
          <p className="text-sm mt-1 text-emerald-700">
            Cookie HttpOnly sesi admin valid. Skema database MySQL <code>lie-db</code> siap digunakan.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/admin/shipments"
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white font-medium text-sm rounded-lg hover:bg-emerald-700"
            >
              Lihat Daftar Pengiriman
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
