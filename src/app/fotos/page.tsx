import Link from "next/link";
import { Camera } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FotosPage() {
  const photos = await prisma.galleryPhoto.findMany({
    orderBy: { createdAt: "desc" },
    take: 96,
    select: { id: true, caption: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-unifique">
          <Camera size={26} className="text-unifique-blue" /> Fotos
        </h1>
        <p className="mt-1 text-gray-600">Momentos dos nossos jogos e eventos.</p>
      </div>

      {photos.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">
          Nenhuma foto publicada ainda. Em breve os registros dos jogos aparecem aqui! 📸
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <a
              key={p.id}
              href={`/api/fotos/${p.id}`}
              target="_blank"
              rel="noopener"
              className="group relative block overflow-hidden rounded-2xl bg-white shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/fotos/${p.id}`}
                alt={p.caption || "Foto da Comissão de Esportes"}
                loading="lazy"
                className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-8 text-xs font-medium text-white">
                {p.caption ? `${p.caption} · ` : ""}
                {new Date(p.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </a>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Publicamos apenas fotos de pessoas que autorizaram o uso de imagem. Aparece em alguma foto
        e quer que ela seja removida? Fale com qualquer membro da comissão ou veja a{" "}
        <Link href="/privacidade" className="underline hover:text-unifique">
          política de privacidade
        </Link>
        .
      </p>
    </div>
  );
}
