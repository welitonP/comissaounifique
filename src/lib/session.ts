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

export async function createSessionToken(userId: string): Promise<string> {
  const signature = await hmac(userId);
  return `${userId}.${signature}`;
}

// Retorna o userId se o token for válido, senão null.
export async function verifySessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const sep = token.lastIndexOf(".");
  if (sep <= 0) return null;
  const userId = token.slice(0, sep);
  const signature = token.slice(sep + 1);
  const expected = await hmac(userId);
  if (!safeEqual(signature, expected)) return null;
  return userId;
}
