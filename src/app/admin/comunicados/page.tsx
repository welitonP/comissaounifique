import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAnnouncement } from "@/lib/actions";
import AnnouncementAIComposer from "@/components/AnnouncementAIComposer";
import PhotoField from "@/components/PhotoField";
import AnnouncementRow from "@/components/AnnouncementRow";
import AdminTopo from "@/components/admin/AdminTopo";
import Campo from "@/components/admin/Campo";

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
      <AdminTopo titulo="Comunicados" />

      {params.sucesso === "1" && (
        <p className="aviso-ok">
          Comunicado publicado! 🎉
        </p>
      )}
      {params.sucesso === "editado" && (
        <p className="aviso-ok">
          Comunicado atualizado com sucesso.
        </p>
      )}
      {params.erro === "muitas-fotos" && (
        <p className="aviso-erro">
          Máximo de 4 fotos por comunicado.
        </p>
      )}
      {params.erro === "foto-grande" && (
        <p className="aviso-erro">
          Cada foto pode ter no máximo 2MB (e 4MB no total). Diminua/comprima as imagens.
        </p>
      )}
      {params.erro === "foto-formato" && (
        <p className="aviso-erro">
          Formato de imagem não suportado. Use JPG, PNG, WebP ou GIF.
        </p>
      )}

      <AnnouncementAIComposer />

      <form action={createAnnouncement} className="cartao space-y-3">
        <h2 className="cartao-titulo">Novo comunicado</h2>
        <Campo rotulo="Título">
          <input
            name="title"
            required
            className="campo"
          />
        </Campo>
        <Campo rotulo="Mensagem">
          <textarea
            name="body"
            required
            rows={4}
            className="campo"
          />
        </Campo>
        <PhotoField />
        <button
          type="submit"
          className="btn-primario"
        >
          Publicar
        </button>
      </form>

      <div className="space-y-2">
        {announcements.map((a) => (
          <AnnouncementRow key={a.id} announcement={a} />
        ))}
        {announcements.length === 0 && <p className="vazio">Nenhum comunicado publicado.</p>}
      </div>
    </div>
  );
}
