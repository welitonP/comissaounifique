import { Download } from "lucide-react";
import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTraining, deleteTraining, deleteTrainingSignup } from "@/lib/actions";

export const dynamic = "force-dynamic";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const ORDEM = [1, 2, 3, 4, 5, 6, 0];

export default async function AdminTreinosPage() {
  await requireUserPage();
  const treinos = await prisma.training.findMany({
    orderBy: [{ weekday: "asc" }, { time: "asc" }],
    include: { signups: { orderBy: { createdAt: "asc" } } },
  });

  const porDia = new Map<number, typeof treinos>();
  for (const t of treinos) {
    if (!porDia.has(t.weekday)) porDia.set(t.weekday, []);
    porDia.get(t.weekday)!.push(t);
  }
  const totalInscritos = treinos.reduce((n, t) => n + t.signups.length, 0);

  // Modalidades que já têm inscritos (para o filtro do export).
  const inscritosPorModalidade = new Map<string, number>();
  for (const t of treinos) {
    inscritosPorModalidade.set(
      t.modality,
      (inscritosPorModalidade.get(t.modality) || 0) + t.signups.length,
    );
  }
  const modalidades = [...inscritosPorModalidade.entries()]
    .filter(([, n]) => n > 0)
    .sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-unifique">Grade de treinos</h1>
          <p className="text-sm text-gray-500">
            Cadastre os treinos da semana (dia, horário e local). Aparecem na aba pública Treinos.
          </p>
        </div>
        {totalInscritos > 0 && (
          <form
            method="get"
            action="/api/export/treinos"
            className="flex shrink-0 items-end gap-2"
          >
            <div>
              <label className="block text-xs font-medium text-gray-500">Exportar inscritos</label>
              <select
                name="modalidade"
                defaultValue="all"
                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="all">Todas ({totalInscritos})</option>
                {modalidades.map(([m, n]) => (
                  <option key={m} value={m}>
                    {m} ({n})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-unifique px-3 py-2 text-sm font-semibold text-white hover:bg-unifique-dark"
            >
              <Download size={15} /> Excel
            </button>
          </form>
        )}
      </div>

      {/* Novo treino */}
      <form action={createTraining} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-unifique">Novo treino</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-500">Modalidade</label>
            <input
              name="modality"
              placeholder="Ex: Vôlei"
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Dia da semana</label>
            <select
              name="weekday"
              required
              defaultValue="1"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              {ORDEM.map((d) => (
                <option key={d} value={d}>
                  {DIAS[d]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Horário</label>
            <input
              type="time"
              name="time"
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Local (opcional)</label>
            <input
              name="location"
              placeholder="Ex: Ginásio Central"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Observação (opcional)</label>
          <input
            name="notes"
            placeholder="Ex: traga sua garrafinha"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark"
        >
          Adicionar treino
        </button>
      </form>

      {/* Grade atual */}
      <div className="space-y-4">
        {ORDEM.filter((d) => porDia.has(d)).map((dia) => (
          <div key={dia}>
            <h2 className="mb-2 font-semibold text-unifique">{DIAS[dia]}</h2>
            <div className="space-y-2">
              {porDia.get(dia)!.map((t) => (
                <div key={t.id} className="rounded-lg bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm">
                      <span className="font-semibold text-unifique">{t.time}</span> · {t.modality}
                      {t.location ? ` · ${t.location}` : ""}
                      {t.notes ? <span className="text-gray-400"> · {t.notes}</span> : ""}
                    </p>
                    <form action={deleteTraining}>
                      <input type="hidden" name="id" value={t.id} />
                      <button type="submit" className="text-sm text-red-600 hover:underline">
                        Remover
                      </button>
                    </form>
                  </div>

                  {/* Inscritos (nome e WhatsApp, visível só para a comissão) */}
                  <div className="mt-2 border-t border-gray-100 pt-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Inscritos ({t.signups.length})
                    </p>
                    {t.signups.length === 0 ? (
                      <p className="mt-1 text-xs text-gray-400">Ninguém inscrito ainda.</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {t.signups.map((s) => (
                          <li
                            key={s.id}
                            className="flex items-center justify-between gap-2 text-sm text-gray-700"
                          >
                            <span>
                              {s.name}
                              {s.phone ? <span className="text-gray-400"> · {s.phone}</span> : ""}
                            </span>
                            <form action={deleteTrainingSignup}>
                              <input type="hidden" name="id" value={s.id} />
                              <button
                                type="submit"
                                className="text-xs text-red-600 hover:underline"
                              >
                                remover
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {treinos.length === 0 && <p className="text-gray-500">Nenhum treino cadastrado.</p>}
      </div>
    </div>
  );
}
