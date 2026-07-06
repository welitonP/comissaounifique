import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  Camera,
  ChevronRight,
  Lightbulb,
  Megaphone,
  Package,
  Settings,
  Shirt,
  Trophy,
  Vote,
  type LucideIcon,
} from "lucide-react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { votePoll } from "@/lib/actions";
import Countdown from "@/components/Countdown";
import WeeklySummary from "@/components/WeeklySummary";
import ShareWhatsApp from "@/components/ShareWhatsApp";
import MembersMarquee from "@/components/MembersMarquee";
import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";
import { fmtDataHora, fmtHora, fmtDiaSemanaLongo } from "@/lib/datas";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const now = new Date();
  const hoje = new Date(now.toDateString());

  const [user, nextEvent, latestAnnouncements, modalityCount, athleteCount, upcomingCount, latestPoll] =
    await Promise.all([
      getCurrentUser(),
      prisma.calendarEvent.findFirst({
        where: { date: { gte: hoje } },
        orderBy: { date: "asc" },
        include: { modality: true },
      }),
      prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { images: { select: { id: true }, take: 1 } },
      }),
      prisma.modality.count(),
      prisma.registration.count(),
      prisma.calendarEvent.count({ where: { date: { gte: hoje } } }),
      prisma.poll.findFirst({
        orderBy: { createdAt: "desc" },
        include: { options: true },
      }),
    ]);

  // Já votou na enquete mais recente? (mesmo cookie usado na página de enquetes)
  const votedCookie = (await cookies()).get("voted_polls")?.value ?? "";
  const jaVotou = latestPoll
    ? votedCookie.split(",").filter(Boolean).includes(latestPoll.id)
    : false;
  const totalVotos = latestPoll
    ? latestPoll.options.reduce((sum, o) => sum + o.votes, 0)
    : 0;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-unifique via-unifique to-unifique-blue p-7 text-white shadow-lg sm:p-10">
        {/* detalhes decorativos */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-unifique-blue/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-unifique-teal/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <Image
            src="/logo-comissao.jpg"
            alt="Comissão de Esportes Unifique"
            width={120}
            height={120}
            className="h-24 w-24 rounded-full bg-white shadow-xl ring-4 ring-white/30 sm:h-28 sm:w-28"
            priority
          />
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-unifique-teal">
              Unifique · desde 2015
            </p>
            <h1 className="mt-1 text-3xl font-extrabold leading-tight sm:text-4xl">
              Comissão de Esportes
            </h1>
            <p className="mt-2 max-w-2xl text-white/85">
              Jogos, comunicados, elencos e tudo do esporte na Unifique em um lugar só.
            </p>
          </div>
        </div>

        {nextEvent && (
          <div className="relative mt-7 flex flex-col gap-4 rounded-2xl bg-black/20 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-unifique-yellow">
                Próximo jogo
              </p>
              <p className="mt-1 font-display text-xl font-bold">{nextEvent.title}</p>
              <p className="text-sm text-white/80">
                {fmtDiaSemanaLongo(nextEvent.date)} às {fmtHora(nextEvent.date)}
                {nextEvent.location ? ` · ${nextEvent.location}` : ""}
              </p>
              <div className="mt-3">
                <ShareWhatsApp
                  text={`🏆 Próximo jogo: ${nextEvent.title}\n📅 ${fmtDataHora(
                    nextEvent.date,
                  )}${nextEvent.location ? `\n📍 ${nextEvent.location}` : ""}`}
                />
              </div>
            </div>
            <Countdown target={new Date(nextEvent.date).toISOString()} />
          </div>
        )}

        <div className="relative mt-6 flex flex-wrap gap-3">
          <Link
            href="/calendario"
            className="rounded-xl bg-white px-5 py-2.5 font-display font-semibold text-unifique shadow transition hover:scale-[1.02]"
          >
            Ver calendário
          </Link>
          <Link
            href="/sugestoes"
            className="rounded-xl bg-white/15 px-5 py-2.5 font-display font-semibold text-white hover:bg-white/25"
          >
            Enviar sugestão
          </Link>
        </div>
      </section>

      {/* Números */}
      <Reveal>
        <section className="grid grid-cols-3 gap-3 sm:gap-5">
          {[
            { valor: modalityCount, rotulo: "modalidades" },
            { valor: athleteCount, rotulo: "atletas" },
            { valor: upcomingCount, rotulo: "eventos por vir" },
          ].map((s) => (
            <div key={s.rotulo} className="rounded-2xl bg-white p-4 text-center shadow-sm">
              <p className="font-display text-3xl font-extrabold text-unifique">
                <CountUp value={s.valor} />
              </p>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {s.rotulo}
              </p>
            </div>
          ))}
        </section>
      </Reveal>

      {/* Carrossel dos membros da comissão */}
      <Reveal>
        <MembersMarquee />
      </Reveal>

      {/* Últimos comunicados */}
      <Reveal>
        <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-unifique">
            <Megaphone size={22} className="text-unifique-blue" /> Últimos comunicados
          </h2>
          <Link
            href="/comunicados"
            className="flex items-center gap-1 text-sm font-semibold text-unifique-blue hover:underline"
          >
            Ver todos <ChevronRight size={16} />
          </Link>
        </div>
        {latestAnnouncements.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">
            Nenhum comunicado ainda.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {latestAnnouncements.map((a) => (
              <Link
                key={a.id}
                href="/comunicados"
                className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {a.images[0] ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`/api/imagens/${a.images[0].id}`}
                    alt=""
                    className="h-32 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-unifique to-unifique-blue">
                    <Megaphone size={30} className="text-white/60" />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                  <h3 className="mt-1 line-clamp-2 font-semibold text-gray-800 group-hover:text-unifique">
                    {a.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
        </section>
      </Reveal>

      {/* Acesso rápido */}
      <Reveal>
        <section>
        <h2 className="mb-4 text-xl font-bold text-unifique">Acesso rápido</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Atalho href="/calendario" titulo="Calendário" desc="Jogos e eventos" Icon={CalendarDays} />
          <Atalho href="/fotos" titulo="Fotos" desc="Momentos dos jogos" Icon={Camera} />
          <Atalho href="/entre-empresas" titulo="Entre Empresas" desc="Modalidades e elencos" Icon={Trophy} />
          <Atalho href="/sugestoes" titulo="Sugestões" desc="Mande sua ideia" Icon={Lightbulb} />
          {user && (
            <>
              <Atalho href="/materiais" titulo="Materiais" desc="Estoque da comissão" Icon={Package} />
              <Atalho href="/uniformes" titulo="Uniformes" desc="Quem está com o quê" Icon={Shirt} />
              <Atalho href="/admin" titulo="Gerenciar" desc="Painel da comissão" Icon={Settings} />
            </>
          )}
        </div>
        </section>
      </Reveal>

      {user && <WeeklySummary />}

      {/* Enquete mais recente (vote sem sair da home) */}
      {latestPoll && (
        <Reveal>
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-unifique">
                <Vote size={22} className="text-unifique-blue" /> Enquete
              </h2>
              <Link
                href="/enquetes"
                className="flex items-center gap-1 text-sm font-semibold text-unifique-blue hover:underline"
              >
                Ver todas <ChevronRight size={16} />
              </Link>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800">{latestPoll.question}</h3>
              <div className="mt-4 space-y-2">
                {latestPoll.options.map((option) => {
                  const pct = totalVotos > 0 ? Math.round((option.votes / totalVotos) * 100) : 0;
                  return jaVotou ? (
                    <div key={option.id}>
                      <div className="flex justify-between text-sm">
                        <span>{option.text}</span>
                        <span className="text-gray-500">
                          {option.votes} voto(s) · {pct}%
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded bg-gray-100">
                        <div className="h-2 rounded bg-unifique" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ) : (
                    <form key={option.id} action={votePoll}>
                      <input type="hidden" name="pollId" value={latestPoll.id} />
                      <input type="hidden" name="optionId" value={option.id} />
                      <button
                        type="submit"
                        className="w-full rounded border border-unifique px-3 py-2 text-left text-sm text-unifique-dark hover:bg-unifique/10"
                      >
                        {option.text}
                      </button>
                    </form>
                  );
                })}
              </div>
              {!jaVotou && (
                <p className="mt-3 text-xs text-gray-400">Toque em uma opção para votar.</p>
              )}
            </div>
          </section>
        </Reveal>
      )}
    </div>
  );
}

function Atalho({
  href,
  titulo,
  desc,
  Icon,
}: {
  href: string;
  titulo: string;
  desc: string;
  Icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-unifique-light text-unifique transition group-hover:bg-unifique group-hover:text-white">
        <Icon size={22} />
      </span>
      <h3 className="mt-3 font-display font-semibold text-gray-800">{titulo}</h3>
      <p className="text-xs text-gray-400">{desc}</p>
    </Link>
  );
}
