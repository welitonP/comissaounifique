import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createPoll,
  deletePoll,
  deletePollSuggestion,
  updatePollSuggestion,
} from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminEnquetesPage() {
  await requireUserPage();
  const polls = await prisma.poll.findMany({
    orderBy: { createdAt: "desc" },
    include: { options: true, suggestions: { orderBy: { createdAt: "desc" } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-unifique-dark">Enquetes</h1>

      <form action={createPoll} className="space-y-3 rounded-lg bg-white p-4 shadow-sm">
        <input
          name="question"
          placeholder="Pergunta da enquete"
          required
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        <textarea
          name="options"
          placeholder={"Opções, uma por linha\nEx:\nOpção A\nOpção B"}
          required
          rows={4}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark"
        >
          Criar enquete
        </button>
      </form>

      <div className="space-y-3">
        {polls.map((poll) => {
          const total = poll.options.reduce((sum, o) => sum + o.votes, 0);
          return (
            <div key={poll.id} className="rounded-lg bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold">{poll.question}</h2>
                <form action={deletePoll}>
                  <input type="hidden" name="id" value={poll.id} />
                  <button type="submit" className="text-sm text-red-600 hover:underline">
                    Remover
                  </button>
                </form>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                {poll.options.map((o) => (
                  <li key={o.id}>
                    {o.text} · {o.votes} voto(s)
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-gray-400">Total de votos: {total}</p>

              {poll.suggestions.length > 0 && (
                <div className="mt-3 rounded-lg bg-unifique-light/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-unifique">
                    Modalidades sugeridas pelos atletas ({poll.suggestions.length})
                  </p>
                  <ul className="mt-2 space-y-2">
                    {poll.suggestions.map((s) => (
                      <li key={s.id} className="flex items-center gap-2">
                        {/* editar o texto (corrige erro de digitação) */}
                        <form action={updatePollSuggestion} className="flex flex-1 items-center gap-2">
                          <input type="hidden" name="id" value={s.id} />
                          <input
                            name="text"
                            defaultValue={s.text}
                            maxLength={80}
                            className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                          />
                          <button
                            type="submit"
                            className="rounded bg-unifique px-2 py-1 text-xs font-medium text-white hover:bg-unifique-dark"
                          >
                            Salvar
                          </button>
                        </form>
                        <form action={deletePollSuggestion}>
                          <input type="hidden" name="id" value={s.id} />
                          <button type="submit" className="text-xs text-red-600 hover:underline">
                            remover
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
        {polls.length === 0 && <p className="text-gray-500">Nenhuma enquete criada.</p>}
      </div>
    </div>
  );
}
