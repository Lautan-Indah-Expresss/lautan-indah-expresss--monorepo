import React from "react";
import { db } from "@/db";
import { shipments, shipment_checkpoints } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
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

  // Fetch arrival_driver checkpoints to detect shipments that arrived at destination but pending confirmation
  const arrivalCheckpoints = await db
    .select({
      shipment_id: shipment_checkpoints.shipment_id,
      checkpoint_type: shipment_checkpoints.checkpoint_type,
      photo_url: shipment_checkpoints.photo_url,
      description: shipment_checkpoints.description,
      created_at: shipment_checkpoints.created_at,
    })
    .from(shipment_checkpoints)
    .where(eq(shipment_checkpoints.checkpoint_type, "arrival_driver"));

  const arrivalConfirmCheckpoints = await db
    .select({
      shipment_id: shipment_checkpoints.shipment_id,
      checkpoint_type: shipment_checkpoints.checkpoint_type,
      photo_url: shipment_checkpoints.photo_url,
      description: shipment_checkpoints.description,
      created_at: shipment_checkpoints.created_at,
    })
    .from(shipment_checkpoints)
    .where(eq(shipment_checkpoints.checkpoint_type, "arrival_confirm"));

  const arrivedShipmentIds = new Set(arrivalCheckpoints.map((c) => c.shipment_id));

  // Map to serializable records
  const initialShipments = records.map((s) => {
    const confirmCp = arrivalConfirmCheckpoints.find((c) => c.shipment_id === s.id);
    const driverCp = arrivalCheckpoints.find((c) => c.shipment_id === s.id);

    return {
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
      driver_arrived: arrivedShipmentIds.has(s.id) && s.status === "dalam_pengiriman",
      shipped_date: s.shipped_date.toISOString(),
      shipped_date_formatted: formatDateIndo(s.shipped_date),
      estimated_days: s.estimated_days,
      actual_weight_kg: s.actual_weight_kg,
      total_cost: s.total_cost,
      has_active_issue: s.has_active_issue,
      received_by: s.received_by,
      received_date: s.received_date ? s.received_date.toISOString() : null,
      proof_photo_confirm: confirmCp?.photo_url || null,
      proof_photo_driver: driverCp?.photo_url || null,
      proof_notes: confirmCp?.description || null,
    };
  });

  return <ShipmentsListView initialShipments={initialShipments} />;
}
