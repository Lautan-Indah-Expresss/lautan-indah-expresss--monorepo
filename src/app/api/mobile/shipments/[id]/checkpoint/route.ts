import { NextResponse } from "next/server";
import { db } from "@/db";
import { shipments, shipment_checkpoints } from "@/db/schema";
import { eq } from "drizzle-orm";

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

    // 1. Determine shipment status mutation based on action
    if (checkpoint_type === "departure_selfie") {
      await db
        .update(shipments)
        .set({
          status: "dalam_pengiriman",
          has_active_issue: false,
        })
        .where(eq(shipments.id, shipmentId));
    } else if (checkpoint_type === "incident") {
      await db
        .update(shipments)
        .set({
          status: "kendala",
          has_active_issue: true,
          current_issue_note: description ? `[Kendala Driver] ${description.slice(0, 150)}` : "Kendala di jalan",
        })
        .where(eq(shipments.id, shipmentId));
    } else if (checkpoint_type === "incident_resolved") {
      await db
        .update(shipments)
        .set({
          status: "dalam_pengiriman",
          has_active_issue: false,
          current_issue_note: null,
        })
        .where(eq(shipments.id, shipmentId));
    } else if (checkpoint_type === "arrival_driver") {
      // Driver arrived at recipient location
      await db
        .update(shipments)
        .set({
          has_active_issue: false,
        })
        .where(eq(shipments.id, shipmentId));
    }

    // 2. Insert into shipment_checkpoints table
    const [inserted] = await db.insert(shipment_checkpoints).values({
      shipment_id: shipmentId,
      actor_role: "driver",
      checkpoint_type: checkpoint_type || "transit_update",
      status_label: status_label || "Update Posisi Driver",
      description: description || null,
      photo_url: photo_url || null,
      // Jika checkpoint tiba di tujuan (arrival_driver), kunci koordinat ke titik tujuan
      latitude: (checkpoint_type === 'arrival_driver' && shipment.destination_lat) ? String(shipment.destination_lat) : (latitude ? String(latitude) : null),
      longitude: (checkpoint_type === 'arrival_driver' && shipment.destination_lng) ? String(shipment.destination_lng) : (longitude ? String(longitude) : null),
      created_at: now,
    });

    return NextResponse.json({
      success: true,
      message: "Checkpoint berhasil dicatat",
      data: {
        id: inserted.insertId,
        checkpoint_type,
        status_label,
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
