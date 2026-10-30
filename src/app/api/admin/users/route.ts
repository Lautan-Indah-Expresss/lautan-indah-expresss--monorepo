import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, hashPassword } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or, desc, ne, and } from "drizzle-orm";

const DEFAULT_ADMIN_PASSWORD = "Adminlautanindahexp";

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
    const { name, username, password, role } = body;

    if (!name || !username) {
      return NextResponse.json(
        { error: "Nama dan username wajib diisi." },
        { status: 400 }
      );
    }

    // Gunakan password custom atau fallback ke default: Adminlautanindahexp
    const finalPassword = password && password.trim().length >= 6 ? password.trim() : DEFAULT_ADMIN_PASSWORD;

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

    const password_hash = hashPassword(finalPassword);

    await db.insert(users).values({
      name: String(name).trim(),
      username: String(username).trim(),
      password_hash,
      phone: "-", // Default no phone needed for admin
      role: targetRole,
      is_active: true,
    });

    return NextResponse.json({
      success: true,
      message: `Akun admin (${targetRole}) berhasil dibuat dengan password: ${finalPassword}`,
    });
  } catch (error) {
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json({ error: "Gagal membuat user admin baru" }, { status: 500 });
  }
}

// 3. PATCH: Update User (Nama, Username, Password baru, Role, Status Aktif)
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
    const { userId, name, username, newPassword, role, isActive } = body;

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

    // Update Nama
    if (name && name.trim()) {
      updates.name = name.trim();
    }

    // Update Username
    if (username && username.trim()) {
      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername !== targetUser[0].username) {
        // Cek apakah username sudah dipakai orang lain
        const duplicate = await db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.username, cleanUsername), ne(users.id, Number(userId))))
          .limit(1);

        if (duplicate.length > 0) {
          return NextResponse.json(
            { error: `Username '${cleanUsername}' sudah dipakai oleh akun lain.` },
            { status: 400 }
          );
        }
        updates.username = cleanUsername;
      }
    }

    // Reset Password oleh Super Admin
    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        return NextResponse.json({ error: "Kata sandi minimal 6 karakter" }, { status: 400 });
      }
      updates.password_hash = hashPassword(newPassword.trim());
    }

    // Update Role
    if (role && (role === "spradmexp" || role === "admexp")) {
      updates.role = role;
    }

    // Toggle Aktif/Nonaktif
    if (typeof isActive === "boolean") {
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
