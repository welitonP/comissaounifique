import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createPoll,
  deletePoll,
  deletePollSuggestion,
  updatePollSuggestion,
} from "@/lib/actions";
import PollEditForm from "@/components/PollEditForm";
import ShareEnquete from "@/components/ShareEnquete";
import AdminTopo from "@/components/admin/AdminTopo";
import BotaoApagar from "@/components/admin/BotaoApagar";
import Campo from "@/components/admin/Campo";

export const dynamic = "force-dynamic";

export default async function AdminEnquetesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUserPage();
  const [params, polls] = await Promise.all([
    searchParams,
    prisma.poll.findMany({
      orderBy: { createdAt: "desc" },
      include: { options: { orderBy: { id: "asc" } }, suggestions: { orderBy: { createdAt: "desc" } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <AdminTopo titulo="Enquetes" />

      {params.enquete === "salva" && (
        <p className="aviso-ok">
          Enquete atualizada com sucesso.
        </p>
      )}

      <form action={createPoll} className="cartao space-y-3">
        <Campo rotulo="Pergunta da enquete">
          <input
            name="question"
            required
            className="campo"
          />
        </Campo>
        <Campo rotulo="Opções">
          <textarea
            name="options"
            placeholder={"Opções, uma por linha\nEx:\nOpção A\nOpção B"}
            required
            rows={4}
            className="campo"
          />
        </Campo>
        <button
          type="submit"
          className="btn-primario"
        >
          Criar enquete
        </button>
      </form>

      <div className="space-y-3">
        {polls.map((poll) => {
          const total = poll.options.reduce((sum, o) => sum + o.votes, 0);
          return (
            <div key={poll.id} className="cartao">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold">{poll.question}</h2>
                <form action={deletePoll}>
                  <input type="hidden" name="id" value={poll.id} />
                  <BotaoApagar mensagem="Remover esta enquete? Os votos e as sugestões dela são apagados.">Remover</BotaoApagar>
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

              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="mb-2 text-xs font-medium text-gray-500">Compartilhar esta enquete:</p>
                <ShareEnquete question={poll.question} pollId={poll.id} />
              </div>

              <PollEditForm poll={poll} />

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
                          <input aria-label="Texto"
                            name="text"
                            defaultValue={s.text}
                            maxLength={80}
                            className="campo-mini flex-1"
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
                          <BotaoApagar mensagem="Apagar esta sugestão de modalidade?">remover</BotaoApagar>
                        </form>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
        {polls.length === 0 && <p className="vazio">Nenhuma enquete criada.</p>}
      </div>
    </div>
  );
}
