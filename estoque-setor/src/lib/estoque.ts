// Helpers de data e texto. Tudo é exibido no fuso de Brasília, independente de
// onde o servidor esteja rodando (a Vercel roda em UTC).

export const TZ = "America/Sao_Paulo";

/** Chave de agrupamento: minúsculo, sem acento e sem espaço sobrando. */
export function normalizarNome(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Data no formato YYYY-MM-DD conforme o calendário de Brasília. */
function diaLocal(data: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);
}

/** Diferença em dias de calendário (não em horas), então "ontem" é sempre 1. */
export function diasDesde(entrada: Date, referencia = new Date()): number {
  const a = Date.parse(`${diaLocal(entrada)}T00:00:00Z`);
  const b = Date.parse(`${diaLocal(referencia)}T00:00:00Z`);
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

export function labelTempo(dias: number): string {
  if (dias === 0) return "hoje";
  if (dias === 1) return "1 dia";
  return `${dias} dias`;
}

/** Verde até 14 dias, amarelo até 29, vermelho a partir de 30. */
export function corTempo(dias: number): string {
  if (dias >= 30) return "bg-red-100 text-red-700";
  if (dias >= 15) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export function formatarData(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);
}

/** Hoje em YYYY-MM-DD, para preencher o `<input type="date">`. */
export function hojeInput(): string {
  return diaLocal(new Date());
}

/**
 * Converte "2026-08-25" numa data guardada ao meio-dia UTC. Guardar à meia-noite
 * faria o dia "voltar" um dia ao ser exibido em Brasília (UTC-3).
 */
export function dataDoInput(valor: string): Date {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor.trim());
  if (!partes) return new Date();
  const [, ano, mes, dia] = partes;
  return new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia), 12));
}
