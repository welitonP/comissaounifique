import { Crown, Vote } from "lucide-react";
import { votePoll, suggestPollModality } from "@/lib/actions";
import ShareEnquete from "@/components/ShareEnquete";
import CountUp from "@/components/CountUp";

export type PollCardData = {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
};

// Cartão de enquete: antes do voto mostra as opções como botões; depois,
// o resultado em barras que crescem com animação, com a opção líder em destaque.
// `from` = para onde volta a sugestão de modalidade ("/" na home).
export default function PollCard({
  poll,
  jaVotou,
  from,
  compartilhar = true,
}: {
  poll: PollCardData;
  jaVotou: boolean;
  from: string;
  compartilhar?: boolean;
}) {
  const total = poll.options.reduce((s, o) => s + o.votes, 0);
  const maior = Math.max(0, ...poll.options.map((o) => o.votes));
  // No resultado, as mais votadas primeiro.
  const opcoes = jaVotou ? [...poll.options].sort((a, b) => b.votes - a.votes) : poll.options;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">
      <h3 className="font-display text-lg font-bold leading-snug text-unifique dark:text-white">{poll.question}</h3>

      {jaVotou ? (
        <div className="mt-4 space-y-3">
          {opcoes.map((o, i) => {
            const pct = total > 0 ? Math.round((o.votes / total) * 100) : 0;
            const lider = o.votes > 0 && o.votes === maior;
            return (
              <div key={o.id}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span
                    className={`flex items-center gap-1.5 ${
                      lider ? "font-bold text-unifique dark:text-white" : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {lider && <Crown size={15} className="flex-none text-amber-500" />}
                    {o.text}
                  </span>
                  <span className="flex-none tabular-nums text-gray-500 dark:text-gray-400">
                    <strong className="text-gray-800 dark:text-gray-100">
                      <CountUp value={pct} />%
                    </strong>{" "}
                    · {o.votes}
                  </span>
                </div>
                <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  <div
                    className={`barra-enquete h-full rounded-full ${
                      lider ? "bg-gradient-to-r from-unifique to-unifique-blue" : "bg-unifique/35 dark:bg-unifique-blue/40"
                    }`}
                    style={{ width: `${pct}%`, animationDelay: `${i * 90}ms` }}
                  />
                </div>
              </div>
            );
          })}
          <p className="pt-1 text-xs text-gray-400">
            {total} voto{total === 1 ? "" : "s"} no total · você já votou nesta enquete
          </p>
        </div>
      ) : (
        <div className="em-sequencia mt-4 space-y-2">
          {poll.options.map((o) => (
            <form key={o.id} action={votePoll}>
              <input type="hidden" name="pollId" value={poll.id} />
              <input type="hidden" name="optionId" value={o.id} />
              <button
                type="submit"
                className="group flex w-full items-center gap-3 rounded-xl border-2 border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 transition hover:-translate-y-0.5 hover:border-unifique hover:bg-unifique-light/60 hover:shadow-sm dark:border-white/15 dark:text-gray-200 dark:hover:border-unifique-blue dark:hover:bg-white/5"
              >
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 border-gray-300 transition group-hover:border-unifique dark:border-white/30">
                  <span className="h-2.5 w-2.5 scale-0 rounded-full bg-unifique transition group-hover:scale-100 dark:bg-unifique-blue" />
                </span>
                {o.text}
              </button>
            </form>
          ))}
          <p className="flex items-center gap-1.5 pt-1 text-xs text-gray-400">
            <Vote size={13} /> Toque em uma opção para votar. O resultado aparece em seguida.
          </p>
        </div>
      )}

      {/* Sugerir uma modalidade que não está nas opções */}
      <form action={suggestPollModality} className="mt-5 border-t border-gray-100 pt-4 dark:border-white/10">
        <input type="hidden" name="pollId" value={poll.id} />
        <input type="hidden" name="from" value={from} />
        {/* honeypot anti-spam */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
          Quer uma modalidade que não está na lista? Sugira aqui:
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            name="text"
            maxLength={80}
            placeholder="Ex: Beach Tennis, Padel..."
            className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-unifique focus:outline-none focus:ring-2 focus:ring-unifique/15 dark:border-white/15 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
          />
          <button
            type="submit"
            className="rounded-xl bg-unifique px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-unifique-dark"
          >
            Sugerir
          </button>
        </div>
      </form>

      {compartilhar && (
        <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/10">
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Chame a galera pra votar:</p>
          <ShareEnquete question={poll.question} pollId={poll.id} />
        </div>
      )}
    </div>
  );
}
