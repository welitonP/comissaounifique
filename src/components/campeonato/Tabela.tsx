import type { Linha } from "@/lib/campeonato/motor";
import type { TipoPlacar } from "@/lib/campeonato/esportes";
import { Escudo } from "./ui";

const COR_FORMA = { V: "bg-green-500", E: "bg-gray-400", D: "bg-red-500" } as const;

// Tabela de classificação. `classificam` pinta a zona de quem avança.
export default function Tabela({
  linhas,
  titulo,
  classificam = 0,
  placar,
}: {
  linhas: Linha[];
  titulo?: string;
  classificam?: number;
  placar: TipoPlacar;
}) {
  const [pro, contra, saldo] =
    placar === "sets" ? ["SV", "SP", "SS"] : placar === "pontos" ? ["PP", "PC", "SP"] : ["GP", "GC", "SG"];

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
      {titulo && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-unifique to-unifique-blue px-4 py-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 font-display text-sm font-extrabold text-white">
            {titulo.replace("Grupo ", "")}
          </span>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">{titulo}</h3>
        </div>
      )}
      <div className="rolagem-suave overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:border-slate-700">
              <th className="w-10 py-2 pl-3 text-left">#</th>
              <th className="py-2 text-left">Equipe</th>
              <th className="w-10 py-2 text-center text-unifique dark:text-unifique-teal">P</th>
              <th className="w-8 py-2 text-center">J</th>
              <th className="w-8 py-2 text-center">V</th>
              {placar !== "sets" && <th className="hidden w-8 py-2 text-center sm:table-cell">E</th>}
              <th className="hidden w-8 py-2 text-center sm:table-cell">D</th>
              <th className="hidden w-10 py-2 text-center sm:table-cell">{pro}</th>
              <th className="hidden w-10 py-2 text-center sm:table-cell">{contra}</th>
              <th className="w-10 py-2 text-center">{saldo}</th>
              <th className="hidden w-28 py-2 pr-3 text-center md:table-cell">Últimos</th>
            </tr>
          </thead>
          <tbody className="linhas-entrando">
            {linhas.map((l) => {
              const zona = l.pos <= classificam;
              return (
                <tr
                  key={l.time.id}
                  className={`border-b border-gray-50 last:border-0 dark:border-slate-700/60 ${
                    zona ? "bg-green-50/70 dark:bg-green-500/10" : ""
                  }`}
                >
                  <td className="py-2.5 pl-3">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${
                        zona
                          ? "bg-green-500 text-white"
                          : l.pos === 1
                            ? "bg-unifique-yellow text-unifique-dark"
                            : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {l.pos}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className="flex min-w-0 max-w-[150px] items-center gap-2 sm:max-w-none">
                      <Escudo time={l.time} size={26} />
                      <span className="truncate font-semibold text-gray-800 dark:text-slate-100">{l.time.name}</span>
                    </span>
                  </td>
                  <td className="py-2.5 text-center font-display text-base font-extrabold text-unifique dark:text-unifique-teal">
                    {l.pts}
                  </td>
                  <td className="py-2.5 text-center text-gray-600 dark:text-slate-300">{l.j}</td>
                  <td className="py-2.5 text-center text-gray-600 dark:text-slate-300">{l.v}</td>
                  {placar !== "sets" && <td className="hidden py-2.5 text-center text-gray-600 dark:text-slate-300 sm:table-cell">{l.e}</td>}
                  <td className="hidden py-2.5 text-center text-gray-600 dark:text-slate-300 sm:table-cell">{l.d}</td>
                  <td className="hidden py-2.5 text-center text-gray-500 sm:table-cell">{l.gp}</td>
                  <td className="hidden py-2.5 text-center text-gray-500 sm:table-cell">{l.gc}</td>
                  <td
                    className={`py-2.5 text-center font-semibold ${
                      l.sg > 0 ? "text-green-600" : l.sg < 0 ? "text-red-500" : "text-gray-500"
                    }`}
                  >
                    {l.sg > 0 ? `+${l.sg}` : l.sg}
                  </td>
                  <td className="hidden py-2.5 pr-3 md:table-cell">
                    <span className="flex justify-center gap-1">
                      {l.forma.length === 0 && <span className="text-xs text-gray-300">—</span>}
                      {l.forma.map((f, i) => (
                        <span
                          key={i}
                          title={f === "V" ? "Vitória" : f === "E" ? "Empate" : "Derrota"}
                          className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white ${COR_FORMA[f]}`}
                        >
                          {f}
                        </span>
                      ))}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {classificam > 0 && (
        <p className="flex items-center gap-2 border-t border-gray-100 px-4 py-2 text-[11px] text-gray-500 dark:border-slate-700">
          <span className="h-2.5 w-2.5 rounded-sm bg-green-500" /> Zona de classificação
        </p>
      )}
    </div>
  );
}
