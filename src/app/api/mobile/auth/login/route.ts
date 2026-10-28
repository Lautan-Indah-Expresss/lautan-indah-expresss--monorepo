import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { signDriverToken, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.username, username.trim()), eq(users.is_active, true)))
      .limit(1);

    if (!user || user.role !== "driver") {
      return NextResponse.json(
        { error: "Akun driver tidak ditemukan atau tidak aktif" },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Kata sandi driver salah" },
        { status: 401 }
      );
    }

    const token = await signDriverToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    });

    return NextResponse.json({
      success: true,
      message: "Login driver berhasil",
      token,
      driver: {
        id: user.id,
        name: user.name,
        username: user.username,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Mobile driver login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem saat autentikasi driver" },
      { status: 500 }
    );
  }
}

