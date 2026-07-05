// Utilitários de data/hora no fuso de Brasília.
// O Brasil está em UTC-3 fixo (sem horário de verão desde 2019), por isso
// tratamos o offset como -03:00. Isso evita o bug em que o horário digitado
// era interpretado como UTC no servidor (Vercel roda em UTC) e ficava 3h errado.

export const TZ_BRASIL = "America/Sao_Paulo";
const OFFSET_BRASIL = "-03:00";

// Converte o valor de um <input type="datetime-local"> (que representa o
// horário de Brasília digitado) no instante correto (Date com o UTC certo).
export function parseDataLocal(valor: string): Date | null {
  if (!valor) return null;
  const base = valor.trim().slice(0, 16); // "YYYY-MM-DDTHH:mm"
  if (base.length < 16) {
    // Só data (YYYY-MM-DD): assume início do dia em Brasília.
    const d = new Date(`${valor.slice(0, 10)}T00:00:00${OFFSET_BRASIL}`);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(`${base}:00${OFFSET_BRASIL}`);
  return isNaN(d.getTime()) ? null : d;
}

// Partes de ano/mês/dia no fuso de Brasília (para montar a grade do calendário).
export function partesDataBrasil(d: Date | string): { ano: number; mes: number; dia: number } {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_BRASIL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(d));
  const [ano, mes, dia] = s.split("-").map(Number);
  return { ano, mes, dia };
}

export function fmtDataHora(d: Date | string): string {
  return new Date(d).toLocaleString("pt-BR", {
    timeZone: TZ_BRASIL,
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtData(d: Date | string): string {
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: TZ_BRASIL });
}

export function fmtHora(d: Date | string): string {
  return new Date(d).toLocaleTimeString("pt-BR", {
    timeZone: TZ_BRASIL,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDiaSemanaLongo(d: Date | string): string {
  return new Date(d).toLocaleDateString("pt-BR", {
    timeZone: TZ_BRASIL,
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}
