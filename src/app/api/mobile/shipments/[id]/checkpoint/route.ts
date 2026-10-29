import { NextResponse } from "next/server";
import { db } from "@/db";
import { shipments, shipment_checkpoints, fleets } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shipmentId = Number(id);

    if (isNaN(shipmentId)) {
      return NextResponse.json({ error: "Shipment ID tidak valid" }, { status: 400 });
    }

    const body = await request.json();
    const {
      checkpoint_type, // "departure_selfie" | "transit_update" | "incident" | "incident_resolved" | "arrival_driver"
      status_label,
      description,
      photo_url,
      latitude,
      longitude,
    } = body;

    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId))
      .limit(1);

    if (!shipment) {
      return NextResponse.json({ error: "Data pengiriman tidak ditemukan" }, { status: 404 });
    }

    const now = new Date();

    // Cek apakah aksi ini berlaku armada-wide (Multi-Drop)
    // departure_selfie, transit_update, incident, incident_resolved berlaku untuk semua resi dalam trip yang belum terkirim DAN belum tiba di tujuan (driver_arrived == false)
    const isFleetWideAction = [
      "departure_selfie",
      "transit_update",
      "incident",
      "incident_resolved",
    ].includes(checkpoint_type);

    let targetShipments = [shipment];

    if (shipment.trip_code && isFleetWideAction) {
      // Ambil seluruh shipment dalam trip yang status != 'terkirim'
      const candidates = await db
        .select()
        .from(shipments)
        .where(
          and(
            eq(shipments.trip_code, shipment.trip_code),
            ne(shipments.status, "terkirim")
          )
        );

      // Cek shipment mana saja yang SUDAH arrival_driver
      const candidateIds = candidates.map((c) => c.id);
      let arrivedIds = new Set<number>();
      if (candidateIds.length > 0) {
        const arrivalRecords = await db
          .select({ shipment_id: shipment_checkpoints.shipment_id })
          .from(shipment_checkpoints)
          .where(eq(shipment_checkpoints.checkpoint_type, "arrival_driver"));
        arrivedIds = new Set(arrivalRecords.map((r) => r.shipment_id));
      }

      // Untuk transit_update, incident, incident_resolved: HANYA targetkan shipment yang BELUM tiba di tujuan (masih on the road / di bak truk)
      if (["transit_update", "incident", "incident_resolved"].includes(checkpoint_type)) {
        targetShipments = candidates.filter((c) => !arrivedIds.has(c.id));
      } else {
        // departure_selfie menargetkan yang masih tertunda
        targetShipments = candidates;
      }

      if (targetShipments.length === 0) {
        targetShipments = [shipment];
      }
    }

    // 1. Mutasi status shipment & sinkronisasi status armada (fleets)
    if (checkpoint_type === "departure_selfie") {
      for (const s of targetShipments) {
        if (s.status === "tertunda") {
          await db
            .update(shipments)
            .set({
              status: "dalam_pengiriman",
              has_active_issue: false,
            })
            .where(eq(shipments.id, s.id));
        }
      }
      // Update status armada menjadi on_trip
      if (shipment.fleet_id) {
        await db
          .update(fleets)
          .set({ status: "on_trip" })
          .where(eq(fleets.id, shipment.fleet_id));
      }
    } else if (checkpoint_type === "incident") {
      const issueNote = description
        ? `[Kendala Driver] ${description.slice(0, 150)}`
        : "Kendala di jalan";
      for (const s of targetShipments) {
        await db
          .update(shipments)
          .set({
            status: "kendala",
            has_active_issue: true,
            current_issue_note: issueNote,
          })
          .where(eq(shipments.id, s.id));
      }
      // Update status armada menjadi trouble jika ada kendala
      if (shipment.fleet_id) {
        await db
          .update(fleets)
          .set({ status: "trouble" })
          .where(eq(fleets.id, shipment.fleet_id));
      }
    } else if (checkpoint_type === "incident_resolved") {
      for (const s of targetShipments) {
        await db
          .update(shipments)
          .set({
            status: "dalam_pengiriman",
            has_active_issue: false,
            current_issue_note: null,
          })
          .where(eq(shipments.id, s.id));
      }
      // Kendala selesai -> armada kembali on_trip
      if (shipment.fleet_id) {
        await db
          .update(fleets)
          .set({ status: "on_trip" })
          .where(eq(fleets.id, shipment.fleet_id));
      }
    } else if (checkpoint_type === "arrival_driver") {
      // Driver tiba di lokasi penerima (spesifik per resi)
      await db
        .update(shipments)
        .set({
          has_active_issue: false,
        })
        .where(eq(shipments.id, shipmentId));
    }

    // 2. Insert into shipment_checkpoints table
    let lastInsertedId = 0;
    const checkpointTargets =
      isFleetWideAction && shipment.trip_code ? targetShipments : [{ id: shipmentId }];

    for (const target of checkpointTargets) {
      const [inserted] = await db.insert(shipment_checkpoints).values({
        shipment_id: target.id,
        actor_role: "driver",
        checkpoint_type: checkpoint_type || "transit_update",
        status_label: status_label || "Update Posisi Driver",
        description: description || null,
        photo_url: photo_url || null,
        latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
        created_at: now,
      });
      lastInsertedId = inserted.insertId;
    }

    return NextResponse.json({
      success: true,
      message: "Checkpoint berhasil dicatat",
      data: {
        id: lastInsertedId,
        checkpoint_type,
        status_label,
        affected_count: checkpointTargets.length,
      },
    });
  } catch (error) {
    console.error("Checkpoint mobile update error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan checkpoint driver" },
      { status: 500 }
    );
  }
}
