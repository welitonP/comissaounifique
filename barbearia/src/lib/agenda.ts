// Motor da agenda: descobre quais horários estão livres.
//
// Regras aplicadas, nesta ordem:
//   1. o profissional precisa ter expediente naquele dia da semana;
//   2. o serviço tem que caber inteiro antes do fim do expediente;
//   3. não pode invadir o intervalo de almoço;
//   4. não pode encostar em outro agendamento ativo;
//   5. não pode cair em bloqueio (folga do barbeiro ou barbearia fechada);
//   6. tem que respeitar a antecedência mínima (não agendar "para daqui 5 min").

import { prisma } from "./prisma";
import {
  dataHoraBrasil,
  dataHoraBrasilMin,
  diaSemanaDe,
  hhmmParaMin,
  minParaHHMM,
  somarDias,
} from "./datas";

export type Intervalo = { inicio: Date; fim: Date };

type Expediente = {
  inicio: string;
  fim: string;
  pausaInicio: string | null;
  pausaFim: string | null;
};

type ContextoProfissional = {
  expedientes: Map<number, Expediente>;
  bloqueios: Intervalo[];
  ocupados: Intervalo[];
};

export type ContextoAgenda = {
  passoMin: number;
  antecedenciaMin: number;
  porProfissional: Map<string, ContextoProfissional>;
};

function conflita(inicio: Date, fim: Date, lista: Intervalo[]): boolean {
  return lista.some((i) => inicio < i.fim && fim > i.inicio);
}

// Carrega de uma vez tudo que é necessário para calcular os horários de vários
// profissionais em um intervalo de dias (evita uma consulta por dia).
export async function carregarAgenda(
  profissionalIds: string[],
  deISO: string,
  ateISO: string,
  opts: { passoMin: number; antecedenciaMin: number },
): Promise<ContextoAgenda> {
  const inicioRange = dataHoraBrasil(deISO, "00:00");
  const fimRange = dataHoraBrasil(somarDias(ateISO, 1), "00:00");

  const ctx: ContextoAgenda = {
    passoMin: opts.passoMin,
    antecedenciaMin: opts.antecedenciaMin,
    porProfissional: new Map(),
  };
  for (const id of profissionalIds) {
    ctx.porProfissional.set(id, {
      expedientes: new Map(),
      bloqueios: [],
      ocupados: [],
    });
  }
  if (profissionalIds.length === 0) return ctx;

  const [horarios, bloqueios, agendamentos] = await Promise.all([
    prisma.horarioTrabalho.findMany({
      where: { profissionalId: { in: profissionalIds } },
    }),
    prisma.bloqueio.findMany({
      where: {
        inicio: { lt: fimRange },
        fim: { gt: inicioRange },
        OR: [{ profissionalId: { in: profissionalIds } }, { profissionalId: null }],
      },
    }),
    prisma.agendamento.findMany({
      where: {
        profissionalId: { in: profissionalIds },
        status: { in: ["agendado", "concluido"] },
        inicio: { lt: fimRange },
        fim: { gt: inicioRange },
      },
      select: { profissionalId: true, inicio: true, fim: true },
    }),
  ]);

  for (const h of horarios) {
    ctx.porProfissional.get(h.profissionalId)?.expedientes.set(h.diaSemana, {
      inicio: h.inicio,
      fim: h.fim,
      pausaInicio: h.pausaInicio,
      pausaFim: h.pausaFim,
    });
  }
  for (const b of bloqueios) {
    const alvo: string[] = b.profissionalId ? [b.profissionalId] : profissionalIds;
    for (const id of alvo) {
      ctx.porProfissional.get(id)?.bloqueios.push({ inicio: b.inicio, fim: b.fim });
    }
  }
  for (const a of agendamentos) {
    ctx.porProfissional.get(a.profissionalId)?.ocupados.push({ inicio: a.inicio, fim: a.fim });
  }

  return ctx;
}

// Horários livres ("09:00", "09:15", ...) de um profissional em um dia.
export function horariosLivres(
  ctx: ContextoAgenda,
  profissionalId: string,
  dia: string,
  duracaoMin: number,
  opts: { agora?: Date; ignorarAntecedencia?: boolean } = {},
): string[] {
  const p = ctx.porProfissional.get(profissionalId);
  if (!p) return [];
  const exp = p.expedientes.get(diaSemanaDe(dia));
  if (!exp) return [];

  const agora = opts.agora ?? new Date();
  const minimo = opts.ignorarAntecedencia
    ? agora.getTime()
    : agora.getTime() + ctx.antecedenciaMin * 60000;

  const abre = hhmmParaMin(exp.inicio);
  const fecha = hhmmParaMin(exp.fim);
  const pausa =
    exp.pausaInicio && exp.pausaFim
      ? { de: hhmmParaMin(exp.pausaInicio), ate: hhmmParaMin(exp.pausaFim) }
      : null;

  const livres: string[] = [];
  for (let t = abre; t + duracaoMin <= fecha; t += ctx.passoMin) {
    if (pausa && t < pausa.ate && t + duracaoMin > pausa.de) continue;

    const inicio = dataHoraBrasilMin(dia, t);
    if (inicio.getTime() < minimo) continue;

    const fim = new Date(inicio.getTime() + duracaoMin * 60000);
    if (conflita(inicio, fim, p.ocupados)) continue;
    if (conflita(inicio, fim, p.bloqueios)) continue;

    livres.push(minParaHHMM(t));
  }
  return livres;
}

// Horários livres considerando vários profissionais ao mesmo tempo (opção
// "tanto faz quem atende"). Devolve, para cada horário, quem está disponível.
export function horariosLivresUnificados(
  ctx: ContextoAgenda,
  profissionalIds: string[],
  dia: string,
  duracaoMin: number,
  opts: { agora?: Date; ignorarAntecedencia?: boolean } = {},
): Map<string, string[]> {
  const mapa = new Map<string, string[]>();
  for (const id of profissionalIds) {
    for (const hora of horariosLivres(ctx, id, dia, duracaoMin, opts)) {
      const atual = mapa.get(hora);
      if (atual) atual.push(id);
      else mapa.set(hora, [id]);
    }
  }
  return new Map([...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}

// Quais dias do período têm pelo menos um horário livre (para o calendário
// marcar "lotado" sem o cliente precisar clicar dia a dia).
export function diasComVaga(
  ctx: ContextoAgenda,
  profissionalIds: string[],
  dias: string[],
  duracaoMin: number,
  opts: { agora?: Date } = {},
): Set<string> {
  const comVaga = new Set<string>();
  for (const dia of dias) {
    const tem = profissionalIds.some(
      (id) => horariosLivres(ctx, id, dia, duracaoMin, opts).length > 0,
    );
    if (tem) comVaga.add(dia);
  }
  return comVaga;
}

// Confere no banco, no instante de salvar, se o horário continua livre.
// Protege contra dois clientes fechando o mesmo horário ao mesmo tempo.
export async function continuaLivre(
  profissionalId: string,
  inicio: Date,
  fim: Date,
): Promise<boolean> {
  const [ocupado, bloqueado] = await Promise.all([
    prisma.agendamento.count({
      where: {
        profissionalId,
        status: { in: ["agendado", "concluido"] },
        inicio: { lt: fim },
        fim: { gt: inicio },
      },
    }),
    prisma.bloqueio.count({
      where: {
        OR: [{ profissionalId }, { profissionalId: null }],
        inicio: { lt: fim },
        fim: { gt: inicio },
      },
    }),
  ]);
  return ocupado === 0 && bloqueado === 0;
}

// Lista os próximos dias abertos para agendamento (a partir de hoje).
export function proximosDias(deISO: string, quantidade: number): string[] {
  return Array.from({ length: quantidade }, (_, i) => somarDias(deISO, i));
}
