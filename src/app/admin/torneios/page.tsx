import { Download } from "lucide-react";
import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleTournament, deleteTournament, deleteTournamentSignup } from "@/lib/actions";
import { fmtDataHora, toInputLocal } from "@/lib/datas";
import ConfirmButton from "@/components/ConfirmButton";
import TournamentForm from "@/components/TournamentForm";

export const dynamic = "force-dynamic";

function parseAnswers(raw: string | null): [string, string][] {
  if (!raw) return [];
  try {
    const obj = JSON.parse(raw) as Record<string, string>;
    return Object.entries(obj);
  } catch {
    return [];
  }
}

export default async function AdminTorneiosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUserPage();
  const [params, torneios] = await Promise.all([
    searchParams,
    prisma.tournament.findMany({
      orderBy: [{ open: "desc" }, { createdAt: "desc" }],
      include: { signups: { orderBy: { createdAt: "asc" } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-unifique">Torneios internos</h1>
        <p className="text-sm text-gray-500">
          Crie um torneio (truco, CS, futvôlei...) e a galera se inscreve pela página pública.
        </p>
      </div>

      {params.ok === "editado" && (
        <p className="rounded-xl bg-green-100 px-4 py-3 text-sm font-medium text-green-800">
          Torneio atualizado com sucesso.
        </p>
      )}

      {/* Criar torneio (com ajuda da IA) */}
      <TournamentForm />

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

            {/* Editar torneio (título, texto, data, local, perguntas) */}
            <TournamentForm
              tournament={{
                id: t.id,
                title: t.title,
                description: t.description ?? "",
                location: t.location ?? "",
                questions: t.questions ?? "",
                dateLocal: toInputLocal(t.date),
              }}
            />

            <div className="mt-3 border-t border-gray-100 pt-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-unifique">Inscritos ({t.signups.length})</p>
                {t.signups.length > 0 && (
                  <a
                    href={`/api/export/torneio?id=${t.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-unifique px-3 py-1.5 text-xs font-semibold text-unifique hover:bg-unifique/10"
                  >
                    <Download size={14} /> Baixar Excel (nome e número)
                  </a>
                )}
              </div>
              {t.signups.length === 0 ? (
                <p className="text-sm text-gray-400">Ninguém inscrito ainda.</p>
              ) : (
                <ul className="space-y-1">
                  {t.signups.map((s) => {
                    const respostas = parseAnswers(s.answers);
                    return (
                      <li
                        key={s.id}
                        className="flex items-start justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm"
                      >
                        <span>
                          <span className="font-medium">{s.name}</span>
                          <span className="text-gray-500"> · {s.phone}</span>
                          {s.note && <span className="text-gray-400"> · {s.note}</span>}
                          {respostas.map(([q, a]) => (
                            <span key={q} className="block text-xs text-gray-500">
                              {q}: <span className="text-gray-700">{a}</span>
                            </span>
                          ))}
                        </span>
                        <form action={deleteTournamentSignup}>
                          <input type="hidden" name="id" value={s.id} />
                          <button type="submit" className="text-xs text-red-600 hover:underline">
                            remover
                          </button>
                        </form>
                      </li>
                    );
                  })}
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
