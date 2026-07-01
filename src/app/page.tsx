import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [nextMatch, latestAnnouncement, openPoll] = await Promise.all([
    prisma.match.findFirst({
      where: { status: "scheduled" },
      orderBy: { date: "asc" },
      include: { homeTeam: true, awayTeam: true },
    }),
    prisma.announcement.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.poll.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-unifique-dark">
          Bem-vindo à Comissão de Esportes Unifique
        </h1>
        <p className="mt-2 text-gray-600">
          Acompanhe a agenda de jogos, a classificação dos times, comunicados e enquetes da
          comissão.
        </p>
      </section>

      <div className="grid gap-6 sm:grid-cols-3">
        <Link href="/agenda" className="rounded-lg bg-white p-5 shadow-sm hover:shadow-md">
          <h2 className="font-semibold text-unifique-dark">Próximo jogo</h2>
          {nextMatch ? (
            <p className="mt-2 text-sm text-gray-600">
              {nextMatch.homeTeam.name} x {nextMatch.awayTeam.name}
              <br />
              {new Date(nextMatch.date).toLocaleString("pt-BR")}
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">Nenhum jogo agendado.</p>
          )}
        </Link>

        <Link href="/comunicados" className="rounded-lg bg-white p-5 shadow-sm hover:shadow-md">
          <h2 className="font-semibold text-unifique-dark">Último comunicado</h2>
          {latestAnnouncement ? (
            <p className="mt-2 line-clamp-3 text-sm text-gray-600">{latestAnnouncement.title}</p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">Nenhum comunicado ainda.</p>
          )}
        </Link>

        <Link href="/enquetes" className="rounded-lg bg-white p-5 shadow-sm hover:shadow-md">
          <h2 className="font-semibold text-unifique-dark">Enquete em aberto</h2>
          {openPoll ? (
            <p className="mt-2 line-clamp-3 text-sm text-gray-600">{openPoll.question}</p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">Nenhuma enquete ativa.</p>
          )}
        </Link>
      </div>
    </div>
  );
}
