import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ComunicadosPage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-unifique-dark">Comunicados</h1>

      {announcements.length === 0 && (
        <p className="text-gray-500">Nenhum comunicado publicado ainda.</p>
      )}

      <div className="space-y-4">
        {announcements.map((a) => (
          <article key={a.id} className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-unifique-dark">{a.title}</h2>
            <p className="mt-1 text-xs text-gray-400">
              {new Date(a.createdAt).toLocaleString("pt-BR")}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-gray-700">{a.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
