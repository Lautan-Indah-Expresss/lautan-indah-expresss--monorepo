import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("kargo_admin_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
    }

    const foundUsers = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        phone: users.phone,
        role: users.role,
        is_active: users.is_active,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: foundUsers[0] });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
