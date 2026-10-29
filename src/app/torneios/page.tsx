import Link from "next/link";
import { Swords, MapPin, CalendarClock, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { fmtDataHora } from "@/lib/datas";
import TiltCard from "@/components/anim/TiltCard";

export const dynamic = "force-dynamic";

export default async function TorneiosPage() {
  const torneios = await prisma.tournament.findMany({
    orderBy: [{ open: "desc" }, { date: "asc" }, { createdAt: "desc" }],
    // Lista enxuta: NÃO carrega o blob da foto.
    select: {
      id: true,
      slug: true,
      title: true,
      location: true,
      date: true,
      open: true,
      photoMime: true,
      _count: { select: { signups: true } },
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="banner-vivo rounded-2xl bg-gradient-to-br from-unifique to-unifique-blue p-7 text-white shadow-md">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <Swords size={26} className="text-unifique-yellow" />
          </span>
          <div>
            <h1 className="text-2xl font-bold">Torneios internos</h1>
            <p className="text-sm text-white/85">Rachas e campeonatos da nossa comissão.</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/85">
          Toque em um torneio para ver os detalhes e se inscrever.
        </p>
      </section>

      {torneios.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">
          Nenhum torneio no momento. Fique de olho nos comunicados!
        </p>
      )}

      <div className="em-sequencia space-y-3">
        {torneios.map((t) => (
          <TiltCard key={t.id} className="rounded-2xl" max={3}>
          <Link
            href={`/torneios/${t.slug ?? t.id}`}
            className="group flex items-center gap-4 rounded-2xl bg-white p-3 shadow-sm transition hover:shadow-md"
          >
            {t.photoMime ? (
              <span className="h-20 w-20 flex-none overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/torneio-foto/${t.id}`}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </span>
            ) : (
              <span className="flex h-20 w-20 flex-none items-center justify-center rounded-xl bg-unifique-light">
                <Swords size={26} className="text-unifique transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              {t.open ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
                  <span className="anim-respirar h-1.5 w-1.5 rounded-full bg-green-500" />
                  Inscrições abertas
                </span>
              ) : (
                <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">
                  Encerrado
                </span>
              )}
              <h2 className="mt-1 line-clamp-2 font-display text-lg font-bold leading-snug text-unifique">{t.title}</h2>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                {t.date && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock size={15} className="text-unifique-blue" /> {fmtDataHora(t.date)}
                  </span>
                )}
                {t.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={15} className="text-unifique-blue" /> {t.location}
                  </span>
                )}
                <span className="font-medium text-unifique">{t._count.signups} inscrito(s)</span>
              </div>
            </div>
            <ChevronRight size={20} className="flex-none text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-unifique" />
          </Link>
          </TiltCard>
        ))}
      </div>
    </div>
  );
}
