import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createCalendarEvent, createRsvp } from "@/lib/actions";
import SuccessCelebration from "@/components/SuccessCelebration";
import ShareWhatsApp from "@/components/ShareWhatsApp";
import { partesDataBrasil, fmtHora, fmtDataHora } from "@/lib/datas";

export const dynamic = "force-dynamic";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MESES_CURTO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DIAS_CABECALHO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DIAS_POR_PAGINA = 8; // grupos de dia por página da lista

const pad = (n: number) => String(n).padStart(2, "0");

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  // "Hoje" no fuso de Brasília (o servidor roda em UTC)
  const { ano: hAno, mes: hMes, dia: hDia } = partesDataBrasil(new Date());
  const inicioHoje = new Date(`${hAno}-${pad(hMes)}-${pad(hDia)}T00:00:00-03:00`);

  // Mês/ano exibidos na grade (padrão: mês atual)
  const mes = typeof params.mes === "string" && params.mes ? Number(params.mes) : hMes;
  const ano = typeof params.ano === "string" && params.ano ? Number(params.ano) : hAno;

  // Só eventos de hoje em diante: o que já passou sai do calendário.
  const [upcoming, modalities, user] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { date: { gte: inicioHoje } },
      orderBy: { date: "asc" },
      include: {
        modality: true,
        _count: { select: { rsvps: { where: { going: true } } } },
      },
    }),
    prisma.modality.findMany({ orderBy: { name: "asc" } }),
    getCurrentUser(),
  ]);

  // Agrupa por dia (fuso de Brasília), já em ordem cronológica
  type Ev = (typeof upcoming)[number];
  const grupos: { ano: number; mes: number; dia: number; eventos: Ev[] }[] = [];
  for (const ev of upcoming) {
    const p = partesDataBrasil(ev.date);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.ano === p.ano && ultimo.mes === p.mes && ultimo.dia === p.dia) {
      ultimo.eventos.push(ev);
    } else {
      grupos.push({ ...p, eventos: [ev] });
    }
  }

  // Paginação da lista (por grupos de dia, para não cortar um dia no meio)
  const totalPaginas = Math.max(1, Math.ceil(grupos.length / DIAS_POR_PAGINA));
  const paginaBruta = Number(typeof params.pagina === "string" ? params.pagina : 1) || 1;
  const pagina = Math.min(Math.max(1, paginaBruta), totalPaginas);
  const gruposPagina = grupos.slice((pagina - 1) * DIAS_POR_PAGINA, pagina * DIAS_POR_PAGINA);

  // Dias do mês exibido que têm evento futuro → em que página da lista ele está
  const porDia = new Map<number, { eventos: Ev[]; pagina: number }>();
  grupos.forEach((g, idx) => {
    if (g.ano === ano && g.mes === mes) {
      porDia.set(g.dia, { eventos: g.eventos, pagina: Math.floor(idx / DIAS_POR_PAGINA) + 1 });
    }
  });

  // Grade do mês
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const offset = new Date(ano, mes - 1, 1).getDay(); // 0=dom
  const celulas: (number | null)[] = [];
  for (let i = 0; i < offset; i++) celulas.push(null);
  for (let d = 1; d <= diasNoMes; d++) celulas.push(d);
  while (celulas.length % 7 !== 0) celulas.push(null);

  const prevMes = mes === 1 ? 12 : mes - 1;
  const prevAno = mes === 1 ? ano - 1 : ano;
  const nextMes = mes === 12 ? 1 : mes + 1;
  const nextAno = mes === 12 ? ano + 1 : ano;

  const isHoje = (dia: number) => dia === hDia && mes === hMes && ano === hAno;
  const jaPassou = (dia: number) =>
    ano < hAno || (ano === hAno && (mes < hMes || (mes === hMes && dia < hDia)));

  // "É hoje!", "Amanhã", "em X dias"
  const faltamDias = (g: { ano: number; mes: number; dia: number }) =>
    Math.round(
      (Date.UTC(g.ano, g.mes - 1, g.dia) - Date.UTC(hAno, hMes - 1, hDia)) / 86400000,
    );

  const linkLista = (p: number) => `/calendario?mes=${mes}&ano=${ano}&pagina=${p}#proximos`;

  const rsvp = typeof params.rsvp === "string" ? params.rsvp : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-unifique">
          <CalendarDays size={26} className="text-unifique-blue" /> Calendário
        </h1>
        <p className="mt-1 text-gray-600">Jogos e eventos da comissão.</p>
      </div>

      <SuccessCelebration active={rsvp === "ok"} message="Presença confirmada! Obrigado por avisar." />
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
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between bg-gradient-to-r from-unifique to-unifique-blue px-4 py-3 text-white">
          <Link
            href={`/calendario?mes=${prevMes}&ano=${prevAno}&pagina=${pagina}`}
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/15"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={20} />
          </Link>
          <h2 className="font-display text-lg font-bold">
            {MESES[mes - 1]} de {ano}
          </h2>
          <Link
            href={`/calendario?mes=${nextMes}&ano=${nextAno}&pagina=${pagina}`}
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/15"
            aria-label="Próximo mês"
          >
            <ChevronRight size={20} />
          </Link>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-7 gap-1">
            {DIAS_CABECALHO.map((d) => (
              <div key={d} className="pb-1 text-center text-xs font-semibold text-gray-400">
                <span className="sm:hidden">{d[0]}</span>
                <span className="hidden sm:inline">{d}</span>
              </div>
            ))}
            {celulas.map((dia, i) => {
              if (dia === null) return <div key={i} className="min-h-[54px] sm:min-h-[92px]" />;

              const info = porDia.get(dia);
              const temEvento = !!info;
              const passado = jaPassou(dia);

              const base = `block min-h-[54px] rounded-xl border p-1 transition sm:min-h-[92px] ${
                isHoje(dia)
                  ? "border-unifique-blue bg-unifique-blue/10 ring-1 ring-unifique-blue"
                  : temEvento
                    ? "border-unifique-blue/30 bg-unifique-light/60 hover:-translate-y-0.5 hover:bg-unifique-blue/10 hover:shadow"
                    : "border-gray-100"
              }`;

              const conteudo = (
                <>
                  <div className="flex justify-end">
                    <span
                      className={`text-xs font-semibold ${
                        isHoje(dia)
                          ? "flex h-5 w-5 items-center justify-center rounded-full bg-unifique-blue text-white"
                          : temEvento
                            ? "text-unifique"
                            : passado
                              ? "text-gray-300"
                              : "text-gray-400"
                      }`}
                    >
                      {dia}
                    </span>
                  </div>

                  {/* Mobile: bolinhas indicando eventos */}
                  <div className="mt-1 flex flex-wrap justify-center gap-0.5 sm:hidden">
                    {(info?.eventos ?? []).slice(0, 4).map((ev) => (
                      <span key={ev.id} className="h-1.5 w-1.5 rounded-full bg-unifique-blue" />
                    ))}
                  </div>

                  {/* Desktop: etiquetas com texto */}
                  <div className="mt-1 hidden space-y-0.5 sm:block">
                    {(info?.eventos ?? []).slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className="truncate rounded bg-unifique px-1 py-0.5 text-[10px] font-medium leading-tight text-white"
                      >
                        {fmtHora(ev.date)} {ev.title}
                      </div>
                    ))}
                    {info && info.eventos.length > 3 && (
                      <div className="text-[10px] font-medium text-unifique-blue">
                        +{info.eventos.length - 3} mais
                      </div>
                    )}
                  </div>
                </>
              );

              // Dia com evento leva direto ao card dele na lista (na página certa)
              return temEvento ? (
                <Link
                  key={i}
                  href={`/calendario?mes=${mes}&ano=${ano}&pagina=${info!.pagina}#dia-${ano}-${mes}-${dia}`}
                  className={base}
                >
                  {conteudo}
                </Link>
              ) : (
                <div key={i} className={base}>
                  {conteudo}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <Link
              href={`/calendario?mes=${hMes}&ano=${hAno}&pagina=${pagina}`}
              className="rounded-lg bg-unifique-light px-3 py-1.5 font-medium text-unifique hover:bg-unifique-blue/10"
            >
              Hoje
            </Link>
            <form method="get" className="flex items-center gap-2">
              <input type="hidden" name="pagina" value={pagina} />
              <select
                name="mes"
                defaultValue={mes}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
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
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              >
                {[ano - 1, ano, ano + 1, hAno]
                  .filter((v, idx, arr) => arr.indexOf(v) === idx)
                  .sort()
                  .map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
              </select>
              <button
                type="submit"
                className="rounded-lg bg-unifique px-3 py-1.5 font-medium text-white hover:bg-unifique-dark"
              >
                Ir
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Próximos eventos (paginado) */}
      <section id="proximos" className="scroll-mt-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-unifique">Próximos eventos</h2>
          {upcoming.length > 0 && (
            <span className="rounded-full bg-unifique-light px-3 py-1 text-xs font-semibold text-unifique">
              {upcoming.length} evento(s)
            </span>
          )}
        </div>

        {gruposPagina.length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
            Nenhum evento agendado por enquanto. Em breve tem novidade! 🏆
          </p>
        ) : (
          <div className="space-y-3">
            {gruposPagina.map((g) => {
              const faltam = faltamDias(g);
              const primeiro = g.eventos[0];
              const semana = new Date(primeiro.date).toLocaleDateString("pt-BR", {
                timeZone: "America/Sao_Paulo",
                weekday: "long",
              });

              return (
                <div
                  key={`${g.ano}-${g.mes}-${g.dia}`}
                  id={`dia-${g.ano}-${g.mes}-${g.dia}`}
                  className="scroll-mt-4 overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-center gap-3 border-b border-gray-100 bg-unifique-light/40 px-4 py-2.5">
                    <div className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-unifique text-white shadow-sm">
                      <span className="text-base font-bold leading-none">{g.dia}</span>
                      <span className="text-[10px] font-semibold uppercase leading-tight">
                        {MESES_CURTO[g.mes - 1]}
                      </span>
                    </div>
                    <p className="flex-1 font-semibold capitalize text-unifique">{semana}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        faltam === 0
                          ? "bg-unifique-yellow text-unifique-dark"
                          : faltam === 1
                            ? "bg-unifique-blue text-white"
                            : "bg-unifique-light text-unifique"
                      }`}
                    >
                      {faltam === 0 ? "É hoje! 🔥" : faltam === 1 ? "Amanhã" : `em ${faltam} dias`}
                    </span>
                  </div>

                  <ul className="divide-y divide-gray-50">
                    {g.eventos.map((ev) => (
                      <li key={ev.id} className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <span className="rounded-lg bg-unifique-blue/10 px-2 py-1 text-sm font-bold text-unifique-blue">
                            {fmtHora(ev.date)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-800">{ev.title}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                              {ev.modality && (
                                <span className="rounded-full bg-unifique/10 px-2 py-0.5 text-xs font-semibold text-unifique">
                                  {ev.modality.name}
                                </span>
                              )}
                              {ev.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={14} className="text-unifique-blue" /> {ev.location}
                                </span>
                              )}
                              {ev._count.rsvps > 0 && (
                                <span className="flex items-center gap-1 font-medium text-green-700">
                                  <Users size={14} /> {ev._count.rsvps} confirmado(s)
                                </span>
                              )}
                            </div>
                            {ev.description && (
                              <p className="mt-1 text-sm text-gray-500">{ev.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <details>
                            <summary className="cursor-pointer text-xs font-semibold text-unifique-blue">
                              ✅ Confirmar presença
                            </summary>
                            <form action={createRsvp} className="mt-2 flex flex-wrap items-center gap-2">
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
                          <ShareWhatsApp
                            text={`🏆 ${ev.title}\n📅 ${fmtDataHora(ev.date)}${
                              ev.location ? `\n📍 ${ev.location}` : ""
                            }`}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#25D366]/10 px-2.5 py-1 text-xs font-semibold text-[#128C4B] transition hover:bg-[#25D366]/20"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {/* Paginação */}
        {totalPaginas > 1 && (
          <nav className="mt-5 flex flex-wrap items-center justify-center gap-1.5" aria-label="Páginas de eventos">
            {pagina > 1 && (
              <Link
                href={linkLista(pagina - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-unifique shadow-sm hover:bg-unifique-light"
                aria-label="Página anterior"
              >
                <ChevronLeft size={18} />
              </Link>
            )}
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={linkLista(p)}
                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold shadow-sm transition ${
                  p === pagina
                    ? "bg-unifique text-white"
                    : "bg-white text-unifique hover:bg-unifique-light"
                }`}
                aria-current={p === pagina ? "page" : undefined}
              >
                {p}
              </Link>
            ))}
            {pagina < totalPaginas && (
              <Link
                href={linkLista(pagina + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-unifique shadow-sm hover:bg-unifique-light"
                aria-label="Próxima página"
              >
                <ChevronRight size={18} />
              </Link>
            )}
          </nav>
        )}
      </section>

      {/* Adicionar evento (somente comissão) */}
      {user && (
        <details className="rounded-2xl bg-white p-4 shadow-sm">
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
