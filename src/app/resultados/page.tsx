import { Trophy, Medal } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MEDAL_COLOR: Record<string, string> = {
  ouro: "text-yellow-500",
  prata: "text-gray-400",
  bronze: "text-amber-700",
};

export default async function ResultadosPage() {
  const results = await prisma.result.findMany({
    orderBy: [{ year: "desc" }, { order: "asc" }, { modality: "asc" }],
  });

  // agrupar por evento
  const grupos = new Map<string, typeof results>();
  for (const r of results) {
    if (!grupos.has(r.event)) grupos.set(r.event, []);
    grupos.get(r.event)!.push(r);
  }

  const totalMedalhas = results.filter((r) => r.medal).length;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-unifique to-unifique-blue p-7 text-white shadow-md">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <Trophy size={26} className="text-unifique-yellow" />
          </span>
          <div>
            <h1 className="text-2xl font-bold">Resultados e conquistas</h1>
            <p className="text-sm text-white/85">
              O desempenho da Unifique nas competições.
            </p>
          </div>
        </div>
        {totalMedalhas > 0 && (
          <p className="mt-4 inline-block rounded-full bg-white/15 px-4 py-1 text-sm font-semibold">
            🏅 {totalMedalhas} conquista(s) registrada(s)
          </p>
        )}
      </section>

      {results.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">
          Os resultados serão publicados aqui após as competições.
        </p>
      )}

      {Array.from(grupos.entries()).map(([evento, itens]) => (
        <section key={evento}>
          <h2 className="mb-3 font-display text-xl font-bold text-unifique">{evento}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {itens.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm"
              >
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-unifique-light">
                  {r.medal ? (
                    <Medal size={24} className={MEDAL_COLOR[r.medal] ?? "text-unifique"} />
                  ) : (
                    <Trophy size={22} className="text-unifique" />
                  )}
                </span>
                <div>
                  <p className="font-semibold text-gray-800">{r.modality}</p>
                  <p className="text-sm font-medium text-unifique-blue">{r.placement}</p>
                  {r.note && <p className="text-xs text-gray-500">{r.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
