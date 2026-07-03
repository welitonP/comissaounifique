import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createCalendarEvent, createRsvp } from "@/lib/actions";

export const dynamic = "force-dynamic";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DIAS_CABECALHO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const today = startOfToday();

  // Mês/ano exibidos (padrão: mês atual)
  const mes = typeof params.mes === "string" && params.mes ? Number(params.mes) : today.getMonth() + 1;
  const ano = typeof params.ano === "string" && params.ano ? Number(params.ano) : today.getFullYear();

  const [allEvents, modalities, user] = await Promise.all([
    prisma.calendarEvent.findMany({ orderBy: { date: "asc" }, include: { modality: true } }),
    prisma.modality.findMany({ orderBy: { name: "asc" } }),
    getCurrentUser(),
  ]);

  // Eventos do mês exibido, agrupados por dia
  const porDia = new Map<number, typeof allEvents>();
  for (const ev of allEvents) {
    const d = new Date(ev.date);
    if (d.getFullYear() === ano && d.getMonth() + 1 === mes) {
      const dia = d.getDate();
      if (!porDia.has(dia)) porDia.set(dia, []);
      porDia.get(dia)!.push(ev);
    }
  }

  // Montagem da grade
  const primeiroDia = new Date(ano, mes - 1, 1);
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const offset = primeiroDia.getDay(); // 0=dom
  const celulas: (number | null)[] = [];
  for (let i = 0; i < offset; i++) celulas.push(null);
  for (let d = 1; d <= diasNoMes; d++) celulas.push(d);
  while (celulas.length % 7 !== 0) celulas.push(null);

  // Navegação de mês
  const prevMes = mes === 1 ? 12 : mes - 1;
  const prevAno = mes === 1 ? ano - 1 : ano;
  const nextMes = mes === 12 ? 1 : mes + 1;
  const nextAno = mes === 12 ? ano + 1 : ano;

  const isHoje = (dia: number) =>
    dia === today.getDate() && mes === today.getMonth() + 1 && ano === today.getFullYear();

  // Lista dos eventos do mês (abaixo da grade)
  const eventosDoMes = Array.from(porDia.entries()).sort((a, b) => a[0] - b[0]);

  const rsvp = typeof params.rsvp === "string" ? params.rsvp : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-unifique">Calendário</h1>
        <p className="mt-1 text-gray-600">Jogos e eventos da comissão.</p>
      </div>

      {rsvp === "ok" && (
        <p className="rounded-xl bg-green-100 px-4 py-3 text-sm font-medium text-green-800">
          Presença confirmada! Obrigado por avisar.
        </p>
      )}
      {rsvp === "ja" && (
        <p className="rounded-xl bg-yellow-100 px-4 py-3 text-sm text-yellow-800">
          Você já confirmou presença neste evento.
        </p>
      )}

      {/* Grade do mês */}
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href={`/calendario?mes=${prevMes}&ano=${prevAno}`}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-unifique hover:bg-unifique-light"
            aria-label="Mês anterior"
          >
            ◀
          </Link>
          <h2 className="text-lg font-bold text-unifique">
            {MESES[mes - 1]} de {ano}
          </h2>
          <Link
            href={`/calendario?mes=${nextMes}&ano=${nextAno}`}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-unifique hover:bg-unifique-light"
            aria-label="Próximo mês"
          >
            ▶
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {DIAS_CABECALHO.map((d) => (
            <div key={d} className="pb-1 text-center text-xs font-semibold text-gray-400">
              <span className="sm:hidden">{d[0]}</span>
              <span className="hidden sm:inline">{d}</span>
            </div>
          ))}
          {celulas.map((dia, i) => {
            const eventos = dia ? porDia.get(dia) ?? [] : [];
            const temEvento = eventos.length > 0;

            const base = `block min-h-[54px] rounded-lg border p-1 sm:min-h-[92px] ${
              dia === null
                ? "border-transparent"
                : isHoje(dia)
                  ? "border-unifique-blue bg-unifique-blue/10"
                  : temEvento
                    ? "border-unifique-blue/30 bg-unifique-light/50"
                    : "border-gray-100"
            }`;

            if (dia === null) return <div key={i} className={base} />;

            const conteudo = (
              <>
                <div className="flex justify-end">
                  <span
                    className={`text-xs font-semibold ${
                      isHoje(dia)
                        ? "flex h-5 w-5 items-center justify-center rounded-full bg-unifique-blue text-white"
                        : temEvento
                          ? "text-unifique"
                          : "text-gray-400"
                    }`}
                  >
                    {dia}
                  </span>
                </div>

                {/* Mobile: bolinhas indicando eventos */}
                <div className="mt-1 flex flex-wrap justify-center gap-0.5 sm:hidden">
                  {eventos.slice(0, 4).map((ev) => (
                    <span key={ev.id} className="h-1.5 w-1.5 rounded-full bg-unifique-blue" />
                  ))}
                </div>

                {/* Desktop: etiquetas com texto */}
                <div className="mt-1 hidden space-y-0.5 sm:block">
                  {eventos.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      className="truncate rounded bg-unifique px-1 py-0.5 text-[10px] font-medium leading-tight text-white"
                    >
                      {new Date(ev.date).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      {ev.title}
                    </div>
                  ))}
                  {eventos.length > 3 && (
                    <div className="text-[10px] font-medium text-unifique-blue">
                      +{eventos.length - 3} mais
                    </div>
                  )}
                </div>
              </>
            );

            // Dia com evento vira link para os detalhes abaixo (ótimo no mobile)
            return temEvento ? (
              <a key={i} href={`#dia-${dia}`} className={base}>
                {conteudo}
              </a>
            ) : (
              <div key={i} className={base}>
                {conteudo}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <Link
            href={`/calendario?mes=${today.getMonth() + 1}&ano=${today.getFullYear()}`}
            className="rounded bg-unifique-light px-3 py-1 font-medium text-unifique hover:bg-unifique-blue/10"
          >
            Hoje
          </Link>
          {/* Ir para um mês específico */}
          <form method="get" className="flex items-center gap-2">
            <select
              name="mes"
              defaultValue={mes}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              name="ano"
              defaultValue={ano}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              {[ano - 1, ano, ano + 1, today.getFullYear()].filter((v, idx, arr) => arr.indexOf(v) === idx)
                .sort()
                .map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
            </select>
            <button
              type="submit"
              className="rounded bg-unifique px-3 py-1 font-medium text-white hover:bg-unifique-dark"
            >
              Ir
            </button>
          </form>
        </div>
      </section>

      {/* Detalhes dos eventos do mês */}
      <section>
        <h2 className="mb-3 font-bold text-unifique">
          Eventos de {MESES[mes - 1]}
        </h2>
        {eventosDoMes.length === 0 ? (
          <p className="rounded-lg bg-white p-6 text-center text-gray-500 shadow-sm">
            Nenhum evento neste mês.
          </p>
        ) : (
          <div className="space-y-3">
            {eventosDoMes.map(([dia, evs]) => {
              const d = new Date(evs[0].date);
              const past = d < today;
              return (
                <div
                  key={dia}
                  id={`dia-${dia}`}
                  className={`scroll-mt-4 overflow-hidden rounded-xl bg-white shadow-sm ${past ? "opacity-70" : ""}`}
                >
                  <div className="flex items-center gap-3 border-b border-gray-100 bg-unifique-light/40 px-4 py-2">
                    <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-unifique text-white">
                      <span className="text-base font-bold leading-none">{dia}</span>
                    </div>
                    <p className="font-semibold text-unifique">
                      {dia} de {MESES[mes - 1]} · {DIAS_CABECALHO[d.getDay()]}
                    </p>
                  </div>
                  <ul className="divide-y divide-gray-50">
                    {evs.map((ev) => (
                      <li key={ev.id} className="px-4 py-2.5">
                        <div className="flex items-start gap-3">
                          <span className="rounded bg-unifique-blue/10 px-2 py-0.5 text-sm font-semibold text-unifique-blue">
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
                        </div>

                        {!past && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs font-semibold text-unifique-blue">
                              Confirmar presença
                            </summary>
                            <form
                              action={createRsvp}
                              className="mt-2 flex flex-wrap items-center gap-2"
                            >
                              <input type="hidden" name="eventId" value={ev.id} />
                              {/* honeypot anti-spam (invisível) */}
                              <input
                                type="text"
                                name="website"
                                tabIndex={-1}
                                autoComplete="off"
                                className="hidden"
                                aria-hidden="true"
                              />
                              <input
                                name="name"
                                required
                                placeholder="Seu nome"
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                              />
                              <button
                                type="submit"
                                name="going"
                                value="1"
                                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                              >
                                Vou
                              </button>
                              <button
                                type="submit"
                                name="going"
                                value="0"
                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                              >
                                Não vou
                              </button>
                            </form>
                          </details>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Adicionar evento (somente comissão) */}
      {user && (
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
      )}
    </div>
  );
}
