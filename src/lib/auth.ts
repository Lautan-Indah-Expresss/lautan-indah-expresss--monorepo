import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "kargo-b2b-super-secret-jwt-key-2026"
);

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + ":kargo_salt_2026").digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  if (password === hash) return true; // fallback for unhashed test seeds
  return hashPassword(password) === hash;
}

export interface AuthPayload {
  userId: number;
  name: string;
  username: string;
  role: "admin" | "driver";
}

/**
 * Calculates next expiration time for Admin (04:00 AM local time, max 14 hours)
 */
export function getAdminExpirationSeconds(): number {
  const now = new Date();
  const target = new Date(now);

  if (now.getHours() >= 4) {
    target.setDate(target.getDate() + 1);
  }
  target.setHours(4, 0, 0, 0);

  const diffSeconds = Math.floor((target.getTime() - now.getTime()) / 1000);
  const max14Hours = 14 * 60 * 60;
  return Math.min(diffSeconds, max14Hours);
}

/**
 * Sign JWT for Admin (expires at 04:00 AM / max 14h)
 */
export async function signAdminToken(payload: AuthPayload): Promise<string> {
  const expSeconds = getAdminExpirationSeconds();
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expSeconds}s`)
    .sign(JWT_SECRET);
}

/**
 * Sign JWT for Driver (45 days)
 */
export async function signDriverToken(payload: AuthPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("45d")
    .sign(JWT_SECRET);
}

/**
 * Verify JWT token string
 */
export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthPayload;
  } catch {
    return null;
  }
}
