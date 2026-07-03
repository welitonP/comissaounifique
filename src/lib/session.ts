// Módulo de sessão compatível com Edge (middleware) e Node.
// Usa Web Crypto (globalThis.crypto) para assinar/verificar o cookie de sessão.

const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não configurado.");
  return secret;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toHex(signature);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export const SESSION_COOKIE = "session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 dias

export async function createSessionToken(userId: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${userId}.${exp}`;
  const signature = await hmac(payload);
  return `${payload}.${signature}`;
}

// Retorna o userId se o token for válido e não expirado, senão null.
export async function verifySessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expStr, signature] = parts;
  if (!userId || !expStr || !signature) return null;
  const expected = await hmac(`${userId}.${expStr}`);
  if (!safeEqual(signature, expected)) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;
  return userId;
}
