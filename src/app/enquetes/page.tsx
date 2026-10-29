import { cookies } from "next/headers";
import { Vote } from "lucide-react";
import { prisma } from "@/lib/prisma";
import PollCard from "@/components/PollCard";
import ScrollIntoView from "@/components/form/ScrollIntoView";

export const dynamic = "force-dynamic";

const AVISOS: Record<string, { texto: string; tipo: "ok" | "info" | "erro" }> = {
  "voto-registrado": { texto: "Voto registrado! Veja como está a votação.", tipo: "ok" },
  "ja-votou": { texto: "Você já votou nessa enquete. Aqui está o resultado parcial.", tipo: "info" },
  "sugestao-ok": { texto: "Modalidade sugerida! A comissão vai avaliar. Obrigado!", tipo: "ok" },
  "sugestao-curta": { texto: "Escreva o nome da modalidade que você quer sugerir.", tipo: "erro" },
};

const COR = {
  ok: "bg-green-50 text-green-800 ring-green-200 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-500/30",
  info: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  erro: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30",
};

export default async function EnquetesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const polls = await prisma.poll.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, question: true, options: { select: { id: true, text: true, votes: true }, orderBy: { id: "asc" } } },
  });

  const store = await cookies();
  const votedCookie = store.get("voted_polls")?.value ?? "";
  const votadas = new Set(votedCookie ? votedCookie.split(",").filter(Boolean) : []);

  const chave =
    params.sucesso === "voto-registrado"
      ? "voto-registrado"
      : params.erro === "ja-votou"
        ? "ja-votou"
        : params.sugestao === "ok"
          ? "sugestao-ok"
          : params.sugestao === "curta"
            ? "sugestao-curta"
            : null;
  const aviso = chave ? AVISOS[chave] : null;
  const alvo = typeof params.p === "string" ? params.p : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="banner-vivo rounded-2xl bg-gradient-to-br from-unifique to-unifique-blue p-6 text-white shadow-md sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-white/15">
            <Vote size={26} className="text-unifique-yellow" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">Enquetes</h1>
            <p className="text-sm text-white/85">Sua opinião decide os próximos passos da comissão.</p>
          </div>
        </div>
      </section>

      {aviso && !alvo && (
        <p className={`aviso-entrar rounded-xl px-4 py-3 text-sm font-medium ring-1 ${COR[aviso.tipo]}`}>{aviso.texto}</p>
      )}

      {polls.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white px-6 py-12 text-center dark:border-white/10 dark:bg-gray-900">
          <Vote size={32} className="mx-auto text-gray-300" />
          <p className="mt-2 font-display font-semibold text-gray-700 dark:text-gray-200">Nenhuma enquete no momento</p>
          <p className="text-sm text-gray-500">Quando a comissão abrir uma votação, ela aparece aqui.</p>
        </div>
      )}

      <div className="em-sequencia space-y-4">
        {polls.map((poll) => (
          <div key={poll.id} id={`enquete-${poll.id}`} className="scroll-mt-24 space-y-3">
            {aviso && alvo === poll.id && (
              <ScrollIntoView>
                <p className={`aviso-entrar rounded-xl px-4 py-3 text-sm font-medium ring-1 ${COR[aviso.tipo]}`}>{aviso.texto}</p>
              </ScrollIntoView>
            )}
            <PollCard poll={poll} jaVotou={votadas.has(poll.id)} from="/enquetes" />
          </div>
        ))}
      </div>
    </div>
  );
}
