import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/actions";

export const dynamic = "force-dynamic";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Intervalo da semana atual (segunda a domingo)
function thisWeekRange(): [Date, Date] {
  const now = startOfToday();
  const day = now.getDay(); // 0=dom
  const diffToMonday = (day + 6) % 7;
  const start = new Date(now);
  start.setDate(now.getDate() - diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return [start, end];
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const view = typeof params.view === "string" ? params.view : "proximos";
  const mes = typeof params.mes === "string" && params.mes ? Number(params.mes) : null;
  const ano = typeof params.ano === "string" && params.ano ? Number(params.ano) : null;
  const semana = params.semana === "esta";

  const [allEvents, modalities] = await Promise.all([
    prisma.calendarEvent.findMany({ orderBy: { date: "asc" }, include: { modality: true } }),
    prisma.modality.findMany({ orderBy: { name: "asc" } }),
  ]);

  const today = startOfToday();
  const anosDisponiveis = Array.from(
    new Set(allEvents.map((e) => new Date(e.date).getFullYear())),
  ).sort();

  // Filtragem
  let list = allEvents;
  if (semana) {
    const [ini, fim] = thisWeekRange();
    list = allEvents.filter((e) => {
      const d = new Date(e.date);
      return d >= ini && d < fim;
    });
  } else {
    if (view === "proximos") list = list.filter((e) => new Date(e.date) >= today);
    else if (view === "passados") list = list.filter((e) => new Date(e.date) < today);
    if (ano) list = list.filter((e) => new Date(e.date).getFullYear() === ano);
    if (mes) list = list.filter((e) => new Date(e.date).getMonth() + 1 === mes);
  }
  if (view === "passados" && !semana) {
    list = [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  const proximo =
    view === "proximos" && !semana && !mes && !ano ? list[0] : undefined;

  // Agrupar por dia
  const dias = new Map<string, typeof list>();
  for (const ev of list) {
    const d = new Date(ev.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!dias.has(key)) dias.set(key, []);
    dias.get(key)!.push(ev);
  }

  const tab = (value: string, label: string) => (
    <Link
      href={`/calendario?view=${value}`}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        view === value && !semana
          ? "bg-unifique text-white shadow"
          : "bg-white text-unifique hover:bg-unifique-light"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-unifique">Calendário</h1>
        <p className="mt-1 text-gray-600">Jogos e eventos da comissão.</p>
      </div>

      {/* Filtros */}
      <div className="space-y-3 rounded-xl bg-unifique-light/60 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {tab("proximos", "Próximos")}
          {tab("passados", "Passados")}
          {tab("todos", "Todos")}
          <Link
            href="/calendario?semana=esta"
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              semana ? "bg-unifique text-white shadow" : "bg-white text-unifique hover:bg-unifique-light"
            }`}
          >
            Esta semana
          </Link>
        </div>

        <form method="get" className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="view" value={semana ? "todos" : view} />
          <select
            name="mes"
            defaultValue={mes ?? ""}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">Todos os meses</option>
            {MESES.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            name="ano"
            defaultValue={ano ?? ""}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">Todos os anos</option>
            {anosDisponiveis.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded bg-unifique px-4 py-1.5 text-sm font-medium text-white hover:bg-unifique-dark"
          >
            Filtrar
          </button>
          <Link href="/calendario" className="text-sm text-gray-500 underline">
            Limpar
          </Link>
        </form>
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

      {proximo && (
        <section className="rounded-lg border-l-4 border-unifique-blue bg-white p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-unifique-blue">
            Próximo evento
          </h2>
          <p className="mt-1 text-lg font-bold">
            {new Date(proximo.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}{" "}
            — {proximo.title}
          </p>
          <p className="text-sm text-gray-500">
            {new Date(proximo.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            {proximo.location ? ` · ${proximo.location}` : ""}
          </p>
        </section>
      )}

      {list.length === 0 && (
        <p className="rounded-lg bg-white p-6 text-center text-gray-500 shadow-sm">
          Nenhum evento para este filtro.
        </p>
      )}

      {/* Dias */}
      <div className="space-y-4">
        {Array.from(dias.entries()).map(([key, evs]) => {
          const d = new Date(evs[0].date);
          const isPast = d < today;
          return (
            <section
              key={key}
              className={`overflow-hidden rounded-xl bg-white shadow-sm ${isPast ? "opacity-70" : ""}`}
            >
              <div className="flex items-center gap-3 border-b border-gray-100 bg-unifique-light/40 px-4 py-3">
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-unifique text-white">
                  <span className="text-lg font-bold leading-none">
                    {String(d.getDate()).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] uppercase">{DIAS_SEMANA[d.getDay()]}</span>
                </div>
                <div>
                  <p className="font-semibold text-unifique">
                    {d.getDate()} de {MESES[d.getMonth()]}
                  </p>
                  <p className="text-xs text-gray-500">{d.getFullYear()}</p>
                </div>
              </div>
              <ul className="divide-y divide-gray-50">
                {evs.map((ev) => (
                  <li key={ev.id} className="flex items-start gap-3 px-4 py-3">
                    <span className="mt-0.5 rounded bg-unifique-blue/10 px-2 py-0.5 text-sm font-semibold text-unifique-blue">
                      {new Date(ev.date).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{ev.title}</p>
                      <p className="text-sm text-gray-500">
                        {ev.modality ? ev.modality.name : ""}
                        {ev.location ? `${ev.modality ? " · " : ""}${ev.location}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
