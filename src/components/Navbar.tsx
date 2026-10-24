import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { User, AppNotification } from '../types';
import {
  Bell,
  LogOut,
  UserCheck,
  ShieldAlert,
  RotateCcw,
  CheckCheck,
  Truck,
  Box,
  ChevronDown,
  Menu,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onLogout: () => void;
  onSwitchRole: (role: User['role']) => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onResetData: () => void;
  onSelectShipment?: (shipmentId: string) => void;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onSwitchRole,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onResetData,
  onSelectShipment,
  onToggleMobileMenu,
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-950 via-slate-900 to-teal-950 text-white shadow-md border-b border-teal-800/40 shrink-0">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Drawer Trigger + Brand Logo */}
        <div className="flex items-center gap-2">
          {/* Mobile hamburger menu toggle for Admin */}
          {currentUser.role === 'admin' && onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 md:hidden transition-colors cursor-pointer"
              title="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <BrandLogo size="md" lightMode={true} showSubtitle={false} className="hidden xs:flex" />
          <div className="xs:hidden font-extrabold text-sm tracking-tight text-white">
            <span className="text-teal-400">LAUTAN INDAH</span>{' '}
            <span className="text-amber-400">Express</span>
          </div>
        </div>

        {/* Right Actions: Role Switcher, Notifications, User & Reset */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Quick Role Switcher Pill with Scrollable Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleMenu(!showRoleMenu);
                setShowNotifMenu(false);
              }}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 bg-blue-900/60 hover:bg-blue-800/80 border border-teal-500/40 rounded-xl text-[11px] sm:text-xs font-semibold text-teal-200 transition-all cursor-pointer shadow-xs"
              title="Ganti Peran Pengguna Cepat"
            >
              <UserCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="hidden md:inline">Peran:</span>
              <span className="uppercase font-bold text-amber-300 truncate max-w-[70px] sm:max-w-none">
                {currentUser.role}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-300 shrink-0" />
            </button>

            {/* Scrollable Role Dropdown */}
            {showRoleMenu && (
              <div
                className="absolute right-0 mt-2 w-56 sm:w-64 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 text-xs overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setShowRoleMenu(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Ganti Tampilan Role:
                </div>
                {/* Scrollable list container */}
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  <button
                    onClick={() => onSwitchRole('admin')}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                      currentUser.role === 'admin' ? 'bg-teal-50 font-bold text-teal-900' : 'text-slate-700'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
                    <div className="truncate">
                      <div className="font-bold">ADMIN</div>
                      <div className="text-[10px] text-slate-400 font-normal">Tampilan Web Desktop Monitoring</div>
                    </div>
                  </button>

                  <button
                    onClick={() => onSwitchRole('penerima')}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                      currentUser.role === 'penerima' ? 'bg-teal-50 font-bold text-teal-900' : 'text-slate-700'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
                    <div className="truncate">
                      <div className="font-bold">PENERIMA</div>
                      <div className="text-[10px] text-slate-400 font-normal">Tampilan Mobile Bongkar / Terima</div>
                    </div>
                  </button>

                  <button
                    onClick={() => onSwitchRole('sopir')}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                      currentUser.role === 'sopir' ? 'bg-teal-50 font-bold text-teal-900' : 'text-slate-700'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                    <div className="truncate">
                      <div className="font-bold">SOPIR / KURIR</div>
                      <div className="text-[10px] text-slate-400 font-normal">Tampilan Mobile Absensi &amp; GPS</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Bell with Scrollable Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowRoleMenu(false);
              }}
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Notifikasi Operasional"
            >
              <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-blue-950">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Scrollable Notifications Dropdown */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-sm sm:w-96 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900">
                    <Bell className="w-4 h-4 text-teal-600" />
                    Notifikasi Pengiriman
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      className="text-[11px] text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Tandai Dibaca
                    </button>
                  )}
                </div>

                {/* Smooth Scrollable list container */}
                <div className="max-h-72 sm:max-h-80 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Belum ada notifikasi operasional
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          onMarkNotificationRead(notif.id);
                          if (onSelectShipment) onSelectShipment(notif.shipmentId);
                          setShowNotifMenu(false);
                        }}
                        className={`p-3 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                          !notif.read ? 'bg-teal-50/60' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                              notif.type === 'departure'
                                ? 'bg-amber-100 text-amber-700'
                                : notif.type === 'arrival'
                                ? 'bg-sky-100 text-sky-700'
                                : notif.type === 'claim'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {notif.type === 'departure' && <Truck className="w-3.5 h-3.5" />}
                            {notif.type === 'arrival' && <Box className="w-3.5 h-3.5" />}
                            {notif.type === 'claim' && <ShieldAlert className="w-3.5 h-3.5" />}
                            {notif.type === 'status_update' && <Bell className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-slate-900 truncate">{notif.title}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">{notif.timestamp}</span>
                            </div>
                            <p className="text-slate-600 mt-0.5 leading-snug line-clamp-2">{notif.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-1 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-700/60">
            <div className="hidden lg:flex flex-col text-right leading-tight">
              <span className="text-xs font-bold text-slate-100 truncate max-w-[120px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-teal-300 capitalize font-medium">
                {currentUser.role}
              </span>
            </div>

            <button
              onClick={onResetData}
              title="Reset Data Contoh (Dummy)"
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-white/10 transition-colors hidden sm:inline-flex cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              title="Keluar / Logout"
              className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
