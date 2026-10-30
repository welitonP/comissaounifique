// "Motor" dos campeonatos: funções puras (sem banco) para montar tabela,
// chaveamento, classificação e descobrir quem avança no mata-mata.

export type TimeLite = {
  id: string;
  name: string;
  color: string;
  group: string | null;
  seeded?: boolean;
};

export type JogoLite = {
  id: string;
  stage: string; // grupo | mata | terceiro
  group: string | null;
  round: number;
  slot: number;
  homeId: string | null;
  awayId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homePens: number | null;
  awayPens: number | null;
  status: string; // agendado | ao_vivo | encerrado | folga
};

export type Regras = {
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  pontuacaoVolei?: boolean;
  setsToWin?: number;
};

export const LETRAS = "ABCDEFGHIJKLMNOP".split("");

// ===================== Tabela (todos contra todos) =====================

// Método do círculo: cada rodada, cada time joga no máximo uma vez.
// Com número ímpar de times, um folga por rodada.
export function rodizio(ids: string[], idaEVolta = false): [string, string][][] {
  const lista: (string | null)[] = [...ids];
  if (lista.length < 2) return [];
  if (lista.length % 2 === 1) lista.push(null);
  const n = lista.length;
  const rodadas: [string, string][][] = [];
  const arr = [...lista];
  for (let r = 0; r < n - 1; r++) {
    const jogos: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a && b) {
        // Alterna o mando para ninguém jogar sempre "em casa".
        jogos.push(r % 2 === 0 || i > 0 ? [a, b] : [b, a]);
      }
    }
    rodadas.push(jogos);
    // Gira todos menos o primeiro.
    arr.splice(1, 0, arr.pop() as string | null);
  }
  if (idaEVolta) {
    const volta = rodadas.map((r) => r.map(([a, b]) => [b, a] as [string, string]));
    return [...rodadas, ...volta];
  }
  return rodadas;
}

// ===================== Chaveamento =====================

export function proximaPotencia2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return Math.max(p, 2);
}

// Ordem clássica das posições na chave: o 1º e o 2º melhores só se
// encontram na final (8 times: 1x8, 4x5, 2x7, 3x6).
export function ordemChave(tamanho: number): number[] {
  let ordem = [1, 2];
  while (ordem.length < tamanho) {
    const total = ordem.length * 2 + 1;
    ordem = ordem.flatMap((s) => [s, total - s]);
  }
  return ordem;
}

export type JogoChave = { round: number; slot: number; homeId: string | null; awayId: string | null };

// Monta toda a chave a partir da lista de times em ordem de força (cabeças
// primeiro). Quem sobra sem adversário na 1ª fase passa direto (folga).
export function montarChave(semeados: string[]): JogoChave[] {
  const tamanho = proximaPotencia2(semeados.length);
  const ordem = ordemChave(tamanho);
  const jogos: JogoChave[] = [];
  for (let s = 0; s < tamanho / 2; s++) {
    const a = semeados[ordem[2 * s] - 1] ?? null;
    const b = semeados[ordem[2 * s + 1] - 1] ?? null;
    jogos.push({ round: 1, slot: s, homeId: a, awayId: b });
  }
  const fases = Math.log2(tamanho);
  for (let r = 2; r <= fases; r++) {
    const qtd = tamanho / 2 ** r;
    for (let s = 0; s < qtd; s++) jogos.push({ round: r, slot: s, homeId: null, awayId: null });
  }
  return jogos;
}

// Evita que dois times do mesmo grupo se enfrentem logo na 1ª fase do
// mata-mata, trocando adversários entre jogos quando der.
export function evitarMesmoGrupo(jogos: JogoChave[], grupoDe: (id: string) => string | null): JogoChave[] {
  const r1 = jogos.filter((j) => j.round === 1 && j.homeId && j.awayId);
  for (const j of r1) {
    const g = grupoDe(j.homeId!);
    if (!g || g !== grupoDe(j.awayId!)) continue;
    const troca = r1.find(
      (o) =>
        o !== j &&
        grupoDe(o.awayId!) !== g &&
        grupoDe(o.homeId!) !== grupoDe(j.awayId!),
    );
    if (troca) [j.awayId, troca.awayId] = [troca.awayId, j.awayId];
  }
  return jogos;
}

export function nomeFase(qtdJogosNaFase: number): string {
  if (qtdJogosNaFase === 1) return "Final";
  if (qtdJogosNaFase === 2) return "Semifinal";
  if (qtdJogosNaFase === 4) return "Quartas de final";
  if (qtdJogosNaFase === 8) return "Oitavas de final";
  return `${qtdJogosNaFase * 2} avos de final`;
}

// ===================== Resultado de um jogo =====================

export function vencedor(j: JogoLite): string | null {
  if (j.status === "folga") return j.homeId ?? j.awayId;
  if (j.status !== "encerrado" || !j.homeId || !j.awayId) return null;
  const h = j.homeScore ?? 0;
  const a = j.awayScore ?? 0;
  if (h !== a) return h > a ? j.homeId : j.awayId;
  if (j.homePens != null && j.awayPens != null && j.homePens !== j.awayPens) {
    return j.homePens > j.awayPens ? j.homeId : j.awayId;
  }
  return null;
}

export function perdedor(j: JogoLite): string | null {
  const v = vencedor(j);
  if (!v || j.status === "folga") return null;
  return v === j.homeId ? j.awayId : j.homeId;
}

// Pontos que um lado ganha num jogo de fase de pontos.
export function pontosNoJogo(j: JogoLite, lado: "home" | "away", regras: Regras): number {
  const meu = (lado === "home" ? j.homeScore : j.awayScore) ?? 0;
  const dele = (lado === "home" ? j.awayScore : j.homeScore) ?? 0;
  if (meu === dele) return regras.pointsDraw;
  const venceu = meu > dele;
  // Vôlei (FIVB): 3x2 ou 2x1 vale 2 pontos para quem vence e 1 para quem perde.
  if (regras.pontuacaoVolei && Math.abs(meu - dele) === 1 && Math.max(meu, dele) >= 2) {
    return venceu ? Math.max(regras.pointsWin - 1, 0) : regras.pointsLoss + 1;
  }
  return venceu ? regras.pointsWin : regras.pointsLoss;
}

// ===================== Classificação =====================

export type Linha = {
  time: TimeLite;
  pos: number;
  j: number;
  v: number;
  e: number;
  d: number;
  gp: number;
  gc: number;
  sg: number;
  pts: number;
  aproveitamento: number;
  forma: ("V" | "E" | "D")[]; // últimos 5, mais recente por último
};

export function classificacao(times: TimeLite[], jogos: JogoLite[], regras: Regras): Linha[] {
  const mapa = new Map<string, Linha>();
  for (const t of times) {
    mapa.set(t.id, { time: t, pos: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0, aproveitamento: 0, forma: [] });
  }
  const validos = jogos
    .filter((j) => j.status === "encerrado" && j.homeId && j.awayId && j.homeScore != null && j.awayScore != null)
    .sort((a, b) => a.round - b.round || a.slot - b.slot);

  for (const jg of validos) {
    for (const lado of ["home", "away"] as const) {
      const id = lado === "home" ? jg.homeId! : jg.awayId!;
      const l = mapa.get(id);
      if (!l) continue;
      const pro = lado === "home" ? jg.homeScore! : jg.awayScore!;
      const contra = lado === "home" ? jg.awayScore! : jg.homeScore!;
      l.j++;
      l.gp += pro;
      l.gc += contra;
      l.pts += pontosNoJogo(jg, lado, regras);
      const r = pro > contra ? "V" : pro < contra ? "D" : "E";
      if (r === "V") l.v++;
      else if (r === "D") l.d++;
      else l.e++;
      l.forma.push(r);
    }
  }

  const linhas = [...mapa.values()];
  for (const l of linhas) {
    l.sg = l.gp - l.gc;
    l.forma = l.forma.slice(-5);
    l.aproveitamento = l.j ? Math.round((l.pts / (l.j * Math.max(regras.pointsWin, 1))) * 100) : 0;
  }

  // Confronto direto entre dois times empatados em tudo.
  const confronto = (a: string, b: string): number => {
    let pa = 0;
    let pb = 0;
    for (const jg of validos) {
      if (jg.homeId === a && jg.awayId === b) {
        pa += pontosNoJogo(jg, "home", regras);
        pb += pontosNoJogo(jg, "away", regras);
      } else if (jg.homeId === b && jg.awayId === a) {
        pa += pontosNoJogo(jg, "away", regras);
        pb += pontosNoJogo(jg, "home", regras);
      }
    }
    return pb - pa;
  };

  linhas.sort(
    (a, b) =>
      b.pts - a.pts ||
      b.v - a.v ||
      b.sg - a.sg ||
      b.gp - a.gp ||
      confronto(a.time.id, b.time.id) ||
      a.time.name.localeCompare(b.time.name, "pt-BR"),
  );
  linhas.forEach((l, i) => (l.pos = i + 1));
  return linhas;
}

// ===================== Sorteio de grupos =====================

function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const k = Math.floor(Math.random() * (i + 1));
    [a[i], a[k]] = [a[k], a[i]];
  }
  return a;
}

// Distribui os times nos grupos: cabeças de chave primeiro (um por grupo),
// depois o resto sorteado, sempre completando o grupo com menos times.
export function sortearGrupos(times: TimeLite[], nGrupos: number): Map<string, string> {
  const letras = LETRAS.slice(0, Math.max(1, nGrupos));
  const contagem = new Map(letras.map((l) => [l, 0]));
  const resultado = new Map<string, string>();
  const cabecas = embaralhar(times.filter((t) => t.seeded));
  const resto = embaralhar(times.filter((t) => !t.seeded));
  let i = 0;
  for (const t of [...cabecas, ...resto]) {
    // Grupo com menos times; no empate, segue a ordem (A, B, C...) a partir do último usado.
    const min = Math.min(...contagem.values());
    let g = letras[i % letras.length];
    for (let k = 0; k < letras.length; k++) {
      const cand = letras[(i + k) % letras.length];
      if (contagem.get(cand) === min) {
        g = cand;
        i = i + k + 1;
        break;
      }
    }
    resultado.set(t.id, g);
    contagem.set(g, (contagem.get(g) ?? 0) + 1);
  }
  return resultado;
}

// Ordem de força para o mata-mata saindo dos grupos:
// 1ºA, 1ºB, 1ºC..., depois 2ºA, 2ºB... (com a ordem da chave, 1ºA pega o 2º de outro grupo).
export function semeadosDosGrupos(tabelas: Map<string, Linha[]>, classificados: number): string[] {
  const grupos = [...tabelas.keys()].sort();
  const seeds: string[] = [];
  for (let p = 0; p < classificados; p++) {
    for (const g of grupos) {
      const l = tabelas.get(g)?.[p];
      if (l) seeds.push(l.time.id);
    }
  }
  return seeds;
}

// ===================== Avanço no mata-mata =====================

export type AjusteJogo = {
  id: string;
  homeId: string | null;
  awayId: string | null;
  limpar: boolean; // os times mudaram: zera placar/status
  status?: string;
};

// Recalcula quem está em cada jogo do mata-mata a partir dos resultados
// anteriores. Devolve só os jogos que precisam mudar.
export function propagarChave(jogos: JogoLite[]): AjusteJogo[] {
  const mata = jogos.filter((j) => j.stage === "mata");
  if (mata.length === 0) return [];
  const atual = new Map(mata.map((j) => [`${j.round}:${j.slot}`, { ...j }]));
  const ajustes = new Map<string, AjusteJogo>();
  const maxRound = Math.max(...mata.map((j) => j.round));

  // 1ª fase: jogo com um lado vazio é folga.
  for (const j of mata.filter((x) => x.round === 1)) {
    const temUm = (j.homeId ? 1 : 0) + (j.awayId ? 1 : 0) === 1;
    if (temUm && j.status !== "folga") {
      ajustes.set(j.id, { id: j.id, homeId: j.homeId, awayId: j.awayId, limpar: true, status: "folga" });
      atual.get(`${j.round}:${j.slot}`)!.status = "folga";
    }
  }

  for (let r = 2; r <= maxRound; r++) {
    for (const j of mata.filter((x) => x.round === r)) {
      const a = atual.get(`${r - 1}:${j.slot * 2}`);
      const b = atual.get(`${r - 1}:${j.slot * 2 + 1}`);
      const homeId = a ? vencedor(a) : null;
      const awayId = b ? vencedor(b) : null;
      if (homeId !== j.homeId || awayId !== j.awayId) {
        ajustes.set(j.id, { id: j.id, homeId, awayId, limpar: true, status: "agendado" });
        const cur = atual.get(`${r}:${j.slot}`)!;
        cur.homeId = homeId;
        cur.awayId = awayId;
        cur.status = "agendado";
        cur.homeScore = cur.awayScore = cur.homePens = cur.awayPens = null;
      }
    }
  }

  // Disputa de 3º lugar: perdedores das semifinais.
  const terceiro = jogos.find((j) => j.stage === "terceiro");
  if (terceiro && maxRound >= 2) {
    const s0 = atual.get(`${maxRound - 1}:0`);
    const s1 = atual.get(`${maxRound - 1}:1`);
    const homeId = s0 ? perdedor(s0) : null;
    const awayId = s1 ? perdedor(s1) : null;
    if (homeId !== terceiro.homeId || awayId !== terceiro.awayId) {
      ajustes.set(terceiro.id, { id: terceiro.id, homeId, awayId, limpar: true, status: "agendado" });
    }
  }
  return [...ajustes.values()];
}

// ===================== Pódio =====================

export type Podio = { campeao: string | null; vice: string | null; terceiro: string | null };

export function podio(formato: string, jogos: JogoLite[], tabelaLiga?: Linha[]): Podio {
  if (formato === "liga") {
    const todosEncerrados = jogos.length > 0 && jogos.every((j) => j.status === "encerrado");
    if (!todosEncerrados || !tabelaLiga) return { campeao: null, vice: null, terceiro: null };
    return {
      campeao: tabelaLiga[0]?.time.id ?? null,
      vice: tabelaLiga[1]?.time.id ?? null,
      terceiro: tabelaLiga[2]?.time.id ?? null,
    };
  }
  const mata = jogos.filter((j) => j.stage === "mata");
  if (mata.length === 0) return { campeao: null, vice: null, terceiro: null };
  const maxRound = Math.max(...mata.map((j) => j.round));
  const final = mata.find((j) => j.round === maxRound);
  const t = jogos.find((j) => j.stage === "terceiro");
  return {
    campeao: final ? vencedor(final) : null,
    vice: final ? perdedor(final) : null,
    terceiro: t ? vencedor(t) : null,
  };
}

// Parciais de sets ("25-20, 23-25, 15-12") → sets vencidos por cada lado.
export function setsDasParciais(parciais: string): { home: number; away: number; validas: string } | null {
  const pares = parciais
    .split(/[,;/\n]+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.match(/^(\d{1,3})\s*[-x×:]\s*(\d{1,3})$/i))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => [Number(m[1]), Number(m[2])] as const);
  if (pares.length === 0) return null;
  let home = 0;
  let away = 0;
  for (const [h, a] of pares) {
    if (h > a) home++;
    else if (a > h) away++;
  }
  return { home, away, validas: pares.map(([h, a]) => `${h}-${a}`).join(", ") };
}

// ===================== Placar ponto a ponto =====================
// Parciais guardam os sets fechados e o set em andamento entre colchetes:
// "25-20, 18-25, [7-5]". O placar do jogo (homeScore/awayScore) é o número
// de sets vencidos.

export type RegraSetMotor = { alvo: number; decisivo?: number; vantagem: 1 | 2; games?: boolean };
export type EstadoPlacar = { homeScore: number | null; awayScore: number | null; partials: string | null; status: string };
type Par = [number, number];

export function lerParciais(p: string | null): { sets: Par[]; atual: Par | null } {
  const sets: Par[] = [];
  let atual: Par | null = null;
  for (const parte of (p ?? "").split(/[,;]+/)) {
    const t = parte.trim();
    const m = t.match(/^(\[)?\s*(\d{1,3})\s*[-x×:]\s*(\d{1,3})\s*(\])?$/i);
    if (!m) continue;
    const par: Par = [Number(m[2]), Number(m[3])];
    if (m[1]) atual = par;
    else sets.push(par);
  }
  return { sets, atual };
}

export function escreverParciais(sets: Par[], atual: Par | null): string | null {
  const partes = sets.map(([h, a]) => `${h}-${a}`);
  if (atual) partes.push(`[${atual[0]}-${atual[1]}]`);
  return partes.length ? partes.join(", ") : null;
}

// Texto para exibir: "25-20 · 18-25 · 7-5 (em jogo)"
export function formatarParciais(p: string | null): string {
  const { sets, atual } = lerParciais(p);
  const partes = sets.map(([h, a]) => `${h}-${a}`);
  if (atual && (atual[0] || atual[1] || sets.length)) partes.push(`${atual[0]}-${atual[1]} (em jogo)`);
  return partes.join(" · ");
}

function setTerminou([h, a]: Par, regra: RegraSetMotor, decisivo: boolean): boolean {
  const alvo = decisivo && regra.decisivo ? regra.decisivo : regra.alvo;
  const maior = Math.max(h, a);
  const dif = Math.abs(h - a);
  if (regra.games) return (maior >= alvo && dif >= 2) || maior >= alvo + 1;
  return maior >= alvo && dif >= regra.vantagem;
}

// Aplica um toque no placar. lado "fechar" fecha o set atual na mão.
export function aplicarPonto(
  est: EstadoPlacar,
  lado: "home" | "away" | "fechar",
  delta: number,
  tipo: "gols" | "pontos" | "sets",
  regra: RegraSetMotor | undefined,
  setsToWin: number,
): EstadoPlacar {
  if (tipo !== "sets" || !regra) {
    if (lado === "fechar") return est;
    const campo = lado === "home" ? "homeScore" : "awayScore";
    return {
      ...est,
      homeScore: est.homeScore ?? 0,
      awayScore: est.awayScore ?? 0,
      [campo]: Math.max(0, (est[campo] ?? 0) + delta),
      status: est.status === "agendado" ? "ao_vivo" : est.status,
    };
  }

  let { sets, atual } = lerParciais(est.partials);
  sets = [...sets];
  let status = est.status === "agendado" ? "ao_vivo" : est.status;
  const vencidos = () => [sets.filter(([h, a]) => h > a).length, sets.filter(([h, a]) => a > h).length] as const;

  if (lado === "fechar") {
    if (atual && atual[0] !== atual[1]) {
      sets.push(atual);
      atual = [0, 0];
    }
  } else if (delta > 0) {
    if (status === "encerrado") return est; // jogo já acabou: só o −1 mexe
    const cur: Par = atual ? [...atual] : [0, 0];
    cur[lado === "home" ? 0 : 1] += delta;
    const decisivo = sets.length === 2 * setsToWin - 2;
    if (setTerminou(cur, regra, decisivo)) {
      sets.push(cur);
      atual = [0, 0];
    } else {
      atual = cur;
    }
  } else {
    // −1: tira do set atual; se ele está zerado, reabre o último set fechado.
    const i = lado === "home" ? 0 : 1;
    let cur: Par | null = atual ? [...atual] : null;
    if ((!cur || (cur[0] === 0 && cur[1] === 0)) && sets.length) {
      cur = [...sets.pop()!];
    }
    if (cur && cur[i] > 0) cur[i] -= 1;
    atual = cur ?? [0, 0];
    if (status === "encerrado") status = "ao_vivo";
  }

  const [vh, va] = vencidos();
  if (vh >= setsToWin || va >= setsToWin) {
    status = "encerrado";
    atual = null;
  }
  return { homeScore: vh, awayScore: va, partials: escreverParciais(sets, atual), status };
}
