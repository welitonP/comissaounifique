// E-mail corporativo exigido nas inscrições. Por enquanto o site só confere o
// formato e o domínio (não envia código de confirmação).
//
// Domínios aceitos: variável EMAIL_DOMINIOS (separados por vírgula). Padrão:
// redeunifique.com.br.
export function dominiosAceitos(): string[] {
  const env = (process.env.EMAIL_DOMINIOS || "")
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
  return env.length > 0 ? env : ["redeunifique.com.br"];
}

// Devolve o e-mail normalizado (minúsculo, sem espaços) ou null se não for um
// e-mail válido de um dos domínios aceitos.
export function emailCorporativo(bruto: string): string | null {
  const email = bruto.trim().toLowerCase();
  if (email.length > 120) return null;
  const m = /^[a-z0-9](?:[a-z0-9._+-]*[a-z0-9])?@([a-z0-9.-]+)$/.exec(email);
  if (!m) return null;
  return dominiosAceitos().includes(m[1]) ? email : null;
}

// Texto para mostrar ao usuário: "@redeunifique.com.br" ou "@a.com ou @b.com".
export function dominiosTexto(): string {
  return dominiosAceitos()
    .map((d) => `@${d}`)
    .join(" ou ");
}
