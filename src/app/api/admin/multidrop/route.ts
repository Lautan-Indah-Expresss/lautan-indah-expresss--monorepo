import { NextResponse } from "next/server";
import { db } from "@/db";
import { shipments, fleets, users } from "@/db/schema";
import { eq, and, inArray, isNull, desc } from "drizzle-orm";

// 1. GET: Ambil data resi yang belum diberangkatkan (status: 'tertunda') untuk perencanaan Multi-Drop
export async function GET() {
  try {
    // Ambil resi tertunda
    const pendingShipments = await db
      .select({
        id: shipments.id,
        resi: shipments.resi,
        reference_po: shipments.reference_po,
        sender_company: shipments.sender_company,
        origin_city: shipments.origin_city,
        receiver_company: shipments.receiver_company,
        destination_city: shipments.destination_city,
        destination_address: shipments.receiver_address,
        total_colli: shipments.total_colli,
        actual_weight_kg: shipments.actual_weight_kg,
        trip_code: shipments.trip_code,
        drop_sequence: shipments.drop_sequence,
        fleet_id: shipments.fleet_id,
        driver_id: shipments.driver_id,
        driver_name: users.name,
        nopol: fleets.nopol,
      })
      .from(shipments)
      .leftJoin(fleets, eq(shipments.fleet_id, fleets.id))
      .leftJoin(users, eq(shipments.driver_id, users.id))
      .where(eq(shipments.status, "tertunda"))
      .orderBy(desc(shipments.created_at));

    // Ambil daftar driver aktif
    const activeDrivers = await db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
      })
      .from(users)
      .where(and(eq(users.role, "driver"), eq(users.is_active, true)));

    // Ambil daftar armada aktif
    const activeFleets = await db
      .select({
        id: fleets.id,
        nopol: fleets.nopol,
        vehicle_name: fleets.vehicle_name,
        default_driver_id: fleets.default_driver_id,
      })
      .from(fleets)
      .where(eq(fleets.status, "available"));

    return NextResponse.json({
      success: true,
      data: {
        pendingShipments,
        drivers: activeDrivers,
        fleets: activeFleets,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/multidrop error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data perencanaan multi-drop" },
      { status: 500 }
    );
  }
}

// 2. POST: Terbitkan Tugas Multi-Drop
// Body: { driver_id: number, fleet_id: number, drops: [{ shipment_id: number, drop_sequence: number }] }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { driver_id, fleet_id, drops } = body;

    if (!driver_id || !fleet_id) {
      return NextResponse.json(
        { error: "Driver dan Armada Truk wajib dipilih" },
        { status: 400 }
      );
    }

    if (!Array.isArray(drops) || drops.length < 2) {
      return NextResponse.json(
        { error: "Multi-Drop minimal memerlukan 2 resi yang digabungkan" },
        { status: 400 }
      );
    }

    // Generate kode trip unik (format: TRIP-YYYYMMDD-XXXX)
    const today = new Date();
    const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const tripCode = `TRIP-${yyyymmdd}-${randomSuffix}`;

    // Update setiap shipment yang dipilih
    for (const drop of drops) {
      await db
        .update(shipments)
        .set({
          driver_id: Number(driver_id),
          fleet_id: Number(fleet_id),
          trip_code: tripCode,
          drop_sequence: Number(drop.drop_sequence) || 1,
        })
        .where(eq(shipments.id, Number(drop.shipment_id)));
    }

    return NextResponse.json({
      success: true,
      message: `Tugas Multi-Drop ${tripCode} berhasil diterbitkan untuk ${drops.length} resi!`,
      data: {
        trip_code: tripCode,
        affected_count: drops.length,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/multidrop error:", error);
    return NextResponse.json(
      { error: "Gagal menerbitkan tugas multi-drop" },
      { status: 500 }
    );
  }
}

// 3. DELETE: Batalkan / Pecah Trip Multi-Drop kembali ke resi reguler
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripCode = searchParams.get("trip_code");

    if (!tripCode) {
      return NextResponse.json(
        { error: "trip_code parameter wajib disertakan" },
        { status: 400 }
      );
    }

    // Reset trip_code dan drop_sequence
    await db
      .update(shipments)
      .set({
        trip_code: null,
        drop_sequence: 1,
      })
      .where(
        and(
          eq(shipments.trip_code, tripCode),
          eq(shipments.status, "tertunda")
        )
      );

    return NextResponse.json({
      success: true,
      message: `Tugas Multi-Drop ${tripCode} berhasil dibatalkan dan dipecah kembali ke resi biasa.`,
    });
  } catch (error) {
    console.error("DELETE /api/admin/multidrop error:", error);
    return NextResponse.json(
      { error: "Gagal membatalkan tugas multi-drop" },
      { status: 500 }
    );
  }
}
