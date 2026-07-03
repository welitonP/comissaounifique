import { Trophy, Medal } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MEDAL_META: Record<
  string,
  { color: string; ring: string; bar: string; emoji: string; label: string }
> = {
  ouro: { color: "text-yellow-500", ring: "bg-yellow-50", bar: "bg-yellow-400", emoji: "🥇", label: "Ouro" },
  prata: { color: "text-gray-400", ring: "bg-gray-100", bar: "bg-gray-300", emoji: "🥈", label: "Prata" },
  bronze: { color: "text-amber-700", ring: "bg-amber-50", bar: "bg-amber-500", emoji: "🥉", label: "Bronze" },
};

export default async function ResultadosPage() {
  const results = await prisma.result.findMany({
    orderBy: [{ year: "desc" }, { order: "asc" }, { modality: "asc" }],
  });

  // Agrupa por ano e, dentro do ano, por evento.
  const porAno = new Map<number, Map<string, typeof results>>();
  for (const r of results) {
    if (!porAno.has(r.year)) porAno.set(r.year, new Map());
    const eventos = porAno.get(r.year)!;
    if (!eventos.has(r.event)) eventos.set(r.event, []);
    eventos.get(r.event)!.push(r);
  }

  const contagem = { ouro: 0, prata: 0, bronze: 0 };
  for (const r of results) {
    if (r.medal && r.medal in contagem) contagem[r.medal as keyof typeof contagem]++;
  }
  const totalMedalhas = contagem.ouro + contagem.prata + contagem.bronze;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-unifique to-unifique-blue p-7 text-white shadow-md">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <Trophy size={26} className="text-unifique-yellow" />
          </span>
          <div>
            <h1 className="text-2xl font-bold">Resultados e conquistas</h1>
            <p className="text-sm text-white/85">O desempenho da Unifique nas competições.</p>
          </div>
        </div>

        {totalMedalhas > 0 && (
          <div className="mt-5 grid grid-cols-3 gap-3">
            {(["ouro", "prata", "bronze"] as const).map((tipo) => (
              <div key={tipo} className="rounded-xl bg-white/10 px-3 py-3 text-center">
                <p className="text-2xl font-bold leading-none">
                  {MEDAL_META[tipo].emoji} {contagem[tipo]}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/80">
                  {MEDAL_META[tipo].label}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {results.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">
          Os resultados serão publicados aqui após as competições.
        </p>
      )}

      {Array.from(porAno.entries()).map(([ano, eventos]) => (
        <section key={ano} className="space-y-5">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-lg font-bold text-unifique">{ano}</h2>
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          {Array.from(eventos.entries()).map(([evento, itens]) => (
            <div key={evento}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {evento}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {itens.map((r) => {
                  const meta = r.medal ? MEDAL_META[r.medal] : null;
                  return (
                    <div
                      key={r.id}
                      className="relative flex items-center gap-3 overflow-hidden rounded-xl bg-white p-4 shadow-sm"
                    >
                      <span
                        className={`absolute left-0 top-0 h-full w-1.5 ${meta ? meta.bar : "bg-unifique"}`}
                      />
                      <span
                        className={`ml-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${
                          meta ? meta.ring : "bg-unifique-light"
                        }`}
                      >
                        {meta ? (
                          <Medal size={26} className={meta.color} />
                        ) : (
                          <Trophy size={22} className="text-unifique" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-800">{r.modality}</p>
                        <p className="text-sm font-semibold text-unifique-blue">{r.placement}</p>
                        {r.note && <p className="mt-0.5 text-xs text-gray-500">{r.note}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
