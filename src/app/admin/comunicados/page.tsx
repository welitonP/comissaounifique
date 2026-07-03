import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAnnouncement, deleteAnnouncement } from "@/lib/actions";
import AnnouncementAIComposer from "@/components/AnnouncementAIComposer";

export const dynamic = "force-dynamic";

export default async function AdminComunicadosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUserPage();
  const params = await searchParams;
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    include: { images: { select: { id: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-unifique">Comunicados</h1>

      {params.sucesso === "1" && (
        <p className="rounded-xl bg-green-100 px-4 py-3 text-sm font-medium text-green-800">
          Comunicado publicado! 🎉
        </p>
      )}
      {params.erro === "muitas-fotos" && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
          Máximo de 4 fotos por comunicado.
        </p>
      )}
      {params.erro === "foto-grande" && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
          Cada foto pode ter no máximo 2MB (e 4MB no total). Diminua/comprima as imagens.
        </p>
      )}
      {params.erro === "foto-formato" && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
          Formato de imagem não suportado. Use JPG, PNG, WebP ou GIF.
        </p>
      )}

      <AnnouncementAIComposer />

      <form action={createAnnouncement} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-unifique">Novo comunicado</h2>
        <input
          name="title"
          placeholder="Título"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <textarea
          name="body"
          placeholder="Mensagem"
          required
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <div>
          <label className="block text-sm font-semibold text-gray-700">
            Fotos <span className="font-normal text-gray-400">(opcional · até 4, máx 2MB cada)</span>
          </label>
          <input
            type="file"
            name="photos"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="mt-1 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-unifique file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
          />
          <p className="mt-1 text-xs text-gray-400">
            LGPD: publique fotos apenas de pessoas que autorizaram o uso de imagem.
          </p>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark"
        >
          Publicar
        </button>
      </form>

      <div className="space-y-2">
        {announcements.map((a) => (
          <div key={a.id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h2 className="font-semibold">{a.title}</h2>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{a.body}</p>
                {a.images.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {a.images.map((img) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={img.id}
                        src={`/api/imagens/${img.id}`}
                        alt=""
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ))}
                  </div>
                )}
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
