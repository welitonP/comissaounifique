// Horário de funcionamento da barbearia = união do expediente de todos os
// profissionais ativos. Se o Zé abre 09:00 e o Bruno fecha 20:00, a casa
// funciona das 09:00 às 20:00 naquele dia.

import { prisma } from "./prisma";
import { diaSemanaDe, hhmmParaMin, hojeISO, TZ_BRASIL } from "./datas";

export type FaixaDia = { diaSemana: number; inicio: string; fim: string } | null;

export async function horarioFuncionamento(): Promise<FaixaDia[]> {
  const horarios = await prisma.horarioTrabalho.findMany({
    where: { profissional: { ativo: true } },
    select: { diaSemana: true, inicio: true, fim: true },
  });

  const porDia: FaixaDia[] = Array.from({ length: 7 }, () => null);
  for (const h of horarios) {
    const atual = porDia[h.diaSemana];
    if (!atual) {
      porDia[h.diaSemana] = { diaSemana: h.diaSemana, inicio: h.inicio, fim: h.fim };
      continue;
    }
    if (hhmmParaMin(h.inicio) < hhmmParaMin(atual.inicio)) atual.inicio = h.inicio;
    if (hhmmParaMin(h.fim) > hhmmParaMin(atual.fim)) atual.fim = h.fim;
  }
  return porDia;
}

// Está aberto neste momento? (usado no selo "Aberto agora" da página inicial)
export function estaAberto(faixas: FaixaDia[], agora = new Date()): boolean {
  const hoje = faixas[diaSemanaDe(hojeISO())];
  if (!hoje) return false;
  const hhmm = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ_BRASIL,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(agora);
  const min = hhmmParaMin(hhmm);
  return min >= hhmmParaMin(hoje.inicio) && min < hhmmParaMin(hoje.fim);
}
