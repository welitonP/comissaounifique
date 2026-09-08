import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buttonClass } from "@/components/ui/button";
import { ENTITY_LABEL, type EntityKind } from "@/lib/types";
import { TopBar } from "@/components/TopBar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Histórico" };

const ACTION_LABEL: Record<string, string> = {
  create: "Cadastrou",
  update: "Alterou",
  delete: "Excluiu",
};

export default async function HistoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) notFound();

  const changes = await prisma.changeLog.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <main className="app-shell">
      <TopBar session={session} subtitle={`Histórico · ${event.name}`} />

      <section className="page-heading">
        <div>
          <p className="eyebrow">{event.name}</p>
          <h1>Histórico de alterações</h1>
          <p>As 300 alterações mais recentes, da mais nova para a mais antiga.</p>
        </div>
        <Link href={`/eventos/${event.slug}`} className={buttonClass("default", "md")}>
          <ArrowLeft size={15} /> Voltar ao mapa
        </Link>
      </section>

      <section className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Quando</th>
              <th scope="col">Quem</th>
              <th scope="col">O que</th>
              <th scope="col">Item</th>
              <th scope="col">Situação</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((change) => (
              <tr key={change.id}>
                <td className="whitespace-nowrap">
                  {change.createdAt.toLocaleString("pt-BR")}
                </td>
                <td>{change.author ?? "—"}</td>
                <td>
                  {ACTION_LABEL[change.action] ?? change.action}{" "}
                  {ENTITY_LABEL[change.entity as EntityKind] ?? change.entity}
                </td>
                <td>{change.summary}</td>
                <td>
                  {change.undone ? (
                    <span className="pill ok">Desfeito</span>
                  ) : (
                    <span className="pill active">Aplicado</span>
                  )}
                </td>
              </tr>
            ))}
            {changes.length === 0 ? (
              <tr>
                <td colSpan={5} className="micro">
                  Nenhuma alteração registrada ainda.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}
