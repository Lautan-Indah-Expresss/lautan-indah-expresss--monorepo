import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const drivers = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        phone: users.phone,
        role: users.role,
        is_active: users.is_active,
        created_at: users.created_at,
      })
      .from(users)
      .where(eq(users.role, "driver"))
      .orderBy(desc(users.created_at));

    return NextResponse.json({ success: true, data: drivers });
  } catch (error) {
    console.error("GET /api/drivers error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kurir/driver" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, username, password, phone } = body;

    if (!name || !username || !password || !phone) {
      return NextResponse.json(
        { error: "Nama, username, kata sandi, dan nomor telepon wajib diisi" },
        { status: 400 }
      );
    }

    // Check unique username
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, String(username).trim()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Username '${username}' sudah digunakan` },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);

    await db.insert(users).values({
      name: String(name).trim(),
      username: String(username).trim(),
      password_hash: passwordHash,
      phone: String(phone).trim(),
      role: "driver",
      is_active: true,
    });

    return NextResponse.json({
      success: true,
      message: "Akun driver berhasil dibuat",
    });
  } catch (error) {
    console.error("POST /api/drivers error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data driver baru" },
      { status: 500 }
    );
  }
}
