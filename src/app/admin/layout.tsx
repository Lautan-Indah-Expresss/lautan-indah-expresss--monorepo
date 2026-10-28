import React, { Suspense } from "react";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";

export const metadata = {
  title: "LIE Cargo - Sistem Monitoring Armada & Pengiriman Logistik",
  description: "Portal Administrasi dan Monitoring Pengiriman Logistik LIE Cargo",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </Suspense>
  );
}
