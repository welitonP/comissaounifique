import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addGalleryPhotos, deleteGalleryPhoto } from "@/lib/actions";
import PhotoField from "@/components/PhotoField";

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
        <h1 className="text-2xl font-bold text-unifique">Fotos</h1>
        <p className="mt-1 text-gray-600">
          Galeria pública com os momentos dos jogos e eventos.
        </p>
      </div>

      {params.sucesso === "1" && (
        <p className="rounded-xl bg-green-100 px-4 py-3 text-sm font-medium text-green-800">
          Fotos publicadas na galeria! 🎉
        </p>
      )}
      {params.erro === "sem-foto" && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
          Selecione ao menos uma foto para publicar.
        </p>
      )}
      {params.erro === "muitas-fotos" && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
          Máximo de 4 fotos por envio. Publique em mais de uma leva se precisar.
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

      <form action={addGalleryPhotos} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-unifique">Publicar fotos</h2>
        <input
          name="caption"
          placeholder="Legenda (opcional) — ex: Futsal · jogo contra a Viacredi"
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <PhotoField />
        <button
          type="submit"
          className="rounded bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark"
        >
          Publicar na galeria
        </button>
      </form>

      {photos.length === 0 ? (
        <p className="text-gray-500">Nenhuma foto publicada ainda.</p>
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
                  <button
                    type="submit"
                    className="shrink-0 rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                  >
                    Excluir
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
