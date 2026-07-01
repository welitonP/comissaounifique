import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "admin_session";
const SESSION_VALUE = "admin";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não está configurado.");
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionToken(): string {
  return `${SESSION_VALUE}.${sign(SESSION_VALUE)}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [value, signature] = token.split(".");
  if (!value || !signature || value !== SESSION_VALUE) return false;
  const expected = sign(value);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function isAdminLoggedIn(): Promise<boolean> {
  const store = await cookies();
  return isValidSessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function requireAdminPage(): Promise<void> {
  const ok = await isAdminLoggedIn();
  if (!ok) {
    redirect("/admin/login");
  }
}

export const ADMIN_SESSION_COOKIE = SESSION_COOKIE;
