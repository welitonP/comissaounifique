import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createTournament,
  toggleTournament,
  deleteTournament,
  deleteTournamentSignup,
} from "@/lib/actions";
import { fmtDataHora } from "@/lib/datas";
import ConfirmButton from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

export default async function AdminTorneiosPage() {
  await requireUserPage();
  const torneios = await prisma.tournament.findMany({
    orderBy: [{ open: "desc" }, { createdAt: "desc" }],
    include: { signups: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-unifique">Torneios internos</h1>
        <p className="text-sm text-gray-500">
          Crie um torneio (truco, CS, etc.) e a galera se inscreve pela página pública.
        </p>
      </div>

      {/* Criar torneio */}
      <form action={createTournament} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-unifique">Novo torneio</h2>
        <input
          name="title"
          placeholder="Título (ex: Torneio de Truco)"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <textarea
          name="description"
          placeholder="Detalhes: formato, premiação, regras... (opcional)"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-500">Data e hora (opcional)</label>
            <input
              type="datetime-local"
              name="date"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Local (opcional)</label>
            <input
              name="location"
              placeholder="Ex: Sede da comissão"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark"
        >
          Criar torneio
        </button>
      </form>

      {/* Lista de torneios */}
      <div className="space-y-4">
        {torneios.map((t) => (
          <div key={t.id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-unifique">
                  {t.title}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      t.open ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {t.open ? "aberto" : "encerrado"}
                  </span>
                </h2>
                <p className="text-xs text-gray-500">
                  {[t.date ? fmtDataHora(t.date) : null, t.location].filter(Boolean).join(" · ") ||
                    "sem data/local"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <form action={toggleTournament}>
                  <input type="hidden" name="id" value={t.id} />
                  <button
                    type="submit"
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white ${
                      t.open ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {t.open ? "Encerrar inscrições" : "Reabrir inscrições"}
                  </button>
                </form>
                <form action={deleteTournament}>
                  <input type="hidden" name="id" value={t.id} />
                  <ConfirmButton
                    message={`Excluir o torneio "${t.title}" e todas as inscrições? Não dá pra desfazer.`}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Excluir
                  </ConfirmButton>
                </form>
              </div>
            </div>

            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="mb-2 text-sm font-medium text-unifique">
                Inscritos ({t.signups.length})
              </p>
              {t.signups.length === 0 ? (
                <p className="text-sm text-gray-400">Ninguém inscrito ainda.</p>
              ) : (
                <ul className="space-y-1">
                  {t.signups.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm"
                    >
                      <span>
                        <span className="font-medium">{s.name}</span>
                        <span className="text-gray-500"> · {s.phone}</span>
                        {s.note && <span className="text-gray-400"> · {s.note}</span>}
                      </span>
                      <form action={deleteTournamentSignup}>
                        <input type="hidden" name="id" value={s.id} />
                        <button type="submit" className="text-xs text-red-600 hover:underline">
                          remover
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
        {torneios.length === 0 && <p className="text-gray-500">Nenhum torneio criado ainda.</p>}
      </div>
    </div>
  );
}
