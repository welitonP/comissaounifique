import { Swords, MapPin, CalendarClock, Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createTournamentSignup } from "@/lib/actions";
import { fmtDataHora } from "@/lib/datas";
import SuccessCelebration from "@/components/SuccessCelebration";

export const dynamic = "force-dynamic";

export default async function TorneiosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [params, torneios] = await Promise.all([
    searchParams,
    prisma.tournament.findMany({
      orderBy: [{ open: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { signups: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SuccessCelebration active={params.ok === "1"} message="Inscrição feita! Bom jogo!" />

      <section className="rounded-2xl bg-gradient-to-br from-unifique to-unifique-blue p-7 text-white shadow-md">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <Swords size={26} className="text-unifique-yellow" />
          </span>
          <div>
            <h1 className="text-2xl font-bold">Torneios internos</h1>
            <p className="text-sm text-white/85">Rachas e campeonatos da nossa comissão.</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/85">
          Bora jogar? Escolha um torneio aberto e faça sua inscrição.
        </p>
      </section>

      {params.erro === "dados" && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
          Preencha seu nome e telefone (WhatsApp) para se inscrever.
        </p>
      )}
      {params.erro === "fechado" && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
          As inscrições deste torneio foram encerradas.
        </p>
      )}

      {torneios.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">
          Nenhum torneio no momento. Fique de olho nos comunicados!
        </p>
      )}

      <div className="space-y-5">
        {torneios.map((t) => (
          <section key={t.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-lg font-bold text-unifique">{t.title}</h2>
                {t.open ? (
                  <span className="whitespace-nowrap rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Inscrições abertas
                  </span>
                ) : (
                  <span className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                    Encerrado
                  </span>
                )}
              </div>
              {t.description && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{t.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                {t.date && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock size={16} className="text-unifique-blue" /> {fmtDataHora(t.date)}
                  </span>
                )}
                {t.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={16} className="text-unifique-blue" /> {t.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 font-medium text-unifique">
                  {t._count.signups} inscrito(s)
                </span>
              </div>
            </div>

            {t.open ? (
              <form action={createTournamentSignup} className="space-y-3 p-5">
                <input type="hidden" name="tournamentId" value={t.id} />
                {/* honeypot */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Nome <span className="text-unifique-blue">*</span>
                    </label>
                    <input
                      name="name"
                      required
                      className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-unifique focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Telefone (WhatsApp) <span className="text-unifique-blue">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      inputMode="tel"
                      placeholder="(47) 90000-0000"
                      className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-unifique focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Observação <span className="font-normal text-gray-400">(opcional)</span>
                  </label>
                  <input
                    name="note"
                    placeholder="Ex: jogo em dupla com o Fulano"
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-unifique focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-unifique py-3 font-display font-semibold text-white shadow transition hover:bg-unifique-dark"
                >
                  Quero participar
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 p-5 text-sm text-gray-500">
                <Lock size={16} /> Inscrições encerradas para este torneio.
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
