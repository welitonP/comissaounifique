import Link from "next/link";
import { prisma } from "@/lib/prisma";

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default async function MembersMarquee() {
  const membros = await prisma.commissionMember.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  if (membros.length === 0) return null;

  // Para o loop ser contínuo (sem vazio ao final), cada "metade" da faixa
  // precisa ser larga o bastante para cobrir a tela. Repetimos os membros até
  // ter um bom número e então duplicamos: a animação desliza exatamente uma
  // metade (-50%), então volta ao início sem emenda.
  const MIN_POR_METADE = 12;
  let metade = [...membros];
  while (metade.length < MIN_POR_METADE) metade = [...metade, ...membros];
  const loop = [...metade, ...metade];

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-unifique">Nossa comissão</h2>
        <Link
          href="/comissao"
          className="text-sm font-semibold text-unifique-blue hover:underline"
        >
          Conhecer todos
        </Link>
      </div>

      <div className="marquee-container overflow-hidden rounded-2xl bg-white py-6 shadow-sm">
        <div className="animate-marquee flex w-max gap-8">
          {loop.map((m, i) => (
            <div key={`${m.id}-${i}`} className="flex w-20 flex-shrink-0 flex-col items-center">
              {m.photoMime ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`/api/comissao-foto/${m.id}`}
                  alt={m.name}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-unifique-light"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-unifique text-lg font-bold text-white">
                  {iniciais(m.name)}
                </div>
              )}
              <span className="mt-2 line-clamp-2 text-center text-xs font-medium text-gray-600">
                {m.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
