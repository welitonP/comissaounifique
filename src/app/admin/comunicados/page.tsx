import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAnnouncement, deleteAnnouncement } from "@/lib/actions";

export default async function AdminComunicadosPage() {
  await requireUserPage();
  const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-unifique-dark">Comunicados</h1>

      <form action={createAnnouncement} className="space-y-3 rounded-lg bg-white p-4 shadow-sm">
        <input
          name="title"
          placeholder="Título"
          required
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        <textarea
          name="body"
          placeholder="Mensagem"
          required
          rows={4}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark"
        >
          Publicar
        </button>
      </form>

      <div className="space-y-2">
        {announcements.map((a) => (
          <div key={a.id} className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{a.title}</h2>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{a.body}</p>
              </div>
              <form action={deleteAnnouncement}>
                <input type="hidden" name="id" value={a.id} />
                <button type="submit" className="text-sm text-red-600 hover:underline">
                  Remover
                </button>
              </form>
            </div>
          </div>
        ))}
        {announcements.length === 0 && <p className="text-gray-500">Nenhum comunicado publicado.</p>}
      </div>
    </div>
  );
}
