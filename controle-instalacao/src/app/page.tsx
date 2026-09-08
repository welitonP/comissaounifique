import Link from "next/link";
import { CalendarDays, MapPin, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { summarize } from "@/lib/events";
import { TopBar } from "@/components/TopBar";
import { NewEventDialog } from "@/components/NewEventDialog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const events = await prisma.event.findMany({
    orderBy: [{ archived: "asc" }, { startsAt: "desc" }, { createdAt: "desc" }],
    include: {
      points: { select: { status: true, positionChecked: true } },
      equipments: { select: { status: true } },
      cables: { select: { status: true } },
    },
  });

  const cards = events.map((event) => ({
    id: event.id,
    slug: event.slug,
    name: event.name,
    city: event.city,
    startsAt: event.startsAt,
    archived: event.archived,
    hasPlan: Boolean(event.planMimeType),
    summary: summarize(event.points, event.equipments, event.cables),
  }));

  return (
    <main className="app-shell">
      <TopBar session={session} subtitle="Todos os eventos" />

      <section className="page-heading">
        <div>
          <p className="eyebrow">Eventos</p>
          <h1>Instalações sob controle</h1>
          <p>
            Cada evento guarda a própria planta, seus APs, equipamentos e cabos. Crie o
            próximo do zero ou clone um anterior para começar já com a estrutura montada.
          </p>
        </div>
        <NewEventDialog
          events={cards.map((card) => ({ id: card.id, name: card.name }))}
        />
      </section>

      {cards.length === 0 ? (
        <div className="table-wrap p-8 text-center">
          <p className="font-medium">Nenhum evento cadastrado ainda.</p>
          <p className="micro mt-1">
            Comece criando um evento e subindo a planta do local.
          </p>
        </div>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={`/eventos/${card.slug}`}
              className="map-panel block p-4 transition-colors hover:border-[var(--color-ring)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{card.name}</h2>
                  <p className="micro flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                    {card.city ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} /> {card.city}
                      </span>
                    ) : null}
                    {card.startsAt ? (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} />
                        {card.startsAt.toLocaleDateString("pt-BR")}
                      </span>
                    ) : null}
                  </p>
                </div>
                {card.archived ? <span className="pill ok">Arquivado</span> : null}
              </div>

              <div className="completion mt-3 border-0 bg-transparent p-0">
                <div className="bar">
                  <span style={{ width: `${card.summary.activeRate}%` }} />
                </div>
                <b className="text-xs">{card.summary.activeRate}% ativos</b>
              </div>

              <dl className="micro mt-3 grid grid-cols-3 gap-2">
                <div>
                  <dt>APs</dt>
                  <dd className="text-[var(--color-foreground)]">
                    <b>{card.summary.points.active}</b> / {card.summary.points.total}
                  </dd>
                </div>
                <div>
                  <dt>Equipamentos</dt>
                  <dd className="text-[var(--color-foreground)]">
                    <b>{card.summary.equipments.online}</b> / {card.summary.equipments.total}
                  </dd>
                </div>
                <div>
                  <dt>Cabos</dt>
                  <dd className="text-[var(--color-foreground)]">
                    <b>{card.summary.cables.done}</b> / {card.summary.cables.total}
                  </dd>
                </div>
              </dl>

              {!card.hasPlan ? (
                <p className="micro mt-3 flex items-center gap-1 text-[var(--color-review)]">
                  <Plus size={12} /> Planta ainda não enviada
                </p>
              ) : null}
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
