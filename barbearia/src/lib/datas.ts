// Utilitários de data/hora no fuso de Brasília.
// O Brasil está em UTC-3 fixo (sem horário de verão desde 2019), por isso
// tratamos o offset como -03:00. Isso evita o bug clássico de o horário
// digitado ser interpretado como UTC no servidor (a Vercel roda em UTC).

export const TZ_BRASIL = "America/Sao_Paulo";
const OFFSET_BRASIL = "-03:00";

export const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export const DIAS_SEMANA_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// "2026-08-03" + "14:30" -> instante correto (Date em UTC).
export function dataHoraBrasil(diaISO: string, hhmm: string): Date {
  return new Date(`${diaISO}T${hhmm}:00${OFFSET_BRASIL}`);
}

// "2026-08-03" + 870 (minutos desde meia-noite) -> Date.
export function dataHoraBrasilMin(diaISO: string, minutos: number): Date {
  return dataHoraBrasil(diaISO, minParaHHMM(minutos));
}

// Instante -> "YYYY-MM-DD" no fuso de Brasília.
export function diaISO(d: Date | string = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_BRASIL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(d));
}

export function hojeISO(): string {
  return diaISO(new Date());
}

// 0 = domingo ... 6 = sábado, para uma data no calendário ("YYYY-MM-DD").
export function diaSemanaDe(dia: string): number {
  const [a, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

export function somarDias(dia: string, n: number): string {
  const [a, m, d] = dia.split("-").map(Number);
  const base = new Date(Date.UTC(a, m - 1, d) + n * 86400000);
  return base.toISOString().slice(0, 10);
}

// Diferença em dias entre duas datas do calendário (b - a).
export function diffDias(a: string, b: string): number {
  const [a1, m1, d1] = a.split("-").map(Number);
  const [a2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000);
}

// ===== Horas em minutos =====

export function hhmmParaMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function minParaHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ===== Formatação para exibir =====

export function fmtHora(d: Date | string): string {
  return new Date(d).toLocaleTimeString("pt-BR", {
    timeZone: TZ_BRASIL,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtData(d: Date | string): string {
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: TZ_BRASIL });
}

export function fmtDataHora(d: Date | string): string {
  return new Date(d).toLocaleString("pt-BR", {
    timeZone: TZ_BRASIL,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// "Segunda-feira, 03 de agosto"
export function fmtDiaLongo(dia: string): string {
  const d = dataHoraBrasil(dia, "12:00");
  const texto = d.toLocaleDateString("pt-BR", {
    timeZone: TZ_BRASIL,
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// "03/08" para os botões do calendário.
export function fmtDiaCurto(dia: string): string {
  const [, m, d] = dia.split("-");
  return `${d}/${m}`;
}

// Rótulo amigável: "Hoje", "Amanhã" ou o dia da semana.
export function rotuloDia(dia: string): string {
  const dif = diffDias(hojeISO(), dia);
  if (dif === 0) return "Hoje";
  if (dif === 1) return "Amanhã";
  return DIAS_SEMANA_CURTO[diaSemanaDe(dia)];
}

// Para preencher <input type="datetime-local"> com horário de Brasília.
export function paraInputLocal(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ_BRASIL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(d))
    .replace(" ", "T");
}

// Valor de <input type="datetime-local"> -> instante correto.
export function parseInputLocal(valor: string): Date | null {
  const base = (valor || "").trim().slice(0, 16);
  if (base.length < 16) return null;
  const d = new Date(`${base}:00${OFFSET_BRASIL}`);
  return isNaN(d.getTime()) ? null : d;
}
