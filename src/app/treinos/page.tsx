import { CalendarDays, Clock, Dumbbell, MapPin, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createTrainingSignup } from "@/lib/actions";
import { TZ_BRASIL } from "@/lib/datas";
import PhoneInput from "@/components/form/PhoneInput";
import SubmitButton from "@/components/form/SubmitButton";
import RememberMe from "@/components/form/RememberMe";
import ScrollIntoView from "@/components/form/ScrollIntoView";
import SuccessCelebration from "@/components/SuccessCelebration";
import AnimatedCheck from "@/components/anim/AnimatedCheck";
import CountUp from "@/components/CountUp";

export const dynamic = "force-dynamic";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
// Ordem de exibição: começa na segunda e termina no domingo.
const ORDEM = [1, 2, 3, 4, 5, 6, 0];

// "Hoje", "Amanhã" ou "ter, 04/11": a próxima vez que o treino acontece.
function proximoTreino(weekday: number, time: string): string {
  const agora = new Date();
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ_BRASIL,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(agora)
      .map((p) => [p.type, p.value]),
  );
  const hoje = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(partes.weekday);
  const minutosAgora = (Number(partes.hour) % 24) * 60 + Number(partes.minute);
  const [hh, mm] = time.split(":").map(Number);
  let dias = (weekday - hoje + 7) % 7;
  if (dias === 0 && minutosAgora > (hh || 0) * 60 + (mm || 0)) dias = 7;
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  const data = new Date(agora.getTime() + dias * 86400000);
  const ddmm = data.toLocaleDateString("pt-BR", { timeZone: TZ_BRASIL, day: "2-digit", month: "2-digit" });
  return `${DIAS_CURTOS[weekday]}, ${ddmm}`;
}

const campo =
  "w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-base focus:border-unifique focus:outline-none focus:ring-2 focus:ring-unifique/15 dark:border-white/15 dark:bg-gray-800 dark:text-white";

export default async function TreinosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [params, treinos] = await Promise.all([
    searchParams,
    prisma.training.findMany({
      orderBy: [{ weekday: "asc" }, { time: "asc" }, { order: "asc" }],
      // Publicamente só a QUANTIDADE de participantes (nomes e WhatsApp ficam só com a comissão).
      include: { _count: { select: { signups: true } } },
    }),
  ]);

  const okId = typeof params.ok === "string" ? params.ok : null;
  const erroId = typeof params.t === "string" ? params.t : null;
  const erro = params.erro === "ja-inscrito" ? "ja-inscrito" : params.erro === "dados" ? "dados" : null;
  const confirmado = okId ? treinos.find((t) => t.id === okId) : undefined;

  const porDia = new Map<number, typeof treinos>();
  for (const t of treinos) {
    if (!porDia.has(t.weekday)) porDia.set(t.weekday, []);
    porDia.get(t.weekday)!.push(t);
  }
  const diasComTreino = ORDEM.filter((d) => porDia.has(d));

  return (
    <div className="space-y-6">
      <SuccessCelebration active={!!okId} message="Presença confirmada! Bom treino!" />
      <section className="banner-vivo rounded-2xl bg-gradient-to-br from-unifique to-unifique-blue p-6 text-white shadow-md sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-white/15">
            <Dumbbell size={26} className="text-unifique-yellow" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">Grade de treinos</h1>
            <p className="text-sm text-white/85">Escolha o treino e confirme sua presença.</p>
          </div>
        </div>
        {/* atalhos para os dias */}
        {diasComTreino.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {diasComTreino.map((d) => (
              <a
                key={d}
                href={`#dia-${d}`}
                className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-white/25"
              >
                {DIAS[d]}
              </a>
            ))}
          </div>
        )}
      </section>

      {okId && !confirmado && (
        <p className="rounded-xl bg-green-100 px-4 py-3 text-sm font-medium text-green-800">
          ✅ Presença confirmada! Nos vemos no treino.
        </p>
      )}
      {erro && !erroId && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">Informe seu nome e WhatsApp para participar.</p>
      )}

      {treinos.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white px-6 py-12 text-center dark:border-white/10 dark:bg-gray-900">
          <Dumbbell size={32} className="mx-auto text-gray-300" />
          <p className="mt-2 font-display font-semibold text-gray-700 dark:text-gray-200">Nenhum treino cadastrado ainda</p>
          <p className="text-sm text-gray-500">Fique de olho nos comunicados!</p>
        </div>
      )}

      <div className="space-y-6">
        {diasComTreino.map((dia) => (
          <section key={dia} id={`dia-${dia}`} className="scroll-mt-24">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-unifique dark:text-white">
              {DIAS[dia]}
              <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
            </h2>
            <div className="em-sequencia grid gap-3 sm:grid-cols-2">
              {porDia.get(dia)!.map((t) => {
                const acabouDeConfirmar = okId === t.id;
                const quando = proximoTreino(t.weekday, t.time);
                const qtd = t._count.signups;
                const erroAqui = erro && erroId === t.id ? erro : null;
                return (
                  <div
                    key={t.id}
                    id={`treino-${t.id}`}
                    className={`scroll-mt-24 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-gray-900 ${
                      acabouDeConfirmar ? "ring-2 ring-green-400" : quando === "Hoje" ? "ring-2 ring-unifique-blue/40" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-14 w-14 flex-none flex-col items-center justify-center rounded-xl bg-gradient-to-br from-unifique to-unifique-blue text-white shadow-md shadow-unifique/20">
                        <Clock size={15} />
                        <span className="mt-0.5 text-xs font-bold leading-none">{t.time}</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-lg font-semibold text-gray-900 dark:text-white">{t.modality}</p>
                        <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <MapPin size={14} className="flex-none text-unifique-blue" />
                          {t.location || "Local a confirmar"}
                        </p>
                        {quando === "Hoje" ? (
                          <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700 dark:bg-green-500/15 dark:text-green-300">
                            <span className="anim-respirar h-2 w-2 rounded-full bg-green-500" /> É hoje!
                          </p>
                        ) : (
                          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-unifique-light px-2 py-0.5 text-xs font-semibold text-unifique dark:bg-white/10 dark:text-unifique-blue">
                            <CalendarDays size={12} /> Próximo: {quando}
                          </p>
                        )}
                        {t.notes && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t.notes}</p>}
                      </div>
                    </div>

                    {/* Participantes: só a quantidade (sem nomes) */}
                    <div className="mt-3 border-t border-gray-100 pt-3 dark:border-white/10">
                      <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-unifique-light text-unifique dark:bg-white/10 dark:text-unifique-blue">
                          <Users size={14} />
                        </span>
                        {qtd === 0 ? (
                          "Seja o primeiro a confirmar!"
                        ) : (
                          <span>
                            <strong className="font-display text-base text-unifique dark:text-white">
                              <CountUp value={qtd} />
                            </strong>{" "}
                            {qtd === 1 ? "pessoa confirmada" : "pessoas confirmadas"}
                          </span>
                        )}
                      </p>

                      {acabouDeConfirmar ? (
                        <ScrollIntoView className="mt-3">
                          <p className="flex items-center gap-2.5 rounded-xl bg-green-50 px-3 py-2.5 text-sm font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-300">
                            <AnimatedCheck size={28} /> Você está na lista! Nos vemos no treino.
                          </p>
                        </ScrollIntoView>
                      ) : (
                        <details className="group mt-3" open={!!erroAqui}>
                          <summary className="btn-brilho cursor-pointer list-none rounded-xl bg-unifique px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-unifique-dark group-open:bg-gray-100 group-open:text-gray-600 dark:group-open:bg-white/10 dark:group-open:text-gray-300 [&::-webkit-details-marker]:hidden">
                            <span className="group-open:hidden">Quero participar</span>
                            <span className="hidden group-open:inline">Fechar</span>
                          </summary>
                          <form action={createTrainingSignup} className="mt-3 space-y-2">
                            <input type="hidden" name="trainingId" value={t.id} />
                            {/* honeypot */}
                            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                            {erroAqui && (
                              <ScrollIntoView>
                                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                                  {erroAqui === "ja-inscrito"
                                    ? "Você já está na lista deste treino (mesmo nome ou WhatsApp)."
                                    : "Informe seu nome e WhatsApp."}
                                </p>
                              </ScrollIntoView>
                            )}
                            <input name="name" required maxLength={100} autoComplete="name" placeholder="Seu nome" className={campo} />
                            <PhoneInput className={campo} placeholder="WhatsApp com DDD" />
                            <RememberMe />
                            <SubmitButton className="btn-brilho w-full rounded-xl bg-unifique-blue py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
                              Confirmar presença
                            </SubmitButton>
                          </form>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
