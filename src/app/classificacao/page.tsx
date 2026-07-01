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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-unifique-dark">Classificação</h1>
      <p className="text-sm text-gray-500">
        Critério: vitória = 3 pts, empate = 1 pt, derrota = 0 pt.
      </p>

      {modalities.length === 0 && <p className="text-gray-500">Nenhum time cadastrado ainda.</p>}

      {modalities.map((modality) => {
        const rows = Array.from(statsByTeam.values())
          .filter((s) => s.modality === modality)
          .sort((a, b) => b.pontos - a.pontos || b.saldo - a.saldo);

        return (
          <div key={modality} className="overflow-x-auto rounded-lg bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold text-unifique-dark">{modality}</h2>
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2">Time</th>
                  <th className="px-2 text-center">J</th>
                  <th className="px-2 text-center">V</th>
                  <th className="px-2 text-center">E</th>
                  <th className="px-2 text-center">D</th>
                  <th className="px-2 text-center">SG</th>
                  <th className="px-2 text-center">Pts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.teamId} className="border-b last:border-0">
                    <td className="py-2 font-medium">{row.teamName}</td>
                    <td className="px-2 text-center">{row.jogos}</td>
                    <td className="px-2 text-center">{row.vitorias}</td>
                    <td className="px-2 text-center">{row.empates}</td>
                    <td className="px-2 text-center">{row.derrotas}</td>
                    <td className="px-2 text-center">{row.saldo}</td>
                    <td className="px-2 text-center font-semibold">{row.pontos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
