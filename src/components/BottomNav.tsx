import React from 'react';
import { Truck, CheckSquare, Search, Bell, History, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';

interface BottomNavProps {
  role: UserRole;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  role,
  activeTab,
  onSelectTab,
  unreadCount = 0,
}) => {
  if (role === 'admin') return null; // Admin uses sidebar/desktop header

  interface NavTab {
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }

  const driverTabs: NavTab[] = [
    { id: 'tasks', label: 'Tugas Aktif', icon: <Truck className="w-5 h-5" /> },
    { id: 'history', label: 'Riwayat Absensi', icon: <History className="w-5 h-5" /> },
    { id: 'sop', label: 'Panduan SOP', icon: <ShieldCheck className="w-5 h-5" /> },
  ];

  const receiverTabs: NavTab[] = [
    { id: 'incoming', label: 'Daftar Kiriman', icon: <Truck className="w-5 h-5" /> },
    { id: 'tracking', label: 'Cek Resi / SJ', icon: <Search className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifikasi', icon: <Bell className="w-5 h-5" />, badge: unreadCount },
  ];

  const tabs: NavTab[] = role === 'sopir' ? driverTabs : receiverTabs;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 shadow-lg py-1.5 px-3 flex items-center justify-around sm:hidden">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
              isActive ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className="relative">
              {tab.icon}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
