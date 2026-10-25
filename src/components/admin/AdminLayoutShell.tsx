"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import AdminNavbar from "./AdminNavbar";

export default function AdminLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // If print page, allow print styling
  const isPrintPage = pathname.includes("/print");

  return (
    <div className={`min-h-screen bg-slate-50 flex ${isPrintPage ? "print:bg-white" : ""}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden no-print"
        />
      )}

      {/* Fixed Sidebar */}
      {!isPrintPage && (
        <div className="no-print">
          <AdminSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen ${isPrintPage ? "lg:pl-0" : "lg:pl-64"}`}>
        {!isPrintPage && (
          <div className="no-print">
            <AdminNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          </div>
        )}
        <main className={`flex-1 ${isPrintPage ? "p-0" : "p-4 sm:p-6 lg:p-8"} overflow-y-auto`}>
          {children}
        </main>
      </div>
    </div>
  );
}
