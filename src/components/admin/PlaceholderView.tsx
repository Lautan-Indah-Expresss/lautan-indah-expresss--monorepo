import React from "react";
import Link from "next/link";
import { Hammer, ArrowLeft, Sparkles } from "lucide-react";

interface PlaceholderViewProps {
  title: string;
  description?: string;
  phase?: string;
}

export default function PlaceholderView({
  title,
  description = "Fitur ini dijadwalkan pada pengembangan tahap berikutnya sesuai roadmap sistem.",
  phase = "Phase 2",
}: PlaceholderViewProps) {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-inner">
          <Hammer className="w-8 h-8" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Modul Dalam Pengembangan - {phase}</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">
          {title}
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
          {description}
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </Link>
          <Link
            href="/admin/shipments"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Lihat Daftar Pengiriman
          </Link>
        </div>
      </div>
    </div>
  );
}
