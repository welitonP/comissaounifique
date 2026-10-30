import Link from "next/link";
import type { JogoCompleto, Painel } from "@/lib/campeonato/dados";
import { vencedor } from "@/lib/campeonato/motor";
import { fmtHora, TZ_BRASIL } from "@/lib/datas";
import { Escudo } from "./ui";

const fmtDiaCurto = (d: Date) =>
  new Date(d).toLocaleDateString("pt-BR", { timeZone: TZ_BRASIL, day: "2-digit", month: "2-digit" });

// Uma linha de jogo compacta: horário | times empilhados | placar.
// `href` torna a linha clicável (ex: súmula na área da comissão).
export default function JogoLinha({
  jogo,
  painel,
  rotulo,
  href,
  destaqueTime,
}: {
  jogo: JogoCompleto;
  painel: Painel;
  rotulo?: string;
  href?: string;
  destaqueTime?: string;
}) {
  const venc = vencedor(jogo);
  const aoVivo = jogo.status === "ao_vivo";
  const encerrado = jogo.status === "encerrado";
  const temPlacar = jogo.homeScore != null && jogo.awayScore != null && jogo.status !== "agendado";
  const gols = jogo.events.filter((e) => e.kind === "gol");

  const linhaTime = (id: string | null, placar: number | null, pens: number | null) => {
    const t = id ? painel.times.get(id) : null;
    const ganhou = !!venc && id === venc;
    const perdeu = !!venc && !!id && id !== venc;
    return (
      <div className="flex items-center gap-2.5">
        <Escudo time={t} size={24} />
        <span
          className={`min-w-0 flex-1 line-clamp-2 break-words leading-tight text-[15px] ${
            ganhou
              ? "font-bold text-gray-900 dark:text-white"
              : perdeu
                ? "text-gray-400 dark:text-slate-500"
                : t
                  ? "font-medium text-gray-800 dark:text-slate-100"
                  : "italic text-gray-400"
          } ${destaqueTime && id === destaqueTime ? "underline decoration-unifique-blue decoration-2 underline-offset-4" : ""}`}
        >
          {t?.name ?? "A definir"}
        </span>
        {pens != null && <span className="font-placar text-sm font-semibold text-gray-400">({pens})</span>}
        <span
          className={`numeros w-7 text-right font-placar text-2xl font-bold leading-none ${
            !temPlacar
              ? "text-transparent"
              : aoVivo
                ? "text-red-500"
                : perdeu
                  ? "text-gray-400 dark:text-slate-500"
                  : "text-gray-900 dark:text-white"
          }`}
        >
          {temPlacar ? placar : "0"}
        </span>
      </div>
    );
  };

  const conteudo = (
    <div className="flex items-stretch gap-3 px-3 py-2.5">
      {/* coluna do horário/status */}
      <div className="flex w-14 flex-none flex-col items-center justify-center border-r border-gray-100 pr-3 text-center dark:border-slate-700">
        {aoVivo ? (
          <>
            <span className="ao-vivo-ponto h-2 w-2 rounded-full bg-red-500" />
            <span className="mt-1 font-placar text-xs font-bold uppercase tracking-wide text-red-500">Ao vivo</span>
          </>
        ) : encerrado ? (
          <>
            <span className="font-placar text-xs font-semibold uppercase text-gray-400">Fim</span>
            {jogo.date && <span className="text-[11px] text-gray-400">{fmtDiaCurto(jogo.date)}</span>}
          </>
        ) : jogo.date ? (
          <>
            <span className="font-placar text-lg font-bold leading-none text-unifique dark:text-unifique-teal">{fmtHora(jogo.date)}</span>
            <span className="text-[11px] text-gray-400">{fmtDiaCurto(jogo.date)}</span>
          </>
        ) : (
          <span className="text-[11px] font-medium text-gray-400">A marcar</span>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        {rotulo && (
          <p className="truncate text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {rotulo}
            {jogo.location && ` · ${jogo.location}`}
          </p>
        )}
        {linhaTime(jogo.homeId, jogo.homeScore, jogo.homePens)}
        {linhaTime(jogo.awayId, jogo.awayScore, jogo.awayPens)}
        {jogo.partials && <p className="numeros text-[11px] text-gray-400">{jogo.partials}</p>}
        {gols.length > 0 && (
          <p className="truncate text-[11px] text-gray-500">
            ⚽ {gols.map((g) => `${g.player}${g.minute != null ? ` ${g.minute}'` : ""}`).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );

  const base = `linha-jogo block transition ${aoVivo ? "bg-red-50/60 dark:bg-red-500/5" : ""}`;
  return href ? (
    <Link id={`j-${jogo.id}`} href={href} className={base}>
      {conteudo}
    </Link>
  ) : (
    <div id={`j-${jogo.id}`} className={base}>
      {conteudo}
    </div>
  );
}
