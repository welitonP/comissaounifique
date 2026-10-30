// Catálogo de esportes dos campeonatos. Cada esporte define como o placar
// funciona e a pontuação padrão (a comissão pode ajustar ao criar).

export type TipoPlacar = "gols" | "sets" | "pontos";

export type Esporte = {
  id: string;
  nome: string;
  emoji: string;
  categoria: "Bola" | "Raquete" | "Mesa & cartas" | "E-sports" | "Outros";
  placar: TipoPlacar;
  empate: boolean; // empate é possível na fase de pontos?
  pontos: { v: number; e: number; d: number };
  setsParaVencer?: number; // esportes de set: 2 = melhor de 3, 3 = melhor de 5
  pontuacaoVolei?: boolean; // vitória apertada (3x2 / 2x1) vale 2 e o perdedor leva 1
  rotuloPlacar: string; // "Gols", "Sets", "Pontos"...
  rotuloLance: string | null; // "Gol", "Cesta"... (null = sem artilharia)
  cartoes: boolean;
  gradiente: string; // fundo do card/banner
  set?: RegraSet; // como um set termina (marcação ponto a ponto)
};

// Fim de set: chega no alvo com a vantagem pedida. "games" = tênis/beach
// (6 games com 2 de vantagem, ou 7-5 / 7-6). "decisivo" = alvo do último set.
export type RegraSet = { alvo: number; decisivo?: number; vantagem: 1 | 2; games?: boolean; nome: string };

export const ESPORTES: Esporte[] = [
  { id: "futebol", nome: "Futebol", emoji: "⚽", categoria: "Bola", placar: "gols", empate: true, pontos: { v: 3, e: 1, d: 0 }, rotuloPlacar: "Gols", rotuloLance: "Gol", cartoes: true, gradiente: "from-emerald-500 to-green-700" },
  { id: "futsal", nome: "Futsal", emoji: "🥅", categoria: "Bola", placar: "gols", empate: true, pontos: { v: 3, e: 1, d: 0 }, rotuloPlacar: "Gols", rotuloLance: "Gol", cartoes: true, gradiente: "from-sky-500 to-blue-700" },
  { id: "society", nome: "Society / Fut7", emoji: "👟", categoria: "Bola", placar: "gols", empate: true, pontos: { v: 3, e: 1, d: 0 }, rotuloPlacar: "Gols", rotuloLance: "Gol", cartoes: true, gradiente: "from-lime-500 to-emerald-700" },
  { id: "volei", nome: "Vôlei", emoji: "🏐", categoria: "Bola", placar: "sets", empate: false, pontos: { v: 3, e: 0, d: 0 }, setsParaVencer: 2, pontuacaoVolei: true, rotuloPlacar: "Sets", rotuloLance: null, cartoes: false, gradiente: "from-amber-400 to-orange-600", set: { alvo: 25, decisivo: 15, vantagem: 2, nome: "pontos" } },
  { id: "volei-praia", nome: "Vôlei de praia", emoji: "🏖️", categoria: "Bola", placar: "sets", empate: false, pontos: { v: 3, e: 0, d: 0 }, setsParaVencer: 2, pontuacaoVolei: true, rotuloPlacar: "Sets", rotuloLance: null, cartoes: false, gradiente: "from-yellow-400 to-amber-600", set: { alvo: 21, decisivo: 15, vantagem: 2, nome: "pontos" } },
  { id: "futevolei", nome: "Futevôlei", emoji: "🦶", categoria: "Bola", placar: "sets", empate: false, pontos: { v: 3, e: 0, d: 0 }, setsParaVencer: 2, pontuacaoVolei: true, rotuloPlacar: "Sets", rotuloLance: null, cartoes: false, gradiente: "from-orange-400 to-rose-600", set: { alvo: 18, decisivo: 15, vantagem: 2, nome: "pontos" } },
  { id: "basquete", nome: "Basquete", emoji: "🏀", categoria: "Bola", placar: "pontos", empate: false, pontos: { v: 2, e: 0, d: 1 }, rotuloPlacar: "Pontos", rotuloLance: "Cestinha", cartoes: false, gradiente: "from-orange-500 to-red-700" },
  { id: "handebol", nome: "Handebol", emoji: "🤾", categoria: "Bola", placar: "gols", empate: true, pontos: { v: 2, e: 1, d: 0 }, rotuloPlacar: "Gols", rotuloLance: "Gol", cartoes: true, gradiente: "from-indigo-500 to-violet-700" },
  { id: "beach-tennis", nome: "Beach tennis", emoji: "🎾", categoria: "Raquete", placar: "sets", empate: false, pontos: { v: 3, e: 0, d: 0 }, setsParaVencer: 2, rotuloPlacar: "Sets", rotuloLance: null, cartoes: false, gradiente: "from-cyan-400 to-teal-600", set: { alvo: 6, vantagem: 2, games: true, nome: "games" } },
  { id: "tenis", nome: "Tênis", emoji: "🎾", categoria: "Raquete", placar: "sets", empate: false, pontos: { v: 3, e: 0, d: 0 }, setsParaVencer: 2, rotuloPlacar: "Sets", rotuloLance: null, cartoes: false, gradiente: "from-lime-400 to-green-600", set: { alvo: 6, vantagem: 2, games: true, nome: "games" } },
  { id: "padel", nome: "Padel", emoji: "🏸", categoria: "Raquete", placar: "sets", empate: false, pontos: { v: 3, e: 0, d: 0 }, setsParaVencer: 2, rotuloPlacar: "Sets", rotuloLance: null, cartoes: false, gradiente: "from-teal-400 to-cyan-700", set: { alvo: 6, vantagem: 2, games: true, nome: "games" } },
  { id: "tenis-mesa", nome: "Tênis de mesa", emoji: "🏓", categoria: "Raquete", placar: "sets", empate: false, pontos: { v: 3, e: 0, d: 0 }, setsParaVencer: 3, rotuloPlacar: "Sets", rotuloLance: null, cartoes: false, gradiente: "from-rose-500 to-red-700", set: { alvo: 11, vantagem: 2, nome: "pontos" } },
  { id: "truco", nome: "Truco", emoji: "🃏", categoria: "Mesa & cartas", placar: "sets", empate: false, pontos: { v: 3, e: 0, d: 0 }, setsParaVencer: 2, rotuloPlacar: "Partidas", rotuloLance: null, cartoes: false, gradiente: "from-red-500 to-rose-800", set: { alvo: 12, vantagem: 1, nome: "tentos" } },
  { id: "sinuca", nome: "Sinuca", emoji: "🎱", categoria: "Mesa & cartas", placar: "sets", empate: false, pontos: { v: 3, e: 0, d: 0 }, setsParaVencer: 2, rotuloPlacar: "Partidas", rotuloLance: null, cartoes: false, gradiente: "from-green-600 to-emerald-900", set: { alvo: 1, vantagem: 1, nome: "bolas" } },
  { id: "xadrez", nome: "Xadrez", emoji: "♟️", categoria: "Mesa & cartas", placar: "pontos", empate: true, pontos: { v: 2, e: 1, d: 0 }, rotuloPlacar: "Pontos", rotuloLance: null, cartoes: false, gradiente: "from-slate-600 to-gray-900" },
  { id: "domino", nome: "Dominó", emoji: "🁫", categoria: "Mesa & cartas", placar: "pontos", empate: false, pontos: { v: 3, e: 0, d: 0 }, rotuloPlacar: "Pontos", rotuloLance: null, cartoes: false, gradiente: "from-stone-500 to-stone-800" },
  { id: "cs", nome: "Counter-Strike", emoji: "🎯", categoria: "E-sports", placar: "sets", empate: false, pontos: { v: 3, e: 0, d: 0 }, setsParaVencer: 2, rotuloPlacar: "Mapas", rotuloLance: null, cartoes: false, gradiente: "from-amber-500 to-zinc-800", set: { alvo: 13, vantagem: 1, nome: "rounds" } },
  { id: "ea-fc", nome: "EA FC / FIFA", emoji: "🎮", categoria: "E-sports", placar: "gols", empate: true, pontos: { v: 3, e: 1, d: 0 }, rotuloPlacar: "Gols", rotuloLance: "Gol", cartoes: false, gradiente: "from-fuchsia-500 to-indigo-800" },
  { id: "outro", nome: "Outro esporte", emoji: "🏅", categoria: "Outros", placar: "pontos", empate: true, pontos: { v: 3, e: 1, d: 0 }, rotuloPlacar: "Placar", rotuloLance: "Ponto", cartoes: false, gradiente: "from-unifique to-unifique-blue" },
];

export function esporte(id: string): Esporte {
  return ESPORTES.find((e) => e.id === id) ?? ESPORTES[ESPORTES.length - 1];
}

export const FORMATOS = {
  liga: { nome: "Pontos corridos", curto: "Liga", descricao: "Todos jogam contra todos. Quem somar mais pontos é campeão." },
  mata: { nome: "Mata-mata", curto: "Mata-mata", descricao: "Eliminatória direta: perdeu, está fora. Chave montada automaticamente." },
  grupos: { nome: "Grupos + mata-mata", curto: "Copa", descricao: "Fase de grupos e os melhores de cada grupo vão para a chave." },
} as const;

export type Formato = keyof typeof FORMATOS;

export const CORES_TIMES = [
  "#212492", "#00A2FF", "#3FCFD5", "#16a34a", "#C0F021", "#F5EC5A",
  "#f97316", "#dc2626", "#db2777", "#9333ea", "#0f172a", "#64748b",
];
