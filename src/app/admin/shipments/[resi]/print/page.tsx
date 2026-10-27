import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { shipments, fleets, users, shipment_items } from "@/db/schema";
import { eq } from "drizzle-orm";
import PrintResiView from "@/components/admin/PrintResiView";

interface PageProps {
  params: Promise<{ resi: string }>;
}

// Print page

function formatDateLong(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const m = months[date.getMonth()];
  const y = date.getFullYear();
  return `${d} ${m} ${y}`;
}

export default async function PrintResiPage({ params }: PageProps) {
  const { resi } = await params;
  const cleanResi = decodeURIComponent(resi).trim();

  // Find shipment
  const foundShipments = await db
    .select()
    .from(shipments)
    .where(eq(shipments.resi, cleanResi))
    .limit(1);

  if (foundShipments.length === 0) {
    notFound();
  }

  const s = foundShipments[0];

  // Fetch items
  const items = await db
    .select()
    .from(shipment_items)
    .where(eq(shipment_items.shipment_id, s.id));

  // Fetch fleet info if any
  let fleetNopol = null;
  let fleetName = null;
  if (s.fleet_id) {
    const f = await db.select().from(fleets).where(eq(fleets.id, s.fleet_id)).limit(1);
    if (f.length > 0) {
      fleetNopol = f[0].nopol;
      fleetName = f[0].vehicle_name;
    }
  }

  // Fetch driver info if any
  let driverName = null;
  if (s.driver_id) {
    const d = await db.select().from(users).where(eq(users.id, s.driver_id)).limit(1);
    if (d.length > 0) {
      driverName = d[0].name;
    }
  }

  const shipmentData = {
    resi: s.resi,
    reference_po: s.reference_po,
    pin_code: s.pin_code,
    sender_company: s.sender_company,
    sender_contact: s.sender_contact,
    sender_phone: s.sender_phone,
    sender_address: s.sender_address,
    origin_city: s.origin_city,
    origin_province: s.origin_province,
    origin_postal_code: s.origin_postal_code,
    receiver_company: s.receiver_company,
    receiver_contact: s.receiver_contact,
    receiver_phone: s.receiver_phone,
    receiver_address: s.receiver_address,
    destination_city: s.destination_city,
    destination_province: s.destination_province,
    destination_postal_code: s.destination_postal_code,
    service_type: s.service_type,
    service_name: s.service_name,
    has_insurance: s.has_insurance,
    actual_weight_kg: s.actual_weight_kg,
    volume_weight_kg: s.volume_weight_kg,
    total_colli: s.total_colli,
    payment_method: s.payment_method,
    notes: s.notes,
    shipping_cost: s.shipping_cost,
    insurance_cost: s.insurance_cost,
    other_cost: s.other_cost,
    total_cost: s.total_cost,
    shipped_date: s.shipped_date.toISOString(),
    shipped_date_formatted: formatDateLong(s.shipped_date),
    estimated_days: s.estimated_days,
    inspected_by: s.inspected_by,
    fleet_nopol: fleetNopol,
    fleet_name: fleetName,
    driver_name: driverName,
    items: items.map((i) => ({
      id: i.id,
      item_name: i.item_name,
      qty: i.qty,
      weight_kg: i.weight_kg,
      item_value: i.item_value,
    })),
  };

  return <PrintResiView shipment={shipmentData} />;
}
