import { requireAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createChampionship, createMatch, deleteMatch, updateMatchResult } from "@/lib/actions";

export default async function AdminJogosPage() {
  await requireAdminPage();

  const [teams, championships, matches] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.championship.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.match.findMany({
      orderBy: { date: "desc" },
      include: { homeTeam: true, awayTeam: true, championship: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-unifique-dark">Jogos e Campeonatos</h1>

      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-unifique-dark">Novo campeonato</h2>
        <form action={createChampionship} className="mt-3 flex flex-wrap gap-3">
          <input
            name="name"
            placeholder="Nome do campeonato"
            required
            className="flex-1 rounded border border-gray-300 px-3 py-2"
          />
          <input
            name="season"
            placeholder="Temporada (ex: 2026)"
            required
            className="w-40 rounded border border-gray-300 px-3 py-2"
          />
          <button
            type="submit"
            className="rounded bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark"
          >
            Criar
          </button>
        </form>
      </section>

      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-unifique-dark">Agendar jogo</h2>
        {teams.length < 2 ? (
          <p className="mt-2 text-sm text-gray-500">
            Cadastre pelo menos dois times antes de agendar um jogo.
          </p>
        ) : (
          <form action={createMatch} className="mt-3 grid gap-3 sm:grid-cols-2">
            <select name="homeTeamId" required className="rounded border border-gray-300 px-3 py-2">
              <option value="">Time da casa</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.modality})
                </option>
              ))}
            </select>
            <select name="awayTeamId" required className="rounded border border-gray-300 px-3 py-2">
              <option value="">Time visitante</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.modality})
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              name="date"
              required
              className="rounded border border-gray-300 px-3 py-2"
            />
            <input
              name="location"
              placeholder="Local (opcional)"
              className="rounded border border-gray-300 px-3 py-2"
            />
            <select name="championshipId" className="rounded border border-gray-300 px-3 py-2 sm:col-span-2">
              <option value="">Sem campeonato</option>
              {championships.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.season})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark sm:col-span-2"
            >
              Agendar
            </button>
          </form>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-unifique-dark">Jogos cadastrados</h2>
        {matches.map((match) => (
          <div key={match.id} className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {match.homeTeam.name} x {match.awayTeam.name}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(match.date).toLocaleString("pt-BR")}
                  {match.location ? ` · ${match.location}` : ""}
                  {match.championship ? ` · ${match.championship.name}` : ""}
                </p>
              </div>
              <form action={deleteMatch}>
                <input type="hidden" name="id" value={match.id} />
                <button type="submit" className="text-sm text-red-600 hover:underline">
                  Remover
                </button>
              </form>
            </div>
            <form action={updateMatchResult} className="mt-3 flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={match.id} />
              <input
                type="number"
                name="homeScore"
                defaultValue={match.homeScore ?? ""}
                placeholder="Placar casa"
                className="w-28 rounded border border-gray-300 px-2 py-1 text-sm"
              />
              <span>x</span>
              <input
                type="number"
                name="awayScore"
                defaultValue={match.awayScore ?? ""}
                placeholder="Placar visitante"
                className="w-28 rounded border border-gray-300 px-2 py-1 text-sm"
              />
              <button
                type="submit"
                className="rounded bg-unifique-light px-3 py-1 text-sm font-medium text-white hover:bg-unifique"
              >
                Salvar resultado
              </button>
            </form>
          </div>
        ))}
        {matches.length === 0 && <p className="text-gray-500">Nenhum jogo cadastrado.</p>}
      </section>
    </div>
  );
}
