import Link from "next/link";
import type { Linha } from "@/lib/campeonato/motor";
import type { TipoPlacar } from "@/lib/campeonato/esportes";
import { Escudo } from "./ui";

const COR_FORMA = { V: "bg-green-500", E: "bg-gray-400", D: "bg-red-500" } as const;

// Tabela de classificação (estilo ge.globo): barra colorida da zona,
// time clicável, colunas extras aparecem conforme a tela cresce.
export default function Tabela({
  linhas,
  titulo,
  classificam = 0,
  placar,
  hrefTime,
  compacta = false,
}: {
  linhas: Linha[];
  titulo?: string;
  classificam?: number;
  placar: TipoPlacar;
  hrefTime?: (id: string) => string;
  compacta?: boolean; // só P, J, V, saldo (telão / cards pequenos)
}) {
  const [pro, contra, saldo] =
    placar === "sets" ? ["SV", "SP", "SS"] : placar === "pontos" ? ["PP", "PC", "SP"] : ["GP", "GC", "SG"];
  const semEmpate = placar === "sets";
  const th = "py-2 text-center font-placar text-[13px] font-semibold uppercase tracking-wide text-gray-400";
  const extra = compacta ? "hidden" : "hidden sm:table-cell";
  const extraLg = compacta ? "hidden" : "hidden lg:table-cell";

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
      {titulo && (
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 dark:border-slate-700">
          <h3 className="font-placar text-lg font-bold uppercase tracking-wide text-unifique dark:text-unifique-teal">{titulo}</h3>
          {classificam > 0 && <span className="text-[11px] font-medium text-gray-400">{classificam} se classificam</span>}
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-700">
            <th className={`${th} w-9 pl-1`}></th>
            <th className={`${th} text-left`}>Equipe</th>
            <th className={`${th} w-10 !text-unifique dark:!text-unifique-teal`}>P</th>
            <th className={`${th} w-9`}>J</th>
            <th className={`${th} w-9`}>V</th>
            {!semEmpate && <th className={`${th} w-9 ${extra}`}>E</th>}
            <th className={`${th} w-9 ${extra}`}>D</th>
            <th className={`${th} w-10 ${extraLg}`}>{pro}</th>
            <th className={`${th} w-10 ${extraLg}`}>{contra}</th>
            <th className={`${th} w-10`}>{saldo}</th>
            <th className={`${th} w-12 ${extraLg}`}>%</th>
            <th className={`${th} w-28 pr-3 ${compacta ? "hidden" : "hidden md:table-cell"}`}>Últimos</th>
          </tr>
        </thead>
        <tbody className="linhas-entrando">
          {linhas.map((l) => {
            const zona = l.pos <= classificam;
            const nome = (
              <span className="flex min-w-0 items-center gap-2">
                <Escudo time={l.time} size={24} />
                <span className="truncate font-semibold text-gray-800 dark:text-slate-100">{l.time.name}</span>
              </span>
            );
            return (
              <tr key={l.time.id} className="group border-b border-gray-50 last:border-0 hover:bg-unifique-light/40 dark:border-slate-700/50 dark:hover:bg-slate-700/30">
                <td className="relative py-2.5 pl-1 text-center">
                  <span
                    className={`absolute inset-y-1 left-0 w-1 rounded-r ${
                      zona ? "bg-green-500" : l.pos === 1 && classificam === 0 ? "bg-unifique-yellow" : "bg-transparent"
                    }`}
                  />
                  <span className="numeros font-placar text-base font-bold text-gray-500 dark:text-slate-400">{l.pos}</span>
                </td>
                <td className="max-w-0 py-2.5 pr-2">
                  {hrefTime ? (
                    <Link href={hrefTime(l.time.id)} scroll={false} className="block hover:underline">
                      {nome}
                    </Link>
                  ) : (
                    nome
                  )}
                </td>
                <td className="numeros py-2.5 text-center font-placar text-lg font-bold text-unifique dark:text-unifique-teal">{l.pts}</td>
                <td className="numeros py-2.5 text-center text-gray-600 dark:text-slate-300">{l.j}</td>
                <td className="numeros py-2.5 text-center text-gray-600 dark:text-slate-300">{l.v}</td>
                {!semEmpate && <td className={`numeros py-2.5 text-center text-gray-600 dark:text-slate-300 ${extra}`}>{l.e}</td>}
                <td className={`numeros py-2.5 text-center text-gray-600 dark:text-slate-300 ${extra}`}>{l.d}</td>
                <td className={`numeros py-2.5 text-center text-gray-500 ${extraLg}`}>{l.gp}</td>
                <td className={`numeros py-2.5 text-center text-gray-500 ${extraLg}`}>{l.gc}</td>
                <td
                  className={`numeros py-2.5 text-center font-semibold ${
                    l.sg > 0 ? "text-green-600" : l.sg < 0 ? "text-red-500" : "text-gray-500"
                  }`}
                >
                  {l.sg > 0 ? `+${l.sg}` : l.sg}
                </td>
                <td className={`numeros py-2.5 text-center text-gray-500 ${extraLg}`}>{l.aproveitamento}</td>
                <td className={`py-2.5 pr-3 ${compacta ? "hidden" : "hidden md:table-cell"}`}>
                  <span className="flex justify-center gap-1">
                    {l.forma.length === 0 && <span className="text-xs text-gray-300">–</span>}
                    {l.forma.map((f, i) => (
                      <span
                        key={i}
                        title={f === "V" ? "Vitória" : f === "E" ? "Empate" : "Derrota"}
                        className={`h-2.5 w-2.5 rounded-full ${COR_FORMA[f]}`}
                      />
                    ))}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {classificam > 0 && !compacta && (
        <p className="flex items-center gap-2 border-t border-gray-100 px-4 py-2 text-[11px] text-gray-500 dark:border-slate-700">
          <span className="h-2.5 w-1 rounded bg-green-500" /> Classificados para o mata-mata
        </p>
      )}
    </div>
  );
}
