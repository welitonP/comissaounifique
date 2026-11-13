import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createChampionship, createMatch, deleteMatch, updateMatchResult } from "@/lib/actions";
import AdminTopo from "@/components/admin/AdminTopo";
import BotaoApagar from "@/components/admin/BotaoApagar";
import Campo from "@/components/admin/Campo";

export default async function AdminJogosPage() {
  await requireUserPage();

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
      <AdminTopo titulo="Jogos e Campeonatos" />

      <section className="cartao">
        <h2 className="cartao-titulo">Novo campeonato</h2>
        <form action={createChampionship} className="mt-3 flex flex-wrap gap-3">
          <Campo rotulo="Nome do campeonato" className="flex-1">
            <input
              name="name"
              required
              className="campo"
            />
          </Campo>
          <Campo rotulo="Temporada" className="w-40">
            <input
              name="season"
              placeholder="Ex: 2026"
              required
              className="campo"
            />
          </Campo>
          <button
            type="submit"
            className="btn-primario"
          >
            Criar
          </button>
        </form>
      </section>

      <section className="cartao">
        <h2 className="cartao-titulo">Agendar jogo</h2>
        {teams.length < 2 ? (
          <p className="mt-2 text-sm text-gray-500">
            Cadastre pelo menos dois times antes de agendar um jogo.
          </p>
        ) : (
          <form action={createMatch} className="mt-3 grid gap-3 sm:grid-cols-2">
            <Campo rotulo="Time da casa">
              <select name="homeTeamId" required className="campo">
                <option value="">Time da casa</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.modality})
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Time visitante">
              <select name="awayTeamId" required className="campo">
                <option value="">Time visitante</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.modality})
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Data e hora">
              <input
                type="datetime-local"
                name="date"
                required
                className="campo"
              />
            </Campo>
            <Campo rotulo="Local" opcional>
              <input
                name="location"
                className="campo"
              />
            </Campo>
            <Campo rotulo="Campeonato" className="sm:col-span-2">
              <select name="championshipId" className="campo">
                <option value="">Sem campeonato</option>
                {championships.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.season})
                  </option>
                ))}
              </select>
            </Campo>
            <button
              type="submit"
              className="btn-primario sm:col-span-2"
            >
              Agendar
            </button>
          </form>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="cartao-titulo">Jogos cadastrados</h2>
        {matches.map((match) => (
          <div key={match.id} className="cartao">
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
                <BotaoApagar mensagem="Remover este jogo? Não dá para desfazer.">Remover</BotaoApagar>
              </form>
            </div>
            <form action={updateMatchResult} className="mt-3 flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={match.id} />
              <input aria-label="Placar casa"
                type="number"
                name="homeScore"
                defaultValue={match.homeScore ?? ""}
                placeholder="Placar casa"
                className="campo-mini w-28"
              />
              <span>x</span>
              <input aria-label="Placar visitante"
                type="number"
                name="awayScore"
                defaultValue={match.awayScore ?? ""}
                placeholder="Placar visitante"
                className="campo-mini w-28"
              />
              <button
                type="submit"
                className="btn-azul"
              >
                Salvar resultado
              </button>
            </form>
          </div>
        ))}
        {matches.length === 0 && <p className="vazio">Nenhum jogo cadastrado.</p>}
      </section>
    </div>
  );
}
