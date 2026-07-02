import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteSuggestion, updateSuggestionStatus } from "@/lib/actions";

const STATUS_LABEL: Record<string, string> = {
  nova: "Nova",
  analise: "Em análise",
  concluida: "Concluída",
};
const STATUS_STYLE: Record<string, string> = {
  nova: "bg-unifique-blue/10 text-unifique-blue",
  analise: "bg-yellow-100 text-yellow-800",
  concluida: "bg-green-100 text-green-700",
};

export default async function AdminSugestoesPage() {
  await requireUserPage();
  const suggestions = await prisma.suggestion.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-unifique">Sugestões recebidas</h1>
      <p className="text-sm text-gray-500">
        O que os atletas mandaram pela caixa de sugestões. Atualize o status pra se organizar.
      </p>

      {suggestions.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-gray-500 shadow-sm">
          Nenhuma sugestão ainda.
        </p>
      )}

      <div className="space-y-3">
        {suggestions.map((s) => (
          <div key={s.id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-unifique">
                  {s.name || "Anônimo"}
                  <span className="ml-2 font-normal text-gray-400">
                    {new Date(s.createdAt).toLocaleString("pt-BR")}
                  </span>
                </p>
                <p className="mt-1 whitespace-pre-wrap text-gray-800">{s.message}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[s.status] ?? ""}`}
              >
                {STATUS_LABEL[s.status] ?? s.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
              <form action={updateSuggestionStatus} className="flex items-center gap-2">
                <input type="hidden" name="id" value={s.id} />
                <select
                  name="status"
                  defaultValue={s.status}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="nova">Nova</option>
                  <option value="analise">Em análise</option>
                  <option value="concluida">Concluída</option>
                </select>
                <button
                  type="submit"
                  className="rounded bg-unifique-blue px-3 py-1 text-sm font-medium text-white hover:brightness-110"
                >
                  Atualizar
                </button>
              </form>
              <form action={deleteSuggestion} className="ml-auto">
                <input type="hidden" name="id" value={s.id} />
                <button type="submit" className="text-sm text-red-600 hover:underline">
                  Excluir
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
