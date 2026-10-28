import { NextResponse } from "next/server";
import { db } from "@/db";
import { shipments, shipment_checkpoints, fleets, users } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";

// GET /api/mobile/shipments?driver_id=2 or active assignments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const driverIdParam = searchParams.get("driver_id");

    let query = db
      .select({
        id: shipments.id,
        resi: shipments.resi,
        reference_po: shipments.reference_po,
        pin_code: shipments.pin_code,
        sender_company: shipments.sender_company,
        origin_city: shipments.origin_city,
        origin_address: shipments.sender_address,
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
      .leftJoin(users, eq(shipments.driver_id, users.id));

    const result = driverIdParam
      ? await query.where(eq(shipments.driver_id, Number(driverIdParam)))
      : await query;

    // Check arrival_driver checkpoint for each shipment
    const allShipmentIds = result.map((s) => s.id);
    let arrivedShipmentIds = new Set<number>();

    if (allShipmentIds.length > 0) {
      const arrivalCheckpoints = await db
        .select({ shipment_id: shipment_checkpoints.shipment_id })
        .from(shipment_checkpoints)
        .where(eq(shipment_checkpoints.checkpoint_type, "arrival_driver"));
      arrivedShipmentIds = new Set(arrivalCheckpoints.map((c) => c.shipment_id));
    }

    const enhancedResult = result.map((s) => ({
      ...s,
      driver_arrived: arrivedShipmentIds.has(s.id),
    }));

    return NextResponse.json({
      success: true,
      data: enhancedResult,
    });
  } catch (error) {
    console.error("Mobile shipments list error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar pengiriman driver" },
      { status: 500 }
    );
  }
}
