import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, hashPassword } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or, desc } from "drizzle-orm";

// 1. GET: Ambil daftar seluruh user admin (Khusus spradmexp)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("kargo_admin_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "spradmexp") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Super Admin (spradmexp) yang memiliki izin." },
        { status: 403 }
      );
    }

    const adminList = await db
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
      .where(
        or(
          eq(users.role, "spradmexp"),
          eq(users.role, "admexp")
        )
      )
      .orderBy(desc(users.created_at));

    return NextResponse.json({ success: true, data: adminList });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Gagal mengambil daftar admin" }, { status: 500 });
  }
}

// 2. POST: Tambah user admin baru (Khusus spradmexp)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("kargo_admin_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "spradmexp") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Super Admin (spradmexp) yang dapat membuat akun admin." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, username, password, phone, role } = body;

    if (!name || !username || !password || !phone) {
      return NextResponse.json(
        { error: "Nama, username, kata sandi, dan nomor telepon wajib diisi." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Kata sandi minimal 6 karakter." },
        { status: 400 }
      );
    }

    // Role yang diizinkan dibuat: admexp atau spradmexp
    const targetRole = role === "spradmexp" ? "spradmexp" : "admexp";

    // Cek username unik
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, String(username).trim()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Username '${username}' sudah digunakan oleh akun lain.` },
        { status: 400 }
      );
    }

    const password_hash = hashPassword(password);

    await db.insert(users).values({
      name: String(name).trim(),
      username: String(username).trim(),
      password_hash,
      phone: String(phone).trim(),
      role: targetRole,
      is_active: true,
    });

    return NextResponse.json({
      success: true,
      message: `Akun admin (${targetRole}) berhasil dibuat.`,
    });
  } catch (error) {
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json({ error: "Gagal membuat user admin baru" }, { status: 500 });
  }
}

// 3. PATCH: Ubah status aktif atau reset password user (Khusus spradmexp)
export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("kargo_admin_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "spradmexp") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Super Admin (spradmexp) yang memiliki izin." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, newPassword, isActive } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID wajib ditentukan" }, { status: 400 });
    }

    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(userId)))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const updates: Record<string, any> = {};

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Kata sandi minimal 6 karakter" }, { status: 400 });
      }
      updates.password_hash = hashPassword(newPassword);
    }

    if (typeof isActive === "boolean") {
      // Mencegah super admin menonaktifkan akunnya sendiri jika sedang login
      if (targetUser[0].id === payload.userId && !isActive) {
        return NextResponse.json(
          { error: "Anda tidak dapat menonaktifkan akun Super Admin Anda sendiri!" },
          { status: 400 }
        );
      }
      updates.is_active = isActive;
    }

    await db.update(users).set(updates).where(eq(users.id, Number(userId)));

    return NextResponse.json({
      success: true,
      message: "Data akun admin berhasil diperbarui.",
    });
  } catch (error) {
    console.error("PATCH /api/admin/users error:", error);
    return NextResponse.json({ error: "Gagal memperbarui data admin" }, { status: 500 });
  }
}
