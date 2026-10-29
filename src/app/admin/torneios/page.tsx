import Link from "next/link";
import { CalendarClock, ChevronLeft, ChevronRight, MapPin, Plus, Swords, Users } from "lucide-react";
import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDataHora } from "@/lib/datas";

export const dynamic = "force-dynamic";

export default async function AdminTorneiosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUserPage();
  const [params, torneios] = await Promise.all([
    searchParams,
    prisma.tournament.findMany({
      orderBy: [{ open: "desc" }, { date: "asc" }, { createdAt: "desc" }],
      // select explícito: a lista NÃO carrega os blobs (cartaz/regulamento).
      select: {
        id: true,
        slug: true,
        title: true,
        open: true,
        date: true,
        location: true,
        categories: true,
        photoMime: true,
        signups: { select: { category: true } },
      },
    }),
  ]);

  const abertos = torneios.filter((t) => t.open);
  const encerrados = torneios.filter((t) => !t.open);
  const totalInscritos = torneios.reduce((acc, t) => acc + t.signups.length, 0);

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm font-semibold text-unifique-blue hover:underline"
      >
        <ChevronLeft size={16} /> Gerenciar
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-unifique">Torneios internos</h1>
          <p className="text-sm text-gray-500">Crie torneios, acompanhe os inscritos e compartilhe o link.</p>
        </div>
        <Link
          href="/admin/torneios/novo"
          className="inline-flex items-center gap-2 rounded-xl bg-unifique px-4 py-2.5 font-display font-semibold text-white shadow transition hover:bg-unifique-dark"
        >
          <Plus size={18} /> Novo torneio
        </Link>
      </div>

      {params.ok === "excluido" && (
        <p className="rounded-xl bg-green-100 px-4 py-3 text-sm font-medium text-green-800">
          Torneio excluído.
        </p>
      )}

      {/* Números */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { valor: abertos.length, rotulo: "abertos" },
          { valor: encerrados.length, rotulo: "encerrados" },
          { valor: totalInscritos, rotulo: "inscritos no total" },
        ].map((n) => (
          <div key={n.rotulo} className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="font-display text-2xl font-extrabold text-unifique">{n.valor}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{n.rotulo}</p>
          </div>
        ))}
      </div>

      {torneios.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white px-6 py-14 text-center">
          <Swords size={34} className="mx-auto text-gray-300" />
          <p className="mt-2 font-display font-semibold text-gray-700">Nenhum torneio ainda</p>
          <p className="text-sm text-gray-500">Crie o primeiro e compartilhe o link com a galera.</p>
          <Link
            href="/admin/torneios/novo"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-unifique px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus size={16} /> Criar torneio
          </Link>
        </div>
      ) : (
        [
          { titulo: "Inscrições abertas", lista: abertos },
          { titulo: "Encerrados", lista: encerrados },
        ]
          .filter((g) => g.lista.length > 0)
          .map((g) => (
            <section key={g.titulo} className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">{g.titulo}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {g.lista.map((t) => {
                  const cats = (t.categories || "").split("\n").map((c) => c.trim()).filter(Boolean);
                  const porCategoria = cats.map((c) => ({
                    cat: c,
                    n: t.signups.filter((s) => s.category === c).length,
                  }));
                  return (
                    <Link
                      key={t.id}
                      href={`/admin/torneios/${t.id}`}
                      className={`group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-0.5 hover:shadow-md ${
                        t.open ? "" : "opacity-80"
                      }`}
                    >
                      <div className="relative h-28 bg-gradient-to-br from-unifique to-unifique-blue">
                        {t.photoMime ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={`/api/torneio-foto/${t.id}`} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Swords size={34} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/40" />
                        )}
                        <span
                          className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow ${
                            t.open ? "bg-green-500 text-white" : "bg-gray-700 text-white"
                          }`}
                        >
                          {t.open ? "Inscrições abertas" : "Encerrado"}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="truncate font-display text-lg font-bold text-unifique">{t.title}</h3>
                        <div className="mt-1 space-y-0.5 text-sm text-gray-500">
                          <p className="flex items-center gap-1.5">
                            <CalendarClock size={14} className="text-unifique-blue" />
                            {t.date ? fmtDataHora(t.date) : "Sem data definida"}
                          </p>
                          {t.location && (
                            <p className="flex items-center gap-1.5 truncate">
                              <MapPin size={14} className="text-unifique-blue" /> {t.location}
                            </p>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-unifique px-2.5 py-1 text-xs font-bold text-white">
                            <Users size={12} /> {t.signups.length} inscrito(s)
                          </span>
                          {porCategoria.map((c) => (
                            <span
                              key={c.cat}
                              className="rounded-full bg-unifique-light px-2.5 py-1 text-xs font-semibold text-unifique"
                            >
                              {c.cat}: {c.n}
                            </span>
                          ))}
                          <ChevronRight
                            size={18}
                            className="ml-auto text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-unifique"
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
      )}
    </div>
  );
}
