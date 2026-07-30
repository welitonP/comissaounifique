import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTraining, deleteTraining } from "@/lib/actions";

export const dynamic = "force-dynamic";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const ORDEM = [1, 2, 3, 4, 5, 6, 0];

export default async function AdminTreinosPage() {
  await requireUserPage();
  const treinos = await prisma.training.findMany({
    orderBy: [{ weekday: "asc" }, { time: "asc" }],
  });

  const porDia = new Map<number, typeof treinos>();
  for (const t of treinos) {
    if (!porDia.has(t.weekday)) porDia.set(t.weekday, []);
    porDia.get(t.weekday)!.push(t);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-unifique">Grade de treinos</h1>
        <p className="text-sm text-gray-500">
          Cadastre os treinos da semana (dia, horário e local). Aparecem na aba pública Treinos.
        </p>
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
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-white p-3 shadow-sm"
                >
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
              ))}
            </div>
          </div>
        ))}
        {treinos.length === 0 && <p className="text-gray-500">Nenhum treino cadastrado.</p>}
      </div>
    </div>
  );
}
