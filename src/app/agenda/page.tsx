import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    finished: "bg-green-100 text-green-700",
    canceled: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    scheduled: "Agendado",
    finished: "Finalizado",
    canceled: "Cancelado",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default async function AgendaPage() {
  const matches = await prisma.match.findMany({
    orderBy: { date: "asc" },
    include: { homeTeam: true, awayTeam: true, championship: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-unifique-dark">Agenda de Jogos</h1>

      {matches.length === 0 && (
        <p className="text-gray-500">Nenhum jogo cadastrado até o momento.</p>
      )}

      <div className="space-y-3">
        {matches.map((match) => (
          <div key={match.id} className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {match.homeTeam.name}{" "}
                  {match.homeScore !== null && match.awayScore !== null
                    ? `${match.homeScore} x ${match.awayScore}`
                    : "x"}{" "}
                  {match.awayTeam.name}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(match.date).toLocaleString("pt-BR")}
                  {match.location ? ` · ${match.location}` : ""}
                  {match.championship ? ` · ${match.championship.name}` : ""}
                </p>
              </div>
              <StatusBadge status={match.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
