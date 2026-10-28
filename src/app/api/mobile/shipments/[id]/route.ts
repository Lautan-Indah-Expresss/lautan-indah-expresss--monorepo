import { NextResponse } from "next/server";
import { db } from "@/db";
import { shipments, shipment_checkpoints, fleets, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shipmentId = Number(id);

    if (isNaN(shipmentId)) {
      return NextResponse.json({ error: "Shipment ID tidak valid" }, { status: 400 });
    }

    const [shipment] = await db
      .select({
        id: shipments.id,
        resi: shipments.resi,
        reference_po: shipments.reference_po,
        pin_code: shipments.pin_code,
        sender_company: shipments.sender_company,
        sender_address: shipments.sender_address,
        origin_city: shipments.origin_city,
        origin_lat: shipments.origin_lat,
        origin_lng: shipments.origin_lng,
        receiver_company: shipments.receiver_company,
        receiver_phone: shipments.receiver_phone,
        destination_city: shipments.destination_city,
        destination_address: shipments.receiver_address,
        destination_lat: shipments.destination_lat,
        destination_lng: shipments.destination_lng,
        status: shipments.status,
        has_active_issue: shipments.has_active_issue,
        current_issue_note: shipments.current_issue_note,
        total_colli: shipments.total_colli,
        actual_weight_kg: shipments.actual_weight_kg,
        shipped_date: shipments.shipped_date,
        estimated_days: shipments.estimated_days,
        nopol: fleets.nopol,
        vehicle_name: fleets.vehicle_name,
        driver_id: shipments.driver_id,
        driver_name: users.name,
        trip_code: shipments.trip_code,
        drop_sequence: shipments.drop_sequence,
      })
      .from(shipments)
      .leftJoin(fleets, eq(shipments.fleet_id, fleets.id))
      .leftJoin(users, eq(shipments.driver_id, users.id))
      .where(eq(shipments.id, shipmentId))
      .limit(1);

    if (!shipment) {
      return NextResponse.json({ error: "Pengiriman tidak ditemukan" }, { status: 404 });
    }

    // Ambil seluruh riwayat checkpoint
    const checkpoints = await db
      .select()
      .from(shipment_checkpoints)
      .where(eq(shipment_checkpoints.shipment_id, shipmentId))
      .orderBy(shipment_checkpoints.created_at);

    const hasArrival = checkpoints.some((c) => c.checkpoint_type === "arrival_driver");

    return NextResponse.json({
      success: true,
      data: {
        ...shipment,
        driver_arrived: hasArrival,
        checkpoints,
      },
    });
  } catch (error) {
    console.error("Mobile shipment detail error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil detail tugas pengiriman" },
      { status: 500 }
    );
  }
}
