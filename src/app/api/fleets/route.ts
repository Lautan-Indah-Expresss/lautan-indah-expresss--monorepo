import { NextResponse } from "next/server";
import { db } from "@/db";
import { fleets, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const records = await db
      .select({
        id: fleets.id,
        nopol: fleets.nopol,
        vehicle_name: fleets.vehicle_name,
        default_driver_id: fleets.default_driver_id,
        default_driver_name: users.name,
        default_driver_phone: users.phone,
        status: fleets.status,
        created_at: fleets.created_at,
      })
      .from(fleets)
      .leftJoin(users, eq(fleets.default_driver_id, users.id))
      .orderBy(desc(fleets.created_at));

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error("GET /api/fleets error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data master armada" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nopol, vehicle_name, default_driver_id, status } = body;

    if (!nopol || !vehicle_name) {
      return NextResponse.json(
        { error: "Nomor plat dan nama kendaraan wajib diisi" },
        { status: 400 }
      );
    }

    const cleanNopol = String(nopol).trim().toUpperCase();

    // Check unique nopol
    const existing = await db
      .select()
      .from(fleets)
      .where(eq(fleets.nopol, cleanNopol))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Nomor Plat '${cleanNopol}' sudah terdaftar` },
        { status: 400 }
      );
    }

    await db.insert(fleets).values({
      nopol: cleanNopol,
      vehicle_name: String(vehicle_name).trim(),
      default_driver_id: default_driver_id ? Number(default_driver_id) : null,
      status: status || "available",
    });

    return NextResponse.json({
      success: true,
      message: "Data armada berhasil ditambahkan",
    });
  } catch (error) {
    console.error("POST /api/fleets error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data armada baru" },
      { status: 500 }
    );
  }
}
