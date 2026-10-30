import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, hashPassword, verifyPassword } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
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

    const body = await request.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: "Kata sandi lama dan kata sandi baru wajib diisi" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Kata sandi baru minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Ambil user dari database
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
    }

    const currentUser = foundUsers[0];

    // Verifikasi kata sandi lama
    const isOldValid = verifyPassword(oldPassword, currentUser.password_hash);
    if (!isOldValid) {
      return NextResponse.json(
        { error: "Kata sandi lama yang Anda masukkan salah" },
        { status: 400 }
      );
    }

    // Update password
    const newHash = hashPassword(newPassword);
    await db
      .update(users)
      .set({ password_hash: newHash })
      .where(eq(users.id, currentUser.id));

    return NextResponse.json({
      success: true,
      message: "Kata sandi berhasil diperbarui. Silakan login kembali dengan sandi baru.",
    });
  } catch (error) {
    console.error("POST /api/admin/profile/change-password error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
