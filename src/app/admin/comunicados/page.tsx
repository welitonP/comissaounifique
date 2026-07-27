import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAnnouncement } from "@/lib/actions";
import AnnouncementAIComposer from "@/components/AnnouncementAIComposer";
import PhotoField from "@/components/PhotoField";
import AnnouncementRow from "@/components/AnnouncementRow";

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
      {params.sucesso === "editado" && (
        <p className="rounded-xl bg-green-100 px-4 py-3 text-sm font-medium text-green-800">
          Comunicado atualizado com sucesso.
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
        <PhotoField />
        <button
          type="submit"
          className="rounded-lg bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark"
        >
          Publicar
        </button>
      </form>

      <div className="space-y-2">
        {announcements.map((a) => (
          <AnnouncementRow key={a.id} announcement={a} />
        ))}
        {announcements.length === 0 && <p className="text-gray-500">Nenhum comunicado publicado.</p>}
      </div>
    </div>
  );
}
