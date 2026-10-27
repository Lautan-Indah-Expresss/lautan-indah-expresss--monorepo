"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Truck,
  LayoutDashboard,
  PlusCircle,
  Package,
  Navigation,
  Calendar,
  Users,
  Car,
  UserCheck,
  Warehouse,
  Receipt,
  BadgeDollarSign,
  FileText,
  Settings,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen = true }: SidebarProps) {
  const pathname = usePathname();

  const menuGroups = [
    {
      title: null,
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      ],
    },
    {
      title: "PENGIRIMAN",
      items: [
        { label: "Buat Pengiriman", href: "/admin/shipments/create", icon: PlusCircle },
        { label: "Daftar Pengiriman", href: "/admin/shipments", icon: Package },
        { label: "Tracking Pengiriman", href: "/track", icon: Navigation, external: false },
        { label: "Jadwal Pengiriman", href: "/admin/schedule", icon: Calendar },
      ],
    },
    {
      title: "MANAJEMEN",
      items: [
        { label: "Pelanggan", href: "/admin/customers", icon: Users },
        { label: "Armada", href: "/admin/fleets", icon: Car },
        { label: "Kurir / Driver", href: "/admin/drivers", icon: UserCheck },
        { label: "Gudang", href: "/admin/warehouses", icon: Warehouse },
      ],
    },
    {
      title: "KEUANGAN",
      items: [
        { label: "Tagihan (Invoicing)", href: "/admin/invoices", icon: Receipt },
        { label: "Transaksi", href: "/admin/transactions", icon: BadgeDollarSign },
      ],
    },
    {
      title: "LAINNYA",
      items: [
        { label: "Laporan", href: "/admin/reports", icon: FileText },
        { label: "Pengaturan", href: "/admin/settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 shrink-0">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Truck className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-black tracking-wider text-white text-lg">LIE Cargo</span>
          </div>
          <p className="text-[10px] font-medium tracking-wide text-slate-400">
            Smart Cargo Solutions
          </p>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {group.title && (
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
