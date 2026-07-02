import { Megaphone } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ComunicadosPage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    include: { images: { select: { id: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-unifique text-white">
          <Megaphone size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-unifique">Comunicados</h1>
          <p className="text-sm text-gray-500">Avisos e novidades da comissão.</p>
        </div>
      </div>

      {announcements.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-gray-500 shadow-sm">
          Nenhum comunicado publicado ainda.
        </p>
      )}

      <div className="space-y-5">
        {announcements.map((a) => {
          const [capa, ...resto] = a.images;
          return (
            <article key={a.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {capa && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`/api/imagens/${capa.id}`}
                  alt={a.title}
                  className="max-h-80 w-full object-cover"
                />
              )}
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-unifique-blue">
                  {new Date(a.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <h2 className="mt-1 text-lg font-bold text-unifique">{a.title}</h2>
                <p className="mt-2 whitespace-pre-wrap text-gray-700">{a.body}</p>
                {resto.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {resto.map((img) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={img.id}
                        src={`/api/imagens/${img.id}`}
                        alt=""
                        className="h-24 w-24 rounded-xl object-cover sm:h-28 sm:w-28"
                      />
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
