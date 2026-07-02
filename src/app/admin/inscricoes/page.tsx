import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isInscricoesAbertas } from "@/lib/settings";
import {
  approveEnrollment,
  deleteEnrollment,
  rejectEnrollment,
  toggleInscricoes,
} from "@/lib/actions";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  aprovada: "bg-green-100 text-green-700",
  recusada: "bg-red-100 text-red-700",
};

export default async function AdminInscricoesPage() {
  await requireUserPage();
  const [aberto, enrollments] = await Promise.all([
    isInscricoesAbertas(),
    prisma.enrollment.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const pendentes = enrollments.filter((e) => e.status === "pendente");
  const outras = enrollments.filter((e) => e.status !== "pendente");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-unifique">Inscrições</h1>

      {/* Abrir/fechar inscrições */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div>
          <p className="font-semibold text-unifique">
            Status: {aberto ? "🟢 Inscrições abertas" : "🔴 Inscrições encerradas"}
          </p>
          <p className="text-sm text-gray-500">
            {aberto
              ? "Os atletas podem se inscrever pela página pública."
              : "A página de inscrição mostra 'encerradas' para os atletas."}
          </p>
        </div>
        <form action={toggleInscricoes}>
          <input type="hidden" name="abrir" value={aberto ? "0" : "1"} />
          <button
            type="submit"
            className={`rounded-lg px-4 py-2 font-medium text-white ${
              aberto ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {aberto ? "Encerrar inscrições" : "Abrir inscrições"}
          </button>
        </form>
      </div>

      {/* Pendentes */}
      <section>
        <h2 className="mb-2 font-semibold text-unifique">
          Pendentes ({pendentes.length})
        </h2>
        {pendentes.length === 0 && (
          <p className="rounded-xl bg-white p-4 text-sm text-gray-500 shadow-sm">
            Nenhuma inscrição pendente.
          </p>
        )}
        <div className="space-y-3">
          {pendentes.map((e) => (
            <div key={e.id} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="font-semibold">
                {e.name}
                {e.shirtSize ? (
                  <span className="ml-2 rounded bg-unifique-light px-2 py-0.5 text-xs text-unifique">
                    Camisa {e.shirtSize}
                  </span>
                ) : null}
              </p>
              <p className="text-sm text-gray-500">
                {[e.sector, e.contact].filter(Boolean).join(" · ") || "sem dados extras"}
              </p>
              <p className="mt-1 text-sm">
                <span className="font-medium text-unifique">Modalidades:</span> {e.modalityNames}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                <form action={approveEnrollment}>
                  <input type="hidden" name="id" value={e.id} />
                  <button
                    type="submit"
                    className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Aprovar (entra no elenco)
                  </button>
                </form>
                <form action={rejectEnrollment}>
                  <input type="hidden" name="id" value={e.id} />
                  <button
                    type="submit"
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Recusar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Histórico */}
      {outras.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-unifique">Histórico</h2>
          <div className="space-y-2">
            {outras.map((e) => (
              <div
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 shadow-sm"
              >
                <div>
                  <p className="font-medium">
                    {e.name}
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[e.status] ?? ""}`}
                    >
                      {e.status}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">{e.modalityNames}</p>
                </div>
                <form action={deleteEnrollment}>
                  <input type="hidden" name="id" value={e.id} />
                  <button type="submit" className="text-sm text-red-600 hover:underline">
                    Excluir
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
