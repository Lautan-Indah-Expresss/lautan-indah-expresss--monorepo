import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, signAdminToken, signDriverToken, getAdminExpirationSeconds } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }

    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.username, String(username).trim()))
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json(
        { error: "Username atau kata sandi tidak valid" },
        { status: 401 }
      );
    }

    const user = foundUsers[0];

    if (!user.is_active) {
      return NextResponse.json(
        { error: "Akun ini telah dinonaktifkan" },
        { status: 403 }
      );
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Username atau kata sandi tidak valid" },
        { status: 401 }
      );
    }

    const payload = {
      userId: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    };

    if (user.role === "spradmexp" || user.role === "admexp") {
      const token = await signAdminToken(payload);
      const maxAge = getAdminExpirationSeconds();

      const response = NextResponse.json({
        success: true,
        user: payload,
        redirectUrl: "/admin",
      });

      response.cookies.set("kargo_admin_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: maxAge,
      });

      return response;
    } else {
      // Driver role
      const token = await signDriverToken(payload);
      return NextResponse.json({
        success: true,
        user: payload,
        token: token,
      });
    }
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal pada server" },
      { status: 500 }
    );
  }
}
