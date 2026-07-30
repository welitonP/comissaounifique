import { Dumbbell, MapPin, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
// Ordem de exibição: começa na segunda e termina no domingo.
const ORDEM = [1, 2, 3, 4, 5, 6, 0];

export default async function TreinosPage() {
  const treinos = await prisma.training.findMany({
    orderBy: [{ weekday: "asc" }, { time: "asc" }, { order: "asc" }],
  });

  const porDia = new Map<number, typeof treinos>();
  for (const t of treinos) {
    if (!porDia.has(t.weekday)) porDia.set(t.weekday, []);
    porDia.get(t.weekday)!.push(t);
  }
  const diasComTreino = ORDEM.filter((d) => porDia.has(d));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-unifique to-unifique-blue p-7 text-white shadow-md">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <Dumbbell size={26} className="text-unifique-yellow" />
          </span>
          <div>
            <h1 className="text-2xl font-bold">Grade de treinos</h1>
            <p className="text-sm text-white/85">Os horários dos nossos treinos durante a semana.</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/85">
          Apareça e treine com a gente! Confira o dia, horário e local de cada modalidade.
        </p>
      </section>

      {treinos.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">
          Nenhum treino cadastrado ainda. Fique de olho nos comunicados!
        </p>
      )}

      <div className="space-y-5">
        {diasComTreino.map((dia) => (
          <section key={dia}>
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-unifique">
              {DIAS[dia]}
              <span className="h-px flex-1 bg-gray-200" />
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {porDia.get(dia)!.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm"
                >
                  <span className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-unifique text-white">
                    <Clock size={16} />
                    <span className="text-[11px] font-bold leading-none">{t.time}</span>
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800">{t.modality}</p>
                    <p className="text-sm text-gray-500">
                      {t.location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={14} className="text-unifique-blue" /> {t.location}
                        </span>
                      ) : (
                        "Local a confirmar"
                      )}
                    </p>
                    {t.notes && <p className="mt-0.5 text-xs text-gray-400">{t.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
