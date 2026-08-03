// Hash de senha isolado do Next: assim o seed (tsx) consegue importar
// sem carregar "next/headers".
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export function hashSenha(senha: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivada = scryptSync(senha, salt, 64).toString("hex");
  return `${salt}:${derivada}`;
}

export function conferirSenha(senha: string, guardada: string): boolean {
  const [salt, derivada] = (guardada || "").split(":");
  if (!salt || !derivada) return false;
  const buf = Buffer.from(derivada, "hex");
  const calc = scryptSync(senha, salt, 64);
  if (buf.length !== calc.length) return false;
  return timingSafeEqual(buf, calc);
}
