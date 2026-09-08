import { notFound, redirect } from "next/navigation";
import { Cable, CircleCheck, MapPin, Server, TriangleAlert, Zap } from "lucide-react";
import { getSession } from "@/lib/auth";
import { loadEvent } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/TopBar";
import { ControlBoard } from "@/components/ControlBoard";
import { EventSettings } from "@/components/EventSettings";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug }, select: { name: true } });
  return { title: event?.name ?? "Evento" };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { slug } = await params;
  const loaded = await loadEvent(slug);
  if (!loaded) notFound();

  const { event, points, equipments, cables, summary } = loaded;

  const canUndo = Boolean(
    await prisma.changeLog.findFirst({
      where: { eventId: event.id, undone: false },
      select: { id: true },
    }),
  );

  return (
    <main className="app-shell">
      <TopBar session={session} subtitle={event.name}>
        <EventSettings
          event={{
            id: event.id,
            name: event.name,
            city: event.city,
            address: event.address,
            startsAt: event.startsAt ? event.startsAt.toISOString().slice(0, 10) : null,
            endsAt: event.endsAt ? event.endsAt.toISOString().slice(0, 10) : null,
            notes: event.notes,
            archived: event.archived,
          }}
          isAdmin={session.role === "admin"}
        />
      </TopBar>

      <section className="page-heading">
        <div>
          <p className="eyebrow">{event.name} · instalação</p>
          <h1>APs, equipamentos e cabos na planta do local</h1>
          <p>
            Posicione a infraestrutura principal e acompanhe o trajeto dos cabos até cada
            ponto de acesso.
          </p>
        </div>
        {event.city || event.address ? (
          <div className="site-label">
            <MapPin size={14} />
            {[event.city, event.address].filter(Boolean).join(" · ")}
          </div>
        ) : null}
      </section>

      <section className="stats">
        <article>
          <div className="stat-icon active">
            <Zap size={18} />
          </div>
          <div>
            <small>Pontos ativos</small>
            <strong>
              {summary.points.active} / {summary.points.total}
            </strong>
          </div>
        </article>

        <article>
          <div className="stat-icon cabled">
            <CircleCheck size={18} />
          </div>
          <div>
            <small>Cabo passado</small>
            <strong>
              {summary.points.cabled + summary.points.active} / {summary.points.total}
            </strong>
          </div>
        </article>

        <article>
          <div className="stat-icon pending">
            <TriangleAlert size={18} />
          </div>
          <div>
            <small>Pendentes</small>
            <strong>
              {summary.points.pending} / {summary.points.total}
            </strong>
          </div>
        </article>

        <article>
          <div className="stat-icon equipment">
            <Server size={18} />
          </div>
          <div>
            <small>Equipamentos principais</small>
            <strong>
              {summary.equipments.total} · {summary.equipments.online} em operação
            </strong>
          </div>
        </article>

        <article>
          <div className="stat-icon neutral">
            <Cable size={18} />
          </div>
          <div>
            <small>Cabos cadastrados</small>
            <strong>
              {summary.cables.total} · {summary.cables.done} executados
            </strong>
          </div>
        </article>
      </section>

      <section className="completion">
        <b>{summary.activeRate}% ativos</b>
        <div className="bar">
          <span style={{ width: `${summary.activeRate}%` }} />
        </div>
        <b>{summary.cabledRate}% com cabo passado ou ativos</b>
        <small>
          {summary.points.review} {summary.points.review === 1 ? "ponto aguarda" : "pontos aguardam"}{" "}
          conferência da posição
        </small>
      </section>

      <ControlBoard
        event={{
          id: event.id,
          slug: event.slug,
          name: event.name,
          city: event.city,
          address: event.address,
          hasPlan: Boolean(event.planMimeType),
          hasOriginal: Boolean(event.planOriginalMimeType),
        }}
        points={points.map((point) => ({
          id: point.id,
          number: point.number,
          name: point.name,
          sector: point.sector,
          status: point.status,
          x: point.x,
          y: point.y,
          positionChecked: point.positionChecked,
          owner: point.owner,
          notes: point.notes,
          updatedAt: point.updatedAt.toISOString(),
        }))}
        equipments={equipments.map((equipment) => ({
          id: equipment.id,
          number: equipment.number,
          name: equipment.name,
          sector: equipment.sector,
          kind: equipment.kind,
          status: equipment.status,
          x: equipment.x,
          y: equipment.y,
          positionChecked: equipment.positionChecked,
          owner: equipment.owner,
          notes: equipment.notes,
          updatedAt: equipment.updatedAt.toISOString(),
        }))}
        cables={cables.map((cable) => ({
          id: cable.id,
          number: cable.number,
          label: cable.label,
          kind: cable.kind,
          status: cable.status,
          fromEquipmentId: cable.fromEquipmentId,
          toPointId: cable.toPointId,
          path: cable.path,
          lengthMeters: cable.lengthMeters,
          owner: cable.owner,
          notes: cable.notes,
          updatedAt: cable.updatedAt.toISOString(),
        }))}
        canUndo={canUndo}
      />
    </main>
  );
}
