import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  AlertTriangle,
  BarChart3,
  Database,
  Truck,
  X,
  ShieldCheck,
} from 'lucide-react';

export type AdminTab = 'monitoring' | 'create_shipment' | 'claims' | 'reports' | 'master_data';

interface SidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  pendingClaimsCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingClaimsCount = 0,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const menuItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'monitoring',
      label: 'Master Monitoring',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'create_shipment',
      label: 'Buat Pengiriman (Muat)',
      icon: <PlusCircle className="w-4 h-4" />,
    },
    {
      id: 'claims',
      label: 'Selisih & Berita Acara',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: pendingClaimsCount,
    },
    {
      id: 'reports',
      label: 'Laporan Rekapitulasi',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'master_data',
      label: 'Data Master Armada & Tim',
      icon: <Database className="w-4 h-4" />,
    },
  ];

  const handleItemClick = (id: AdminTab) => {
    onSelectTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container
          - Desktop: Fixed/Sticky on the left (h-[calc(100vh-4rem)] sticky top-16), does NOT scroll with main area!
          - Mobile: Slide-over drawer (fixed inset-y-0 left-0 z-50 transform)
      */}
      <aside
        className={`fixed md:sticky top-0 md:top-16 left-0 z-50 md:z-30 w-64 h-screen md:h-[calc(100vh-4rem)] bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col shrink-0 transition-transform duration-300 ease-in-out select-none ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Admin Operasional</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Pusat Kontrol Logistik &amp; Armada
            </div>
          </div>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Menu (Independent scrollable container if items exceed screen) */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar-dark">
          {menuItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-sm shadow-teal-900/40 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-white' : 'text-teal-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-black rounded-md bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Mini System Info Box at bottom of sidebar */}
        <div className="p-3.5 m-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-2 text-slate-300 font-bold mb-1">
            <Truck className="w-3.5 h-3.5 text-teal-400" />
            <span>SOP PT Lautan Indah</span>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-400">
            Menu samping terkunci tetap saat scrolling data muatan.
          </p>
        </div>
      </aside>
    </>
  );
};
