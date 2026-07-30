import { Dumbbell, MapPin, Clock, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createTrainingSignup } from "@/lib/actions";

export const dynamic = "force-dynamic";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
// Ordem de exibição: começa na segunda e termina no domingo.
const ORDEM = [1, 2, 3, 4, 5, 6, 0];

export default async function TreinosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [params, treinos] = await Promise.all([
    searchParams,
    prisma.training.findMany({
      orderBy: [{ weekday: "asc" }, { time: "asc" }, { order: "asc" }],
      // Publicamente só expomos o nome de quem participa (nunca o WhatsApp: LGPD).
      include: {
        signups: { select: { id: true, name: true }, orderBy: { createdAt: "asc" } },
      },
    }),
  ]);

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
          Apareça e treine com a gente! Confirme sua presença para a comissão se organizar melhor.
        </p>
      </section>

      {params.ok === "1" && (
        <p className="rounded-xl bg-green-100 px-4 py-3 text-sm font-medium text-green-800">
          ✅ Presença confirmada! Nos vemos no treino.
        </p>
      )}
      {params.erro === "ja-inscrito" && (
        <p className="rounded-xl bg-yellow-100 px-4 py-3 text-sm text-yellow-800">
          Você já está na lista deste treino (mesmo nome ou WhatsApp).
        </p>
      )}
      {params.erro === "dados" && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
          Informe pelo menos o seu nome para participar.
        </p>
      )}

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
                <div key={t.id} className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
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

                  {/* Participantes */}
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      <Users size={13} /> Participantes ({t.signups.length})
                    </p>
                    {t.signups.length === 0 ? (
                      <p className="mt-1 text-sm text-gray-400">Seja o primeiro a confirmar!</p>
                    ) : (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {t.signups.map((s) => (
                          <span
                            key={s.id}
                            className="rounded-full bg-unifique-light px-2.5 py-0.5 text-xs font-medium text-unifique"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Formulário recolhível de participação (sem login) */}
                    <details className="mt-3">
                      <summary className="cursor-pointer list-none rounded-lg bg-unifique px-3 py-1.5 text-center text-sm font-semibold text-white transition hover:bg-unifique-dark [&::-webkit-details-marker]:hidden">
                        Quero participar
                      </summary>
                      <form action={createTrainingSignup} className="mt-2 space-y-2">
                        <input type="hidden" name="trainingId" value={t.id} />
                        {/* honeypot */}
                        <input
                          type="text"
                          name="website"
                          tabIndex={-1}
                          autoComplete="off"
                          className="hidden"
                          aria-hidden="true"
                        />
                        <input
                          name="name"
                          required
                          maxLength={100}
                          placeholder="Seu nome"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-unifique focus:outline-none"
                        />
                        <input
                          type="tel"
                          name="phone"
                          inputMode="tel"
                          maxLength={30}
                          placeholder="WhatsApp (opcional)"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-unifique focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="w-full rounded-lg bg-unifique-blue py-2 text-sm font-semibold text-white transition hover:brightness-110"
                        >
                          Confirmar presença
                        </button>
                      </form>
                    </details>
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
