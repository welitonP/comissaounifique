import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { votePoll, suggestPollModality } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function EnquetesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const polls = await prisma.poll.findMany({
    orderBy: { createdAt: "desc" },
    include: { options: true },
  });

  const store = await cookies();
  const votedCookie = store.get("voted_polls")?.value ?? "";
  const votedPolls = new Set(votedCookie ? votedCookie.split(",").filter(Boolean) : []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-unifique-dark">Enquetes</h1>

      {params.erro === "ja-votou" && (
        <p className="rounded bg-yellow-100 px-4 py-2 text-sm text-yellow-800">
          Você já votou nessa enquete.
        </p>
      )}
      {params.sucesso === "voto-registrado" && (
        <p className="rounded bg-green-100 px-4 py-2 text-sm text-green-800">
          Voto registrado, obrigado por participar!
        </p>
      )}
      {params.sugestao === "ok" && (
        <p className="rounded bg-green-100 px-4 py-2 text-sm text-green-800">
          Modalidade sugerida! A comissão vai avaliar. Obrigado!
        </p>
      )}
      {params.sugestao === "curta" && (
        <p className="rounded bg-red-100 px-4 py-2 text-sm text-red-700">
          Escreva o nome da modalidade que você quer sugerir.
        </p>
      )}

      {polls.length === 0 && <p className="text-gray-500">Nenhuma enquete ativa no momento.</p>}

      <div className="space-y-4">
        {polls.map((poll) => {
          const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
          const alreadyVoted = votedPolls.has(poll.id);

          return (
            <div key={poll.id} className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-unifique-dark">{poll.question}</h2>

              <div className="mt-4 space-y-2">
                {poll.options.map((option) => {
                  const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                  return (
                    <div key={option.id}>
                      {alreadyVoted ? (
                        <div>
                          <div className="flex justify-between text-sm">
                            <span>{option.text}</span>
                            <span className="text-gray-500">
                              {option.votes} voto(s) · {pct}%
                            </span>
                          </div>
                          <div className="mt-1 h-2 w-full rounded bg-gray-100">
                            <div
                              className="h-2 rounded bg-unifique"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <form action={votePoll}>
                          <input type="hidden" name="pollId" value={poll.id} />
                          <input type="hidden" name="optionId" value={option.id} />
                          <button
                            type="submit"
                            className="w-full rounded border border-unifique px-3 py-2 text-left text-sm text-unifique-dark hover:bg-unifique/10"
                          >
                            {option.text}
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>

              {alreadyVoted && (
                <p className="mt-3 text-xs text-gray-400">Total de votos: {totalVotes}</p>
              )}

              {/* Campo para sugerir uma modalidade que não está nas opções */}
              <form
                action={suggestPollModality}
                className="mt-4 border-t border-gray-100 pt-3"
              >
                <input type="hidden" name="pollId" value={poll.id} />
                {/* honeypot anti-spam */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />
                <label className="block text-sm font-medium text-gray-600">
                  Quer uma modalidade que não está na lista? Sugira aqui:
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    name="text"
                    maxLength={80}
                    placeholder="Ex: Beach Tennis, Padel..."
                    className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-unifique focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded bg-unifique px-4 py-2 text-sm font-medium text-white hover:bg-unifique-dark"
                  >
                    Sugerir
                  </button>
                </div>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
