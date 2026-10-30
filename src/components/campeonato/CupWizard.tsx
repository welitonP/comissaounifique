"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Shuffle, Sparkles } from "lucide-react";
import { ESPORTES, FORMATOS, type Formato } from "@/lib/campeonato/esportes";
import { createCup } from "@/lib/campeonato-actions";
import SubmitButton from "@/components/form/SubmitButton";

const ETAPAS = ["Esporte", "Formato", "Equipes"];

function IlustraFormato({ f }: { f: Formato }) {
  const cor = "currentColor";
  if (f === "liga") {
    return (
      <svg viewBox="0 0 80 50" className="h-14 w-24" fill="none" stroke={cor} strokeWidth="2.5" strokeLinecap="round">
        {[8, 18, 28, 38].map((y, i) => (
          <g key={y} opacity={1 - i * 0.18}>
            <rect x="6" y={y - 4} width="8" height="8" rx="2" fill={cor} stroke="none" />
            <path d={`M20 ${y} H${66 - i * 8}`} />
          </g>
        ))}
      </svg>
    );
  }
  if (f === "mata") {
    return (
      <svg viewBox="0 0 80 50" className="h-14 w-24" fill="none" stroke={cor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6 H18 V16 H4 M4 34 H18 V44 H4" />
        <path d="M18 11 H26 V39 H18 M26 25 H40" />
        <path d="M76 6 H62 V16 H76 M76 34 H62 V44 H76" />
        <path d="M62 11 H54 V39 H62 M54 25 H40" />
        <circle cx="40" cy="25" r="5" fill={cor} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 50" className="h-14 w-24" fill="none" stroke={cor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="22" height="18" rx="3" />
      <rect x="3" y="28" width="22" height="18" rx="3" />
      <path d="M8 10 H20 M8 16 H17 M8 34 H20 M8 40 H17" opacity=".6" />
      <path d="M25 13 H38 V37 H25 M38 25 H52" />
      <path d="M52 15 H66 V35 H52" />
      <circle cx="72" cy="25" r="5" fill={cor} />
    </svg>
  );
}

// Quantos jogos o formato vai gerar (mostrado antes de criar).
function resumo(f: Formato, n: number, grupos: number, classificam: number, idaVolta: boolean, terceiro: boolean) {
  const rr = (k: number) => (k * (k - 1)) / 2;
  if (n < 2) return { jogos: 0, texto: "Adicione pelo menos 2 equipes." };
  if (f === "liga") {
    const j = rr(n) * (idaVolta ? 2 : 1);
    return { jogos: j, texto: `${n} equipes, todos contra todos${idaVolta ? " em ida e volta" : ""}.` };
  }
  if (f === "mata") {
    const j = n - 1 + (terceiro && n >= 4 ? 1 : 0);
    let tam = 2;
    while (tam < n) tam *= 2;
    const folgas = tam - n;
    return { jogos: j, texto: `Chave de ${tam}${folgas ? ` (${folgas} passa${folgas > 1 ? "m" : ""} direto na 1ª fase)` : ""}.` };
  }
  const g = Math.max(1, Math.min(grupos, Math.floor(n / 2)));
  const base = Math.floor(n / g);
  const extra = n % g;
  let jg = 0;
  for (let i = 0; i < g; i++) jg += rr(base + (i < extra ? 1 : 0));
  jg *= idaVolta ? 2 : 1;
  const cls = Math.min(g * classificam, n);
  const j = jg + Math.max(cls - 1, 0) + (terceiro && cls >= 4 ? 1 : 0);
  return {
    jogos: j,
    texto: `${g} grupo${g > 1 ? "s" : ""} de ${base}${extra ? `–${base + 1}` : ""} · ${cls} classificados para o mata-mata.`,
  };
}

export default function CupWizard({ erro }: { erro?: string }) {
  const [etapa, setEtapa] = useState(0);
  const [dir, setDir] = useState<"d" | "e">("d");
  const [sport, setSport] = useState("futsal");
  const [format, setFormat] = useState<Formato>("grupos");
  const [grupos, setGrupos] = useState(2);
  const [classificam, setClassificam] = useState(2);
  const [idaVolta, setIdaVolta] = useState(false);
  const [terceiro, setTerceiro] = useState(true);
  const [times, setTimes] = useState("");
  const esp = ESPORTES.find((e) => e.id === sport)!;
  const [pontos, setPontos] = useState(esp.pontos);
  const [sets, setSets] = useState(esp.setsParaVencer ?? 2);

  const listaTimes = useMemo(
    () => [...new Set(times.split("\n").map((l) => l.trim()).filter(Boolean))],
    [times],
  );
  const r = resumo(format, listaTimes.length, grupos, classificam, idaVolta, terceiro);

  const ir = (n: number) => {
    setDir(n > etapa ? "d" : "e");
    setEtapa(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const categorias = [...new Set(ESPORTES.map((e) => e.categoria))];

  return (
    <form
      action={createCup}
      className="space-y-6"
      onKeyDown={(e) => {
        // Enter nas etapas iniciais avança em vez de enviar o formulário.
        if (e.key === "Enter" && etapa < 2 && (e.target as HTMLElement).tagName === "INPUT") {
          e.preventDefault();
          ir(etapa + 1);
        }
      }}
    >
      {/* Passos */}
      <ol className="flex items-center gap-2">
        {ETAPAS.map((nome, i) => (
          <li key={nome} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => i < etapa && ir(i)}
              className={`flex h-9 w-9 flex-none items-center justify-center rounded-full font-display text-sm font-bold transition-all ${
                i < etapa
                  ? "bg-unifique-green text-unifique-dark"
                  : i === etapa
                    ? "scale-110 bg-unifique text-white shadow-lg shadow-unifique/30"
                    : "bg-gray-200 text-gray-500 dark:bg-slate-700"
              }`}
            >
              {i < etapa ? <Check size={16} /> : i + 1}
            </button>
            <span className={`hidden text-sm font-semibold sm:inline ${i === etapa ? "text-unifique dark:text-unifique-teal" : "text-gray-400"}`}>
              {nome}
            </span>
            {i < ETAPAS.length - 1 && (
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
                <span className="block h-full bg-unifique-green transition-all duration-500" style={{ width: i < etapa ? "100%" : "0%" }} />
              </span>
            )}
          </li>
        ))}
      </ol>

      {erro === "nome" && (
        <p className="aviso-entrar rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">Dê um nome ao campeonato.</p>
      )}

      {/* Campos de todas as etapas ficam no formulário (só escondidos) */}
      <input type="hidden" name="sport" value={sport} />
      <input type="hidden" name="format" value={format} />

      {/* 1. Esporte */}
      <section hidden={etapa !== 0} className={etapa === 0 ? (dir === "d" ? "etapa-da-direita" : "etapa-da-esquerda") : ""}>
        <h2 className="font-display text-xl font-bold text-unifique dark:text-unifique-teal">Qual é o esporte?</h2>
        <p className="text-sm text-gray-500">O placar e a pontuação se ajustam sozinhos.</p>
        <div className="mt-4 space-y-5">
          {categorias.map((cat) => (
            <div key={cat}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">{cat}</h3>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                {ESPORTES.filter((e) => e.categoria === cat).map((e) => (
                  <label
                    key={e.id}
                    className={`esporte-card group relative cursor-pointer overflow-hidden rounded-2xl p-3 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg bg-gradient-to-br ${e.gradiente} ${
                      sport === e.id ? "ring-4 ring-unifique-yellow ring-offset-2 dark:ring-offset-slate-900" : "opacity-90 hover:opacity-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="_sport"
                      value={e.id}
                      checked={sport === e.id}
                      onChange={() => {
                        setSport(e.id);
                        setPontos(e.pontos);
                        setSets(e.setsParaVencer ?? 2);
                      }}
                      className="sr-only"
                    />
                    <span aria-hidden className="absolute -bottom-3 -right-2 text-6xl opacity-30 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110">
                      {e.emoji}
                    </span>
                    <span className="relative block text-2xl">{e.emoji}</span>
                    <span className="relative mt-1 block font-display text-sm font-bold leading-tight drop-shadow">{e.nome}</span>
                    <span className="relative block text-[10px] font-semibold uppercase tracking-wide text-white/80">
                      {e.rotuloPlacar}
                    </span>
                    {sport === e.id && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-unifique">
                        <Check size={13} strokeWidth={3} />
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Formato */}
      <section hidden={etapa !== 1} className={etapa === 1 ? (dir === "d" ? "etapa-da-direita" : "etapa-da-esquerda") : ""}>
        <h2 className="font-display text-xl font-bold text-unifique dark:text-unifique-teal">Como vai ser a disputa?</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {(Object.keys(FORMATOS) as Formato[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={`group rounded-2xl border-2 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                format === f
                  ? "border-unifique bg-unifique text-white shadow-lg shadow-unifique/25"
                  : "border-gray-200 bg-white text-unifique dark:border-slate-700 dark:bg-slate-800 dark:text-unifique-teal"
              }`}
            >
              <span className={`block transition-transform group-hover:scale-105 ${format === f ? "text-unifique-green" : ""}`}>
                <IlustraFormato f={f} />
              </span>
              <span className="mt-2 block font-display text-lg font-bold">{FORMATOS[f].nome}</span>
              <span className={`block text-sm ${format === f ? "text-white/85" : "text-gray-500"}`}>{FORMATOS[f].descricao}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800 sm:grid-cols-2">
          {format === "grupos" && (
            <>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">Quantos grupos?</span>
                <input
                  type="number"
                  name="groupsCount"
                  min={1}
                  max={16}
                  value={grupos}
                  onChange={(e) => setGrupos(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-900"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">Classificam por grupo</span>
                <input
                  type="number"
                  name="qualifiers"
                  min={1}
                  max={8}
                  value={classificam}
                  onChange={(e) => setClassificam(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-900"
                />
              </label>
            </>
          )}
          {format !== "mata" && (
            <label className="flex items-center gap-3 rounded-xl bg-unifique-light/60 p-3 dark:bg-slate-700/50">
              <input type="checkbox" name="doubleRound" checked={idaVolta} onChange={(e) => setIdaVolta(e.target.checked)} className="h-5 w-5 accent-unifique" />
              <span className="text-sm">
                <b>Turno e returno</b>
                <span className="block text-gray-500">Cada confronto acontece duas vezes.</span>
              </span>
            </label>
          )}
          {format !== "liga" && (
            <label className="flex items-center gap-3 rounded-xl bg-unifique-light/60 p-3 dark:bg-slate-700/50">
              <input type="checkbox" name="thirdPlace" checked={terceiro} onChange={(e) => setTerceiro(e.target.checked)} className="h-5 w-5 accent-unifique" />
              <span className="text-sm">
                <b>Disputa de 3º lugar</b>
                <span className="block text-gray-500">Os perdedores da semi jogam pelo bronze.</span>
              </span>
            </label>
          )}

          <details className="sm:col-span-2">
            <summary className="cursor-pointer text-sm font-semibold text-unifique-blue">Pontuação e regras ({esp.nome})</summary>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {([
                ["pointsWin", "Vitória", "v"],
                ["pointsDraw", "Empate", "e"],
                ["pointsLoss", "Derrota", "d"],
              ] as const).map(([name, rot, k]) => (
                <label key={name} className="block">
                  <span className="text-xs font-semibold text-gray-500">Pontos por {rot.toLowerCase()}</span>
                  <input
                    type="number"
                    name={name}
                    min={0}
                    max={9}
                    value={pontos[k]}
                    onChange={(e) => setPontos({ ...pontos, [k]: Number(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                  />
                </label>
              ))}
              {esp.placar === "sets" && (
                <label className="block">
                  <span className="text-xs font-semibold text-gray-500">Formato dos jogos</span>
                  <select
                    name="setsToWin"
                    value={sets}
                    onChange={(e) => setSets(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                  >
                    <option value={1}>Jogo único</option>
                    <option value={2}>Melhor de 3</option>
                    <option value={3}>Melhor de 5</option>
                  </select>
                </label>
              )}
            </div>
            {esp.pontuacaoVolei && (
              <p className="mt-2 text-xs text-gray-500">
                Regra do vôlei: vitória por 3×2 (ou 2×1) vale {Math.max(pontos.v - 1, 0)} ponto(s) e o perdedor leva {pontos.d + 1}.
              </p>
            )}
            {!esp.empate && <p className="mt-1 text-xs text-gray-500">Neste esporte não existe empate.</p>}
          </details>
        </div>
      </section>

      {/* 3. Equipes e detalhes */}
      <section hidden={etapa !== 2} className={etapa === 2 ? (dir === "d" ? "etapa-da-direita" : "etapa-da-esquerda") : ""}>
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">Nome do campeonato *</span>
              <input
                name="name"
                required
                maxLength={80}
                placeholder={`Ex: Copa Unifique de ${esp.nome} 2026`}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-lg font-semibold dark:border-slate-600 dark:bg-slate-900"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">Início</span>
                <input type="datetime-local" name="startDate" className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-900" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">Local</span>
                <input name="location" maxLength={120} placeholder="Ex: Ginásio da Unifique" className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-900" />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">Equipes (uma por linha)</span>
              <textarea
                name="teams"
                rows={9}
                value={times}
                onChange={(e) => setTimes(e.target.value)}
                placeholder={"TI Dev\nComercial\nSuporte N1\nFinanceiro\n..."}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 font-mono text-sm dark:border-slate-600 dark:bg-slate-900"
              />
              <span className="text-xs text-gray-500">Pode colar a lista inteira. Dá para adicionar e editar depois.</span>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">Descrição / regulamento rápido</span>
              <textarea name="description" rows={3} maxLength={2000} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900" />
            </label>
          </div>

          {/* Resumo ao vivo */}
          <aside className="h-fit space-y-3 rounded-2xl bg-gradient-to-br from-unifique to-unifique-blue p-5 text-white shadow-lg lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-wider text-unifique-teal">Resumo</p>
            <p className="font-display text-xl font-bold">
              {esp.emoji} {esp.nome}
            </p>
            <p className="text-sm text-white/85">{FORMATOS[format].nome}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/15 p-3 text-center">
                <p key={listaTimes.length} className="placar-pop font-display text-3xl font-extrabold">{listaTimes.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/75">equipes</p>
              </div>
              <div className="rounded-xl bg-white/15 p-3 text-center">
                <p key={r.jogos} className="placar-pop font-display text-3xl font-extrabold">{r.jogos}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/75">jogos</p>
              </div>
            </div>
            <p className="text-sm text-white/90">{r.texto}</p>
            <label className="flex items-start gap-2 rounded-xl bg-white/10 p-3 text-sm">
              <input type="checkbox" name="gerar" defaultChecked className="mt-0.5 h-4 w-4 accent-unifique-green" />
              <span>
                <b className="inline-flex items-center gap-1"><Shuffle size={14} /> Já sortear e gerar a tabela</b>
                <span className="block text-xs text-white/75">Desmarque se quiser definir cabeças de chave ou grupos antes.</span>
              </span>
            </label>
          </aside>
        </div>
      </section>

      {/* Navegação */}
      <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-slate-700">
        {etapa > 0 ? (
          <button type="button" onClick={() => ir(etapa - 1)} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800">
            <ArrowLeft size={18} /> Voltar
          </button>
        ) : (
          <span />
        )}
        {etapa < 2 ? (
          <button type="button" onClick={() => ir(etapa + 1)} className="btn-brilho inline-flex items-center gap-2 rounded-xl bg-unifique px-6 py-3 font-display font-semibold text-white shadow-lg transition hover:bg-unifique-dark">
            Continuar <ArrowRight size={18} />
          </button>
        ) : (
          <SubmitButton pendingText="Montando..." className="btn-brilho inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-unifique to-unifique-blue px-6 py-3 font-display font-semibold text-white shadow-lg">
            <Sparkles size={18} /> Criar campeonato
          </SubmitButton>
        )}
      </div>
    </form>
  );
}
