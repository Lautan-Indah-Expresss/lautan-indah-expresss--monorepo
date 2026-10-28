'use client';

import React, { useState, useEffect } from 'react';
import { User, Shipment, AppNotification, UserRole } from '@/types';
import { StorageService, STORAGE_CHANGE_EVENT, initializeStorage } from '@/services/storage';
import { Navbar } from './Navbar';
import { Sidebar, AdminTab } from './Sidebar';
import { BottomNav } from './BottomNav';
import { DocumentPrintModal } from './DocumentPrintModal';
import { LoginView } from '@/views/LoginView';

// Admin views
import { AdminDashboard } from '@/views/admin/AdminDashboard';
import { AdminCreateShipment } from '@/views/admin/AdminCreateShipment';
import { AdminShipmentDetail } from '@/views/admin/AdminShipmentDetail';
import { AdminClaims } from '@/views/admin/AdminClaims';
import { AdminReports } from '@/views/admin/AdminReports';
import { AdminMasterData } from '@/views/admin/AdminMasterData';

// Receiver view
import { ReceiverDashboard } from '@/views/receiver/ReceiverDashboard';

// Driver view
import { DriverDashboard } from '@/views/driver/DriverDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      initializeStorage();
      return StorageService.getActiveUser();
    }
    return null;
  });
  const [shipments, setShipments] = useState<Shipment[]>(() => {
    if (typeof window !== 'undefined') {
      initializeStorage();
      return StorageService.getShipments();
    }
    return [];
  });
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof window !== 'undefined') {
      initializeStorage();
      return StorageService.getNotifications();
    }
    return [];
  });

  // Navigation states
  const [adminTab, setAdminTab] = useState<AdminTab>('monitoring');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Mobile BottomNav active tab
  const [mobileBottomTab, setMobileBottomTab] = useState<string>('tasks');

  // Print modal state
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printShipment, setPrintShipment] = useState<Shipment | null>(null);

  // Synchronize state from StorageService & storage events
  useEffect(() => {
    initializeStorage();
    setCurrentUser(StorageService.getActiveUser());
    setShipments(StorageService.getShipments());
    setNotifications(StorageService.getNotifications());

    const handleStorageUpdate = () => {
      setShipments(StorageService.getShipments());
      setNotifications(StorageService.getNotifications());
      setCurrentUser(StorageService.getActiveUser());
    };

    window.addEventListener(STORAGE_CHANGE_EVENT, handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener(STORAGE_CHANGE_EVENT, handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Handle Logout
  const handleLogout = () => {
    StorageService.setActiveUser(null);
    setCurrentUser(null);
    setSelectedShipmentId(null);
    setAdminTab('monitoring');
    setIsMobileSidebarOpen(false);
  };

  // Quick switch role (for fast testing / reviewer evaluation)
  const handleSwitchRole = (role: UserRole) => {
    const users = StorageService.getUsers();
    const matched = users.find((u) => u.role === role) || {
      id: `usr-${role}`,
      username: role,
      name: role === 'admin' ? 'Admin Operasional' : role === 'penerima' ? 'Hendra Wijaya' : 'Agus Santoso',
      role,
      phone: '08123456789',
    };
    StorageService.setActiveUser(matched);
    setCurrentUser(matched);
    setSelectedShipmentId(null);
    setAdminTab('monitoring');
    setIsMobileSidebarOpen(false);
    if (role === 'penerima') setMobileBottomTab('incoming');
    if (role === 'sopir') setMobileBottomTab('tasks');
  };

  // Reset database to initial dummy records
  const handleResetData = () => {
    if (confirm('Kembalikan semua data ke kondisi awal (Dummy Data PT LAUTAN INDAH Express)?')) {
      StorageService.resetDatabase();
      alert('Data operasional berhasil di-reset ke kondisi awal!');
    }
  };

  const handleSelectShipment = (id: string) => {
    setSelectedShipmentId(id);
    setIsMobileSidebarOpen(false);
  };

  const handleOpenPrintModal = (shipment: Shipment) => {
    setPrintShipment(shipment);
    setPrintModalOpen(true);
  };

  // If not logged in, show login page
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  const selectedShipment = selectedShipmentId
    ? shipments.find((s) => s.id === selectedShipmentId) || null
    : null;

  const pendingClaimsCount = shipments.filter(
    (s) => s.status === 'Selisih/Claim' || (s.claimReport && s.claimReport.status.includes('Investigasi'))
  ).length;

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-100 font-sans">
      {/* Global Header Navbar (Fixed at top) */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        notifications={notifications}
        onMarkNotificationRead={(id) => StorageService.markNotificationAsRead(id)}
        onMarkAllNotificationsRead={() => StorageService.markAllNotificationsRead()}
        onResetData={handleResetData}
        onSelectShipment={(id) => {
          setSelectedShipmentId(id);
          if (currentUser.role === 'admin') setAdminTab('monitoring');
        }}
        onToggleMobileMenu={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* ROLE 1: ADMIN (Desktop Web with Fixed Sidebar on Scroll & Responsive Mobile Drawer) */}
      {currentUser.role === 'admin' && (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Admin Sidebar (Sticky on desktop, slide-over drawer on mobile) */}
          <div className="no-print">
            <Sidebar
              currentTab={adminTab}
              onSelectTab={(tab) => {
                setAdminTab(tab);
                setSelectedShipmentId(null);
                setIsMobileSidebarOpen(false);
              }}
              pendingClaimsCount={pendingClaimsCount}
              isOpenMobile={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />
          </div>

          {/* Admin Main Workspace (Only this area scrolls down, sidebar remains firmly stationary!) */}
          <main className="flex-1 h-full overflow-y-auto custom-scrollbar p-3.5 sm:p-6 lg:p-8">
            {selectedShipment ? (
              <AdminShipmentDetail
                shipment={selectedShipment}
                onBack={() => setSelectedShipmentId(null)}
                onOpenPrintModal={handleOpenPrintModal}
              />
            ) : adminTab === 'monitoring' ? (
              <AdminDashboard
                shipments={shipments}
                onSelectShipment={handleSelectShipment}
                onCreateNewShipment={() => setAdminTab('create_shipment')}
                onOpenPrintModal={handleOpenPrintModal}
              />
            ) : adminTab === 'create_shipment' ? (
              <AdminCreateShipment
                onCancel={() => setAdminTab('monitoring')}
                onSuccess={(newShipment) => {
                  setAdminTab('monitoring');
                  setSelectedShipmentId(newShipment.id);
                }}
              />
            ) : adminTab === 'claims' ? (
              <AdminClaims
                shipments={shipments}
                onSelectShipment={handleSelectShipment}
              />
            ) : adminTab === 'reports' ? (
              <AdminReports shipments={shipments} />
            ) : adminTab === 'master_data' ? (
              <AdminMasterData />
            ) : null}
          </main>
        </div>
      )}

      {/* ROLE 2: PENERIMA (Mobile-First View with Safe Scroll & Bottom Nav) */}
      {currentUser.role === 'penerima' && (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <main className="flex-1 h-full overflow-y-auto custom-scrollbar p-3 sm:p-6 pb-20 sm:pb-8 max-w-4xl mx-auto w-full">
            <ReceiverDashboard
              user={currentUser}
              shipments={shipments}
              notifications={notifications}
              onOpenPrintModal={handleOpenPrintModal}
              activeTab={mobileBottomTab}
              onSelectTab={setMobileBottomTab}
            />
          </main>
          <BottomNav
            role="penerima"
            activeTab={mobileBottomTab}
            onSelectTab={setMobileBottomTab}
            unreadCount={unreadNotificationsCount}
          />
        </div>
      )}

      {/* ROLE 3: SOPIR / KURIR (Mobile-First View with Safe Scroll & Bottom Nav) */}
      {currentUser.role === 'sopir' && (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <main className="flex-1 h-full overflow-y-auto custom-scrollbar p-3 sm:p-6 pb-20 sm:pb-8 max-w-4xl mx-auto w-full">
            <DriverDashboard
              user={currentUser}
              shipments={shipments}
              onOpenPrintModal={handleOpenPrintModal}
              activeTab={mobileBottomTab}
              onSelectTab={setMobileBottomTab}
            />
          </main>
          <BottomNav
            role="sopir"
            activeTab={mobileBottomTab}
            onSelectTab={setMobileBottomTab}
          />
        </div>
      )}

      {/* Printable Document Modal (Print / Export PDF Kop PT LAUTAN INDAH Express) */}
      {printShipment && (
        <DocumentPrintModal
          isOpen={printModalOpen}
          onClose={() => {
            setPrintModalOpen(false);
            setPrintShipment(null);
          }}
          shipment={printShipment}
        />
      )}
    </div>
  );
}
