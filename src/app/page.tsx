import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import WeeklySummary from "@/components/WeeklySummary";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const now = new Date();
  const [nextEvent, latestAnnouncement, openPoll, modalityCount, materialCount] = await Promise.all([
    prisma.calendarEvent.findFirst({
      where: { date: { gte: new Date(now.toDateString()) } },
      orderBy: { date: "asc" },
      include: { modality: true },
    }),
    prisma.announcement.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.poll.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.modality.count(),
    prisma.material.aggregate({ _sum: { quantity: true } }),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-gradient-to-br from-unifique to-unifique-blue p-8 text-white shadow-sm">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Image
            src="/logo-comissao.jpg"
            alt="Comissão de Esportes Unifique"
            width={110}
            height={110}
            className="rounded-full bg-white shadow-md"
            priority
          />
          <div>
            <h1 className="text-3xl font-bold">Comissão de Esportes Unifique</h1>
            <p className="mt-2 max-w-2xl text-white/90">
              Acompanhe o campeonato Entre Empresas, o calendário de jogos, a classificação dos
              times, os comunicados e as enquetes da comissão.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/entre-empresas"
            className="rounded-lg bg-white px-5 py-2 font-semibold text-unifique hover:bg-white/90"
          >
            Entre Empresas
          </Link>
          <Link
            href="/calendario"
            className="rounded-lg bg-white/15 px-5 py-2 font-semibold hover:bg-white/25"
          >
            Calendário
          </Link>
        </div>
      </section>

      <WeeklySummary />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Card href="/calendario" title="Próximo evento">
          {nextEvent ? (
            <p className="text-sm text-gray-600">
              {new Date(nextEvent.date).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
              })}
              <br />
              <span className="font-medium">{nextEvent.title}</span>
              {nextEvent.modality ? ` · ${nextEvent.modality.name}` : ""}
            </p>
          ) : (
            <p className="text-sm text-gray-400">Nenhum evento agendado.</p>
          )}
        </Card>

        <Card href="/entre-empresas" title="Entre Empresas">
          <p className="text-sm text-gray-600">
            <span className="text-2xl font-bold text-unifique">{modalityCount}</span> modalidade(s)
            no campeonato.
          </p>
        </Card>

        <Card href="/materiais" title="Materiais">
          <p className="text-sm text-gray-600">
            <span className="text-2xl font-bold text-unifique">
              {materialCount._sum.quantity ?? 0}
            </span>{" "}
            itens em estoque.
          </p>
        </Card>

        <Card href="/comunicados" title="Último comunicado">
          {latestAnnouncement ? (
            <p className="line-clamp-3 text-sm text-gray-600">{latestAnnouncement.title}</p>
          ) : (
            <p className="text-sm text-gray-400">Nenhum comunicado ainda.</p>
          )}
        </Card>

        <Card href="/enquetes" title="Enquete em aberto">
          {openPoll ? (
            <p className="line-clamp-3 text-sm text-gray-600">{openPoll.question}</p>
          ) : (
            <p className="text-sm text-gray-400">Nenhuma enquete ativa.</p>
          )}
        </Card>

        <Card href="/classificacao" title="Classificação">
          <p className="text-sm text-gray-600">Veja a tabela de pontos por modalidade.</p>
        </Card>
      </div>
    </div>
  );
}

function Card({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border-t-4 border-unifique-blue bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <h2 className="mb-2 font-semibold text-unifique">{title}</h2>
      {children}
    </Link>
  );
}
