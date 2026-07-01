import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/actions";

export const dynamic = "force-dynamic";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default async function CalendarioPage() {
  const [events, modalities] = await Promise.all([
    prisma.calendarEvent.findMany({
      orderBy: { date: "asc" },
      include: { modality: true },
    }),
    prisma.modality.findMany({ orderBy: { name: "asc" } }),
  ]);

  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.date) >= new Date(now.toDateString()));

  // Agrupar por "mês/ano"
  const groups = new Map<string, typeof events>();
  for (const ev of events) {
    const d = new Date(ev.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ev);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-unifique">Calendário</h1>
          <p className="mt-1 text-gray-600">Datas e horários de jogos e eventos da comissão.</p>
        </div>
      </div>

      <details className="rounded-lg bg-white p-4 shadow-sm">
        <summary className="cursor-pointer font-semibold text-unifique">
          + Adicionar evento ao calendário
        </summary>
        <form action={createCalendarEvent} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            name="title"
            placeholder="Título (ex: Rodada de Futsal)"
            required
            className="rounded border border-gray-300 px-3 py-2 sm:col-span-2"
          />
          <input
            type="datetime-local"
            name="date"
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
          <select name="modalityId" className="rounded border border-gray-300 px-3 py-2">
            <option value="">Sem modalidade</option>
            {modalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input
            name="location"
            placeholder="Local (opcional)"
            className="rounded border border-gray-300 px-3 py-2"
          />
          <input
            name="description"
            placeholder="Descrição (opcional)"
            className="rounded border border-gray-300 px-3 py-2"
          />
          <button
            type="submit"
            className="rounded bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark sm:col-span-2"
          >
            Adicionar
          </button>
        </form>
      </details>

      {upcoming.length > 0 && (
        <section className="rounded-lg border-l-4 border-unifique-blue bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-unifique-blue">
            Próximo evento
          </h2>
          <p className="mt-1 text-lg font-bold">
            {new Date(upcoming[0].date).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
            })}{" "}
            — {upcoming[0].title}
          </p>
          <p className="text-sm text-gray-500">
            {new Date(upcoming[0].date).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {upcoming[0].modality ? ` · ${upcoming[0].modality.name}` : ""}
            {upcoming[0].location ? ` · ${upcoming[0].location}` : ""}
          </p>
        </section>
      )}

      {events.length === 0 && <p className="text-gray-500">Nenhuma data cadastrada ainda.</p>}

      <div className="space-y-6">
        {Array.from(groups.entries()).map(([key, evs]) => {
          const [year, month] = key.split("-").map(Number);
          return (
            <section key={key} className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-bold text-unifique">
                {MESES[month]} de {year}
              </h2>
              <ul className="space-y-2">
                {evs.map((ev) => {
                  const d = new Date(ev.date);
                  const isPast = d < new Date(now.toDateString());
                  return (
                    <li
                      key={ev.id}
                      className={`flex items-start gap-4 rounded border border-gray-100 p-3 ${
                        isPast ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex w-14 flex-col items-center rounded bg-unifique px-2 py-1 text-white">
                        <span className="text-lg font-bold leading-none">
                          {String(d.getDate()).padStart(2, "0")}
                        </span>
                        <span className="text-[10px] uppercase">{DIAS_SEMANA[d.getDay()]}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{ev.title}</p>
                        <p className="text-sm text-gray-500">
                          {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          {ev.modality ? ` · ${ev.modality.name}` : ""}
                          {ev.location ? ` · ${ev.location}` : ""}
                        </p>
                        {ev.description && (
                          <p className="mt-1 text-sm text-gray-600">{ev.description}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
