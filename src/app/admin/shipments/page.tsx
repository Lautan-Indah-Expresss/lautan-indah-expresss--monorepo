import React from "react";
import { db } from "@/db";
import { shipments } from "@/db/schema";
import { desc } from "drizzle-orm";
import ShipmentsListView from "@/components/admin/ShipmentsListView";

// Fresh DB query on every request

function formatDateIndo(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  const m = months[date.getMonth()];
  const y = date.getFullYear();
  return `${d} ${m} ${y}`;
}

export default async function ShipmentsPage() {
  const records = await db.select().from(shipments).orderBy(desc(shipments.created_at));

  // Map to serializable records
  const initialShipments = records.map((s) => ({
    id: s.id,
    resi: s.resi,
    reference_po: s.reference_po,
    sender_company: s.sender_company,
    sender_contact: s.sender_contact,
    receiver_company: s.receiver_company,
    receiver_contact: s.receiver_contact,
    origin_city: s.origin_city,
    destination_city: s.destination_city,
    service_type: s.service_type,
    status: s.status,
    shipped_date: s.shipped_date.toISOString(),
    shipped_date_formatted: formatDateIndo(s.shipped_date),
    estimated_days: s.estimated_days,
    actual_weight_kg: s.actual_weight_kg,
    total_cost: s.total_cost,
    has_active_issue: s.has_active_issue,
  }));

  return <ShipmentsListView initialShipments={initialShipments} />;
}
