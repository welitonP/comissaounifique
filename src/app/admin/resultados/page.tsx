import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createResult, deleteResult } from "@/lib/actions";

export const dynamic = "force-dynamic";

const MEDAL_LABEL: Record<string, string> = {
  ouro: "🥇 Ouro",
  prata: "🥈 Prata",
  bronze: "🥉 Bronze",
};

export default async function AdminResultadosPage() {
  await requireUserPage();
  const results = await prisma.result.findMany({
    orderBy: [{ year: "desc" }, { modality: "asc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-unifique">Resultados e conquistas</h1>

      <form action={createResult} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-unifique">Novo resultado</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="event"
            placeholder="Evento (ex: 35ª OEE 2026)"
            required
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            name="year"
            type="number"
            placeholder="Ano"
            defaultValue={new Date().getFullYear()}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            name="modality"
            placeholder="Modalidade (ex: Futsal Masculino)"
            required
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            name="placement"
            placeholder="Colocação (ex: Campeão, Vice, 3º lugar)"
            required
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <select name="medal" className="rounded-lg border border-gray-300 px-3 py-2">
            <option value="">Sem medalha</option>
            <option value="ouro">🥇 Ouro</option>
            <option value="prata">🥈 Prata</option>
            <option value="bronze">🥉 Bronze</option>
          </select>
          <input
            name="note"
            placeholder="Observação (opcional)"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark"
        >
          Adicionar resultado
        </button>
      </form>

      <div className="space-y-2">
        {results.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 shadow-sm"
          >
            <div>
              <p className="font-medium">
                {r.modality} — {r.placement}
                {r.medal ? ` · ${MEDAL_LABEL[r.medal]}` : ""}
              </p>
              <p className="text-xs text-gray-500">
                {r.event}
                {r.note ? ` · ${r.note}` : ""}
              </p>
            </div>
            <form action={deleteResult}>
              <input type="hidden" name="id" value={r.id} />
              <button type="submit" className="text-sm text-red-600 hover:underline">
                Remover
              </button>
            </form>
          </div>
        ))}
        {results.length === 0 && <p className="text-gray-500">Nenhum resultado cadastrado.</p>}
      </div>
    </div>
  );
}
