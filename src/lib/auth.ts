import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export type SessionUser = {
  id: string;
  name: string;
  username: string;
  role: string;
};

// ===== Hash de senha (scrypt) =====

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, derived] = stored.split(":");
  if (!salt || !derived) return false;
  const derivedBuf = Buffer.from(derived, "hex");
  const calc = scryptSync(password, salt, 64);
  if (derivedBuf.length !== calc.length) return false;
  return timingSafeEqual(derivedBuf, calc);
}

// ===== Usuário atual a partir do cookie de sessão =====

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const userId = await verifySessionToken(token);
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.active) return null;
  return { id: user.id, name: user.name, username: user.username, role: user.role };
}

// Para páginas (Server Components): redireciona ao login se não autenticado.
export async function requireUserPage(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Papéis com poder de administração ("master" é o dono do site: além de tudo
// que o admin faz, é o único que gerencia membros e ninguém pode editá-lo).
const ADMIN_ROLES = ["admin", "master"];

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role);
}

export async function requireAdminPage(): Promise<SessionUser> {
  const user = await requireUserPage();
  if (!isAdminRole(user.role)) redirect("/");
  return user;
}

// Para server actions (mutações): lança erro se não autorizado.
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Não autenticado.");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isAdminRole(user.role)) throw new Error("Apenas administradores.");
  return user;
}

// Só o dono do site (conta master) pode gerenciar membros.
export async function requireMaster(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "master") throw new Error("Apenas o administrador master.");
  return user;
}
