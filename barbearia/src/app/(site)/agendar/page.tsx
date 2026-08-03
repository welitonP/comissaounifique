import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import { carregarAgenda, diasComVaga, horariosLivresUnificados, proximosDias } from "@/lib/agenda";
import {
  DIAS_SEMANA_CURTO,
  diaSemanaDe,
  fmtDiaCurto,
  fmtDiaLongo,
  hojeISO,
  rotuloDia,
} from "@/lib/datas";
import { fmtPreco, iniciais } from "@/lib/formato";
import { agendarAction } from "@/lib/acoes-cliente";
import { IconeCheck, IconeRelogio, IconeSeta, IconeUsuario } from "@/components/Icones";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agendar horário" };

type Busca = {
  servico?: string;
  prof?: string;
  dia?: string;
  hora?: string;
  erro?: string;
};

// Monta o link do próximo (ou do passo anterior) preservando o que já foi escolhido.
function montarUrl(atual: Busca, mudanca: Partial<Busca>): string {
  const p = new URLSearchParams();
  const junto = { ...atual, ...mudanca, erro: undefined };
  for (const chave of ["servico", "prof", "dia", "hora"] as const) {
    const v = junto[chave];
    if (v) p.set(chave, v);
  }
  const q = p.toString();
  return q ? `/agendar?${q}` : "/agendar";
}

function Trilha({
  passo,
  busca,
  rotulos,
}: {
  passo: number;
  busca: Busca;
  rotulos: { servico?: string; prof?: string; horario?: string };
}) {
  const itens = [
    { n: 1, nome: "Serviço", valor: rotulos.servico, url: montarUrl(busca, { servico: undefined, prof: undefined, dia: undefined, hora: undefined }) },
    { n: 2, nome: "Profissional", valor: rotulos.prof, url: montarUrl(busca, { prof: undefined, dia: undefined, hora: undefined }) },
    { n: 3, nome: "Horário", valor: rotulos.horario, url: montarUrl(busca, { hora: undefined }) },
    { n: 4, nome: "Seus dados", valor: undefined, url: "#" },
  ];

  return (
    <ol className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs">
      {itens.map((i, idx) => {
        const concluido = i.n < passo;
        const atual = i.n === passo;
        return (
          <li key={i.n} className="flex items-center gap-2">
            {idx > 0 && <span className="text-barba-borda">·</span>}
            {concluido ? (
              <Link href={i.url} className="flex items-center gap-1.5 text-barba-ouro hover:underline">
                <IconeCheck className="h-3.5 w-3.5" />
                <span className="font-semibold">{i.valor || i.nome}</span>
              </Link>
            ) : (
              <span
                className={`flex items-center gap-1.5 ${
                  atual ? "font-semibold text-barba-creme" : "text-barba-cinza/50"
                }`}
              >
                <span
                  className={`grid h-4 w-4 place-items-center rounded-full text-[10px] ${
                    atual ? "bg-barba-ouro text-black" : "bg-barba-grafite text-barba-cinza"
                  }`}
                >
                  {i.n}
                </span>
                {i.nome}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default async function PaginaAgendar({
  searchParams,
}: {
  searchParams: Promise<Busca>;
}) {
  const busca = await searchParams;
  const config = await getConfig();

  const servico = busca.servico
    ? await prisma.servico.findUnique({ where: { id: busca.servico } })
    : null;

  const erro = busca.erro ? (
    <p className="mb-6 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
      {busca.erro}
    </p>
  ) : null;

  const moldura = (conteudo: React.ReactNode) => (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">{conteudo}</div>
  );

  // ===== Passo 1: escolher o serviço =====
  if (!servico || !servico.ativo) {
    const servicos = await prisma.servico.findMany({
      where: { ativo: true },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    });

    return moldura(
      <>
        <Trilha passo={1} busca={busca} rotulos={{}} />
        {erro}
        <h1 className="titulo text-3xl text-barba-creme">O que você vai fazer?</h1>
        <p className="mt-1 text-sm text-barba-cinza">Escolha o serviço para ver os horários.</p>

        <div className="mt-6 space-y-3">
          {servicos.map((s) => (
            <Link
              key={s.id}
              href={montarUrl(busca, { servico: s.id })}
              className="card surge flex items-center gap-4 transition hover:border-barba-ouro"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-barba-creme">{s.nome}</p>
                {s.descricao && <p className="mt-0.5 text-sm text-barba-cinza">{s.descricao}</p>}
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-barba-cinza">
                  <IconeRelogio className="h-3.5 w-3.5" /> {s.duracaoMin} min
                </p>
              </div>
              <div className="text-right">
                <p className="titulo text-lg text-barba-ouro">{fmtPreco(s.precoCentavos)}</p>
                <IconeSeta className="ml-auto mt-1 h-4 w-4 text-barba-cinza" />
              </div>
            </Link>
          ))}
        </div>
      </>,
    );
  }

  // Profissionais que fazem esse serviço.
  const profissionais = await prisma.profissional.findMany({
    where: { ativo: true, servicos: { some: { servicoId: servico.id } } },
    orderBy: [{ ordem: "asc" }, { nome: "asc" }],
  });

  // ===== Passo 2: escolher o profissional =====
  if (!busca.prof) {
    return moldura(
      <>
        <Trilha passo={2} busca={busca} rotulos={{ servico: servico.nome }} />
        {erro}
        <h1 className="titulo text-3xl text-barba-creme">Com quem você quer cortar?</h1>
        <p className="mt-1 text-sm text-barba-cinza">
          {servico.nome} · {servico.duracaoMin} min · {fmtPreco(servico.precoCentavos)}
        </p>

        <div className="mt-6 space-y-3">
          <Link
            href={montarUrl(busca, { prof: "qualquer" })}
            className="card surge flex items-center gap-4 transition hover:border-barba-ouro"
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-barba-ouro/40 bg-barba-grafite text-barba-ouro">
              <IconeUsuario />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-barba-creme">Tanto faz quem atende</p>
              <p className="text-sm text-barba-cinza">Mostra todos os horários livres da casa.</p>
            </div>
            <IconeSeta className="h-4 w-4 shrink-0 text-barba-cinza" />
          </Link>

          {profissionais.map((p) => (
            <Link
              key={p.id}
              href={montarUrl(busca, { prof: p.id })}
              className="card surge flex items-center gap-4 transition hover:border-barba-ouro"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-barba-ouro/40 bg-barba-grafite">
                <span className="titulo text-barba-ouro">{iniciais(p.nome)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-barba-creme">{p.apelido || p.nome}</p>
                {p.bio && <p className="truncate text-sm text-barba-cinza">{p.bio}</p>}
              </div>
              <IconeSeta className="h-4 w-4 shrink-0 text-barba-cinza" />
            </Link>
          ))}
        </div>
      </>,
    );
  }

  const profEscolhido =
    busca.prof === "qualquer" ? null : profissionais.find((p) => p.id === busca.prof) ?? null;
  const rotuloProf = profEscolhido ? profEscolhido.apelido || profEscolhido.nome : "Tanto faz";
  const idsConsiderados = profEscolhido ? [profEscolhido.id] : profissionais.map((p) => p.id);

  // ===== Passo 3: escolher dia e horário =====
  if (!busca.hora || !busca.dia) {
    const dias = proximosDias(hojeISO(), config.diasMax + 1);
    const ctx = await carregarAgenda(idsConsiderados, dias[0], dias[dias.length - 1], {
      passoMin: config.passoMin,
      antecedenciaMin: config.antecedenciaMin,
    });
    const comVaga = diasComVaga(ctx, idsConsiderados, dias, servico.duracaoMin);

    const diaSelecionado =
      busca.dia && comVaga.has(busca.dia)
        ? busca.dia
        : dias.find((d) => comVaga.has(d)) ?? dias[0];

    const horarios = [...horariosLivresUnificados(ctx, idsConsiderados, diaSelecionado, servico.duracaoMin).keys()];

    const periodos = [
      { nome: "Manhã", filtro: (h: string) => Number(h.slice(0, 2)) < 12 },
      { nome: "Tarde", filtro: (h: string) => Number(h.slice(0, 2)) >= 12 && Number(h.slice(0, 2)) < 18 },
      { nome: "Noite", filtro: (h: string) => Number(h.slice(0, 2)) >= 18 },
    ].map((p) => ({ ...p, lista: horarios.filter(p.filtro) }));

    return moldura(
      <>
        <Trilha passo={3} busca={busca} rotulos={{ servico: servico.nome, prof: rotuloProf }} />
        {erro}
        <h1 className="titulo text-3xl text-barba-creme">Quando fica bom?</h1>
        <p className="mt-1 text-sm text-barba-cinza">
          {servico.nome} · {rotuloProf} · {servico.duracaoMin} min
        </p>

        {/* Dias */}
        <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-2">
          {dias.map((d) => {
            const temVaga = comVaga.has(d);
            const ativo = d === diaSelecionado;
            const conteudo = (
              <>
                <span className="text-[11px] uppercase tracking-wider opacity-70">
                  {rotuloDia(d) === "Hoje" || rotuloDia(d) === "Amanhã"
                    ? rotuloDia(d)
                    : DIAS_SEMANA_CURTO[diaSemanaDe(d)]}
                </span>
                <span className="titulo text-lg leading-none">{fmtDiaCurto(d)}</span>
              </>
            );
            const classe = `flex min-w-[4.5rem] shrink-0 flex-col items-center gap-1 rounded-xl border px-3 py-2.5 transition ${
              ativo
                ? "border-barba-ouro bg-barba-ouro text-black"
                : temVaga
                  ? "border-barba-borda bg-barba-grafite text-barba-creme hover:border-barba-ouro"
                  : "cursor-not-allowed border-barba-borda/40 bg-barba-carvao text-barba-cinza/40"
            }`;

            return temVaga ? (
              <Link key={d} href={montarUrl(busca, { dia: d, hora: undefined })} className={classe}>
                {conteudo}
              </Link>
            ) : (
              <span key={d} className={classe} title="Sem horário livre">
                {conteudo}
              </span>
            );
          })}
        </div>

        {/* Horários */}
        <div className="mt-8">
          <h2 className="titulo text-lg text-barba-ouro">{fmtDiaLongo(diaSelecionado)}</h2>

          {horarios.length === 0 ? (
            <p className="card mt-4 text-sm text-barba-cinza">
              Nenhum horário livre nesse dia. Escolha outra data acima.
            </p>
          ) : (
            <div className="mt-4 space-y-5">
              {periodos
                .filter((p) => p.lista.length > 0)
                .map((p) => (
                  <div key={p.nome}>
                    <p className="rotulo">{p.nome}</p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {p.lista.map((h) => (
                        <Link
                          key={h}
                          href={montarUrl(busca, { dia: diaSelecionado, hora: h })}
                          className="horario surge"
                        >
                          {h}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </>,
    );
  }

  // ===== Passo 4: dados do cliente e confirmação =====
  return moldura(
    <>
      <Trilha
        passo={4}
        busca={busca}
        rotulos={{
          servico: servico.nome,
          prof: rotuloProf,
          horario: `${fmtDiaCurto(busca.dia)} ${busca.hora}`,
        }}
      />
      {erro}
      <h1 className="titulo text-3xl text-barba-creme">Confirmar agendamento</h1>

      <div className="card mt-6">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-barba-cinza">Serviço</dt>
            <dd className="font-semibold text-barba-creme">{servico.nome}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-barba-cinza">Profissional</dt>
            <dd className="font-semibold text-barba-creme">{rotuloProf}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-barba-cinza">Quando</dt>
            <dd className="text-right font-semibold text-barba-creme">
              {fmtDiaLongo(busca.dia)}
              <br />
              às {busca.hora}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-barba-borda/60 pt-3">
            <dt className="text-barba-cinza">Valor</dt>
            <dd className="titulo text-xl text-barba-ouro">{fmtPreco(servico.precoCentavos)}</dd>
          </div>
        </dl>
      </div>

      <form action={agendarAction} className="mt-6 space-y-4">
        <input type="hidden" name="servico" value={servico.id} />
        <input type="hidden" name="prof" value={busca.prof} />
        <input type="hidden" name="dia" value={busca.dia} />
        <input type="hidden" name="hora" value={busca.hora} />

        <div>
          <label className="rotulo" htmlFor="nome">
            Seu nome
          </label>
          <input id="nome" name="nome" className="campo" placeholder="Nome e sobrenome" required maxLength={120} />
        </div>

        <div>
          <label className="rotulo" htmlFor="telefone">
            WhatsApp
          </label>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            inputMode="numeric"
            className="campo"
            placeholder="(47) 99999-8888"
            required
          />
          <p className="mt-1 text-xs text-barba-cinza">
            É por onde a barbearia confirma e avisa se algo mudar.
          </p>
        </div>

        <div>
          <label className="rotulo" htmlFor="observacao">
            Alguma observação? (opcional)
          </label>
          <input
            id="observacao"
            name="observacao"
            className="campo"
            placeholder="Ex: máquina 2 dos lados"
            maxLength={300}
          />
        </div>

        <button type="submit" className="btn-ouro w-full py-4 text-base">
          <IconeCheck /> Confirmar horário
        </button>
        <p className="text-center text-xs text-barba-cinza">
          Você pode cancelar até {config.limiteCancelamentoH}h antes pelo próprio site.
        </p>
      </form>
    </>,
  );
}
