"use client";

import { TypographyLogo } from "../TypographyLogo";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  Layers,
  Navigation,
  Users,
  Car,
  UserCheck,
  History,
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface MenuItem {
  label: string;
  href: string;
  icon: any;
  external?: boolean;
}

interface MenuGroup {
  title: string | null;
  items: MenuItem[];
}

export default function AdminSidebar({ isOpen = true }: SidebarProps) {
  const pathname = usePathname();

  const menuGroups: MenuGroup[] = [
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
        { label: "Histori Pengiriman", href: "/admin/history", icon: History },
        { label: "Dispatcher Multi-Drop", href: "/admin/multidrop", icon: Layers },
        { label: "Tracking Publik", href: "/", icon: Navigation, external: false },
      ],
    },
    {
      title: "MANAJEMEN MASTER",
      items: [
        { label: "Pelanggan", href: "/admin/customers", icon: Users },
        { label: "Armada", href: "/admin/fleets", icon: Car },
        { label: "Kurir / Driver", href: "/admin/drivers", icon: UserCheck },
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
      <div className="h-16 flex items-center px-5 border-b border-slate-800 shrink-0">
        <Link href="/admin" className="focus:outline-none">
          <TypographyLogo
            variant="cargo"
            theme="dark"
            style="velocity"
            size="sm"
            subtitle="PT LAUTAN INDAH EXPRESS"
          />
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {group.title && (
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
        LIE Cargo B2B Logistics v1.0
      </div>
    </aside>
  );
}
