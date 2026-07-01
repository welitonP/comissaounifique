import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EntreEmpresasPage() {
  const modalities = await prisma.modality.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { registrations: { orderBy: { companyName: "asc" } } },
  });

  const totalInscritos = modalities.reduce((sum, m) => sum + m.registrations.length, 0);

  return (
    <div className="space-y-8">
      <section className="rounded-lg bg-gradient-to-r from-unifique to-unifique-blue p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold">Entre Empresas</h1>
        <p className="mt-2 max-w-2xl text-white/90">
          O campeonato entre empresas da cidade — nosso carro-chefe do ano. Confira as
          modalidades, as empresas inscritas e as informações de cada esporte.
        </p>
        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <div>
            <span className="block text-2xl font-bold">{modalities.length}</span>
            modalidades
          </div>
          <div>
            <span className="block text-2xl font-bold">{totalInscritos}</span>
            inscritos
          </div>
        </div>
        <Link
          href="/calendario"
          className="mt-4 inline-block rounded bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25"
        >
          Ver calendário de jogos →
        </Link>
      </section>

      {modalities.length === 0 && (
        <p className="text-gray-500">Nenhuma modalidade cadastrada ainda.</p>
      )}

      <div className="space-y-6">
        {modalities.map((modality) => (
          <section key={modality.id} className="rounded-lg bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-bold text-unifique">{modality.name}</h2>
              <span className="rounded-full bg-unifique-light px-3 py-0.5 text-sm text-unifique">
                {modality.registrations.length} inscrito(s)
              </span>
            </div>

            {modality.description && (
              <p className="mt-1 text-gray-600">{modality.description}</p>
            )}

            {modality.info && (
              <div className="mt-3 rounded border border-unifique-blue/30 bg-unifique-light p-3 text-sm text-gray-700">
                <span className="font-semibold text-unifique">Informações: </span>
                <span className="whitespace-pre-wrap">{modality.info}</span>
              </div>
            )}

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-500">Empresas inscritas</h3>
              {modality.registrations.length === 0 ? (
                <p className="mt-1 text-sm text-gray-400">Nenhuma inscrição ainda.</p>
              ) : (
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {modality.registrations.map((reg) => (
                    <li
                      key={reg.id}
                      className="rounded border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{reg.companyName}</span>
                      {reg.responsible && (
                        <span className="block text-xs text-gray-500">
                          Responsável: {reg.responsible}
                          {reg.contact ? ` · ${reg.contact}` : ""}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
