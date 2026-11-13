import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addGalleryPhotos, deleteGalleryPhoto } from "@/lib/actions";
import PhotoField from "@/components/PhotoField";
import ConfirmButton from "@/components/ConfirmButton";
import AdminTopo from "@/components/admin/AdminTopo";
import Campo from "@/components/admin/Campo";

export const dynamic = "force-dynamic";

export default async function AdminFotosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUserPage();
  const params = await searchParams;
  const photos = await prisma.galleryPhoto.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, caption: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <AdminTopo titulo="Fotos" />
        <p className="mt-1 text-gray-600">
          Galeria pública com os momentos dos jogos e eventos.
        </p>
      </div>

      {params.sucesso === "1" && (
        <p className="aviso-ok">
          Fotos publicadas na galeria! 🎉
        </p>
      )}
      {params.erro === "sem-foto" && (
        <p className="aviso-erro">
          Selecione ao menos uma foto para publicar.
        </p>
      )}
      {params.erro === "muitas-fotos" && (
        <p className="aviso-erro">
          Máximo de 4 fotos por envio. Publique em mais de uma leva se precisar.
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

      <form action={addGalleryPhotos} className="cartao space-y-3">
        <h2 className="cartao-titulo">Publicar fotos</h2>
        <Campo rotulo="Legenda" opcional>
          <input
            name="caption"
            placeholder="Ex: Futsal · jogo contra a Viacredi"
            className="campo"
          />
        </Campo>
        <PhotoField />
        <button
          type="submit"
          className="btn-primario"
        >
          Publicar na galeria
        </button>
      </form>

      {photos.length === 0 ? (
        <p className="vazio">Nenhuma foto publicada ainda.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/fotos/${p.id}`}
                alt={p.caption || ""}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
              <div className="flex items-center justify-between gap-2 p-2">
                <p className="min-w-0 truncate text-xs text-gray-500">
                  {p.caption || new Date(p.createdAt).toLocaleDateString("pt-BR")}
                </p>
                <form action={deleteGalleryPhoto}>
                  <input type="hidden" name="id" value={p.id} />
                  <ConfirmButton
                    message="Excluir esta foto da galeria? Não dá para desfazer."
                    className="shrink-0 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400"
                  >
                    Excluir
                  </ConfirmButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
