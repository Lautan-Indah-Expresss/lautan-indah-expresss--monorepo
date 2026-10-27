import { NextResponse } from "next/server";
import { db } from "@/db";
import { shipments, shipment_items, shipment_checkpoints, fleets, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ resi: string }> }
) {
  try {
    const { resi } = await params;
    const cleanResi = resi ? resi.trim().toUpperCase() : "";

    if (!cleanResi) {
      return NextResponse.json({ error: "Nomor resi wajib diisi" }, { status: 400 });
    }

    const [shipment] = await db
      .select({
        id: shipments.id,
        resi: shipments.resi,
        reference_po: shipments.reference_po,
        pin_code: shipments.pin_code,
        sender_company: shipments.sender_company,
        sender_contact: shipments.sender_contact,
        sender_phone: shipments.sender_phone,
        sender_address: shipments.sender_address,
        origin_city: shipments.origin_city,
        origin_province: shipments.origin_province,
        origin_lat: shipments.origin_lat,
        origin_lng: shipments.origin_lng,
        receiver_company: shipments.receiver_company,
        receiver_contact: shipments.receiver_contact,
        receiver_phone: shipments.receiver_phone,
        receiver_address: shipments.receiver_address,
        destination_city: shipments.destination_city,
        destination_province: shipments.destination_province,
        destination_lat: shipments.destination_lat,
        destination_lng: shipments.destination_lng,
        service_type: shipments.service_type,
        service_name: shipments.service_name,
        has_insurance: shipments.has_insurance,
        actual_weight_kg: shipments.actual_weight_kg,
        volume_weight_kg: shipments.volume_weight_kg,
        total_colli: shipments.total_colli,
        payment_method: shipments.payment_method,
        status: shipments.status,
        has_active_issue: shipments.has_active_issue,
        current_issue_note: shipments.current_issue_note,
        shipped_date: shipments.shipped_date,
        estimated_days: shipments.estimated_days,
        estimated_arrival: shipments.estimated_arrival,
        received_date: shipments.received_date,
        received_by: shipments.received_by,
        nopol: fleets.nopol,
        vehicle_name: fleets.vehicle_name,
        driver_name: users.name,
        driver_phone: users.phone,
      })
      .from(shipments)
      .leftJoin(fleets, eq(shipments.fleet_id, fleets.id))
      .leftJoin(users, eq(shipments.driver_id, users.id))
      .where(eq(shipments.resi, cleanResi))
      .limit(1);

    if (!shipment) {
      return NextResponse.json({ error: "Resi pengiriman tidak ditemukan" }, { status: 404 });
    }

    // Get items
    const items = await db
      .select()
      .from(shipment_items)
      .where(eq(shipment_items.shipment_id, shipment.id));

    // Get checkpoints in chronological order
    const checkpoints = await db
      .select()
      .from(shipment_checkpoints)
      .where(eq(shipment_checkpoints.shipment_id, shipment.id))
      .orderBy(shipment_checkpoints.created_at);

    return NextResponse.json({
      success: true,
      data: {
        ...shipment,
        items,
        checkpoints,
      },
    });
  } catch (error) {
    console.error("Fetch tracking error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pelacakan" },
      { status: 500 }
    );
  }
}
