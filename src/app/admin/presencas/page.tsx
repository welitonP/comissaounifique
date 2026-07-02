import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteRsvp } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminPresencasPage() {
  await requireUserPage();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const events = await prisma.calendarEvent.findMany({
    where: { rsvps: { some: {} } },
    orderBy: { date: "asc" },
    include: { rsvps: { orderBy: { createdAt: "asc" } } },
  });

  const futuros = events.filter((e) => new Date(e.date) >= now);
  const passados = events.filter((e) => new Date(e.date) < now).reverse();

  const Bloco = ({ lista }: { lista: typeof events }) => (
    <div className="space-y-4">
      {lista.map((ev) => {
        const vao = ev.rsvps.filter((r) => r.going);
        const naoVao = ev.rsvps.filter((r) => !r.going);
        return (
          <div key={ev.id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold text-unifique">{ev.title}</h3>
              <p className="text-sm text-gray-500">
                {new Date(ev.date).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {ev.location ? ` · ${ev.location}` : ""}
              </p>
            </div>
            <p className="mt-1 text-sm">
              <span className="font-semibold text-green-700">{vao.length} vão</span>
              {" · "}
              <span className="font-semibold text-red-600">{naoVao.length} não vão</span>
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                  Confirmados
                </p>
                <ul className="mt-1 space-y-1">
                  {vao.map((r) => (
                    <li key={r.id} className="flex items-center justify-between text-sm">
                      <span>{r.name}</span>
                      <form action={deleteRsvp}>
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" className="text-xs text-gray-400 hover:text-red-600">
                          remover
                        </button>
                      </form>
                    </li>
                  ))}
                  {vao.length === 0 && <li className="text-sm text-gray-400">—</li>}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                  Não vão
                </p>
                <ul className="mt-1 space-y-1">
                  {naoVao.map((r) => (
                    <li key={r.id} className="flex items-center justify-between text-sm">
                      <span>{r.name}</span>
                      <form action={deleteRsvp}>
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" className="text-xs text-gray-400 hover:text-red-600">
                          remover
                        </button>
                      </form>
                    </li>
                  ))}
                  {naoVao.length === 0 && <li className="text-sm text-gray-400">—</li>}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-unifique">Confirmações de presença</h1>
      <p className="text-sm text-gray-500">
        Quem confirmou presença em cada jogo/evento. Visível apenas para a comissão.
      </p>

      {events.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-gray-500 shadow-sm">
          Nenhuma confirmação recebida ainda.
        </p>
      )}

      {futuros.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-unifique">Próximos</h2>
          <Bloco lista={futuros} />
        </section>
      )}
      {passados.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-unifique">Já ocorridos</h2>
          <Bloco lista={passados} />
        </section>
      )}
    </div>
  );
}
