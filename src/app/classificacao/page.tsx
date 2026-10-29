import { ListOrdered } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Stats = {
  teamId: string;
  teamName: string;
  modality: string;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  saldo: number;
  pontos: number;
};

export default async function ClassificacaoPage() {
  const [teams, matches] = await Promise.all([
    prisma.team.findMany(),
    prisma.match.findMany({
      where: { status: "finished", homeScore: { not: null }, awayScore: { not: null } },
    }),
  ]);

  const statsByTeam = new Map<string, Stats>();
  for (const team of teams) {
    statsByTeam.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      modality: team.modality,
      jogos: 0,
      vitorias: 0,
      empates: 0,
      derrotas: 0,
      saldo: 0,
      pontos: 0,
    });
  }

  for (const match of matches) {
    const home = statsByTeam.get(match.homeTeamId);
    const away = statsByTeam.get(match.awayTeamId);
    if (!home || !away || match.homeScore === null || match.awayScore === null) continue;

    home.jogos += 1;
    away.jogos += 1;
    home.saldo += match.homeScore - match.awayScore;
    away.saldo += match.awayScore - match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.vitorias += 1;
      home.pontos += 3;
      away.derrotas += 1;
    } else if (match.homeScore < match.awayScore) {
      away.vitorias += 1;
      away.pontos += 3;
      home.derrotas += 1;
    } else {
      home.empates += 1;
      away.empates += 1;
      home.pontos += 1;
      away.pontos += 1;
    }
  }

  const modalities = Array.from(new Set(teams.map((t) => t.modality))).sort();

  const MEDALHA = ["bg-amber-400 text-white", "bg-gray-300 text-gray-700", "bg-orange-300 text-white"];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="banner-vivo rounded-2xl bg-gradient-to-br from-unifique to-unifique-blue p-6 text-white shadow-md sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-white/15">
            <ListOrdered size={26} className="text-unifique-yellow" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">Classificação</h1>
            <p className="text-sm text-white/85">Vitória vale 3 pontos, empate 1 e derrota 0.</p>
          </div>
        </div>
      </section>

      {modalities.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white px-6 py-12 text-center dark:border-white/10 dark:bg-gray-900">
          <ListOrdered size={32} className="mx-auto text-gray-300" />
          <p className="mt-2 font-display font-semibold text-gray-700 dark:text-gray-200">A tabela ainda não começou</p>
          <p className="text-sm text-gray-500">Assim que a comissão cadastrar os times e os jogos, a classificação aparece aqui.</p>
        </div>
      )}

      <div className="em-sequencia space-y-4">
      {modalities.map((modality) => {
        const rows = Array.from(statsByTeam.values())
          .filter((s) => s.modality === modality)
          .sort((a, b) => b.pontos - a.pontos || b.saldo - a.saldo);

        return (
          <div key={modality} className="rounded-2xl bg-white p-4 shadow-sm sm:p-5 dark:bg-gray-900">
            <h2 className="mb-3 font-display text-lg font-bold text-unifique dark:text-white">{modality}</h2>
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400 dark:border-white/10">
                  <th className="py-2">Time</th>
                  <th className="w-8 text-center sm:w-12">J</th>
                  <th className="w-8 text-center sm:w-12">V</th>
                  <th className="w-8 text-center sm:w-12">E</th>
                  <th className="w-8 text-center sm:w-12">D</th>
                  <th className="w-8 text-center sm:w-12">SG</th>
                  <th className="w-8 text-center sm:w-12">Pts</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                {rows.map((row, i) => (
                  <tr key={row.teamId} className="border-b border-gray-100 last:border-0 dark:border-white/10">
                    <td className="py-2.5 font-medium text-gray-900 dark:text-white">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold ${
                            MEDALHA.at(i) ?? "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="truncate">{row.teamName}</span>
                      </span>
                    </td>
                    <td className="text-center">{row.jogos}</td>
                    <td className="text-center">{row.vitorias}</td>
                    <td className="text-center">{row.empates}</td>
                    <td className="text-center">{row.derrotas}</td>
                    <td className="text-center">{row.saldo > 0 ? `+${row.saldo}` : row.saldo}</td>
                    <td className="text-center font-display text-base font-bold text-unifique dark:text-unifique-blue">{row.pontos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
      </div>
    </div>
  );
}
