// Formatação de preço e telefone.

export function fmtPreco(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// "R$ 45,00" ou "45,00" ou "45" -> 4500
export function precoParaCentavos(valor: string): number {
  const limpo = String(valor || "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(limpo);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

// Guarda só os dígitos: "(47) 99999-8888" -> "47999998888"
export function soDigitos(v: string): string {
  return String(v || "").replace(/\D/g, "");
}

export function telefoneValido(v: string): boolean {
  const d = soDigitos(v);
  return d.length === 10 || d.length === 11;
}

export function fmtTelefone(v: string): string {
  const d = soDigitos(v);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return v;
}

// Link do WhatsApp com mensagem pronta.
export function linkWhatsApp(telefone: string, mensagem?: string): string {
  const d = soDigitos(telefone);
  const numero = d.startsWith("55") ? d : `55${d}`;
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : "";
  return `https://wa.me/${numero}${texto}`;
}

export function primeiroNome(nome: string): string {
  return (nome || "").trim().split(/\s+/)[0] || "";
}

export function iniciais(nome: string): string {
  const partes = (nome || "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
