import { NextResponse } from "next/server";
import { db } from "@/db";
import { shipments, shipment_checkpoints } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { resi, shipmentId } = body;

    if (!resi && !shipmentId) {
      return NextResponse.json(
        { error: "Parameter nomor resi atau shipmentId wajib disertakan" },
        { status: 400 }
      );
    }

    // 1. Cari shipment yang dimaksud
    let shipment;
    if (shipmentId) {
      const [found] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, Number(shipmentId)))
        .limit(1);
      shipment = found;
    } else if (resi) {
      const cleanResi = String(resi).trim().toUpperCase();
      const [found] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.resi, cleanResi))
        .limit(1);
      shipment = found;
    }

    if (!shipment) {
      return NextResponse.json(
        { error: `Data resi tidak ditemukan di database` },
        { status: 404 }
      );
    }

    // 2. Hapus seluruh riwayat checkpoints perjalanan supir & konfirmasi penerima
    await db
      .delete(shipment_checkpoints)
      .where(eq(shipment_checkpoints.shipment_id, shipment.id));

    // 3. Reset status shipment kembali ke 'tertunda' (Belum Berangkat)
    // Kosongkan received_date, received_by, status kendala, catatan dsb.
    await db
      .update(shipments)
      .set({
        status: "tertunda",
        has_active_issue: false,
        current_issue_note: null,
        received_by: null,
        received_date: null,
      })
      .where(eq(shipments.id, shipment.id));

    return NextResponse.json({
      success: true,
      message: `Resi ${shipment.resi} berhasil direset ke mode awal (Belum Berangkat). Seluruh foto checkpoint, GPS, dan konfirmasi telah dikosongkan.`,
      data: {
        id: shipment.id,
        resi: shipment.resi,
        status: "tertunda",
      },
    });
  } catch (error: any) {
    console.error("Error resetting shipment:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mereset resi" },
      { status: 500 }
    );
  }
}

// Endpoint GET untuk mengambil daftar semua resi agar mudah dipilih di dropdown web reset
export async function GET() {
  try {
    const list = await db
      .select({
        id: shipments.id,
        resi: shipments.resi,
        status: shipments.status,
        origin_city: shipments.origin_city,
        destination_city: shipments.destination_city,
        receiver_company: shipments.receiver_company,
        created_at: shipments.created_at,
      })
      .from(shipments);

    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal mengambil daftar resi" },
      { status: 500 }
    );
  }
}
