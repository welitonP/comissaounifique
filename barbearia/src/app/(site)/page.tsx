import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import { estaAberto, horarioFuncionamento } from "@/lib/funcionamento";
import { DIAS_SEMANA } from "@/lib/datas";
import { fmtPreco, iniciais, linkWhatsApp } from "@/lib/formato";
import { IconeCalendario, IconeLocal, IconeRelogio, IconeWhatsApp } from "@/components/Icones";

export const dynamic = "force-dynamic";

export default async function PaginaInicial() {
  const [config, servicos, profissionais, faixas] = await Promise.all([
    getConfig(),
    prisma.servico.findMany({
      where: { ativo: true },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    }),
    prisma.profissional.findMany({
      where: { ativo: true },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    }),
    horarioFuncionamento(),
  ]);

  const aberto = estaAberto(faixas);

  return (
    <div className="mx-auto w-full max-w-5xl px-4">
      {/* ===== Capa ===== */}
      <section className="surge py-12 text-center sm:py-20">
        <span
          className={`selo ${
            aberto ? "bg-green-500/15 text-green-400" : "bg-barba-grafite text-barba-cinza"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${aberto ? "bg-green-400" : "bg-barba-cinza"}`} />
          {aberto ? "Aberto agora" : "Fechado agora"}
        </span>

        <h1 className="titulo mt-5 text-5xl leading-none text-barba-creme sm:text-7xl">
          {config.nome}
        </h1>
        {config.slogan && (
          <p className="mx-auto mt-4 max-w-lg text-base text-barba-cinza">{config.slogan}</p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/agendar" className="btn-ouro px-8 py-4 text-base">
            <IconeCalendario /> Agendar horário
          </Link>
          {config.whatsapp && (
            <a
              href={linkWhatsApp(config.whatsapp, `Olá! Vim pelo site da ${config.nome}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-contorno px-6 py-4 text-base"
            >
              <IconeWhatsApp className="h-5 w-5 text-green-400" /> Falar no WhatsApp
            </a>
          )}
        </div>

        <p className="mt-6 text-xs text-barba-cinza">
          Escolha o serviço, o barbeiro e o horário. Leva menos de um minuto.
        </p>
      </section>

      {/* ===== Serviços ===== */}
      <section id="servicos" className="py-10">
        <h2 className="titulo text-2xl text-barba-ouro">Serviços</h2>
        <p className="mt-1 text-sm text-barba-cinza">Preços e duração de cada atendimento.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {servicos.map((s) => (
            <div key={s.id} className="card surge flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-barba-creme">
                    {s.nome}
                    {s.destaque && (
                      <span className="selo ml-2 bg-barba-ouro/15 text-barba-ouro">Mais pedido</span>
                    )}
                  </h3>
                  {s.descricao && (
                    <p className="mt-1 text-sm text-barba-cinza">{s.descricao}</p>
                  )}
                </div>
                <span className="titulo shrink-0 text-xl text-barba-ouro">
                  {fmtPreco(s.precoCentavos)}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-barba-borda/60 pt-3">
                <span className="flex items-center gap-1.5 text-xs text-barba-cinza">
                  <IconeRelogio className="h-4 w-4" /> {s.duracaoMin} min
                </span>
                <Link href={`/agendar?servico=${s.id}`} className="btn-mini">
                  Agendar
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Equipe ===== */}
      <section className="py-10">
        <h2 className="titulo text-2xl text-barba-ouro">Nossa equipe</h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {profissionais.map((p) => (
            <div key={p.id} className="card surge text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-barba-ouro/40 bg-barba-grafite">
                <span className="titulo text-lg text-barba-ouro">{iniciais(p.nome)}</span>
              </div>
              <h3 className="mt-3 font-semibold text-barba-creme">{p.apelido || p.nome}</h3>
              {p.bio && <p className="mt-1 text-sm text-barba-cinza">{p.bio}</p>}
              <Link href={`/agendar?prof=${p.id}`} className="btn-mini mt-4">
                Agendar com {p.apelido || p.nome}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Funcionamento e endereço ===== */}
      <section className="grid gap-4 py-10 sm:grid-cols-2">
        <div className="card">
          <h2 className="titulo flex items-center gap-2 text-lg text-barba-ouro">
            <IconeRelogio /> Funcionamento
          </h2>
          <ul className="mt-4 text-sm">
            {faixas.map((f, dia) => (
              <li key={dia} className="linha-tabela flex justify-between py-2">
                <span className="text-barba-cinza">{DIAS_SEMANA[dia]}</span>
                <span className={f ? "font-semibold text-barba-creme" : "text-barba-cinza/60"}>
                  {f ? `${f.inicio} às ${f.fim}` : "Fechado"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="titulo flex items-center gap-2 text-lg text-barba-ouro">
            <IconeLocal /> Onde estamos
          </h2>
          <p className="mt-4 text-sm text-barba-cinza">{config.endereco}</p>
          {config.mapsUrl && (
            <a
              href={config.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-contorno mt-4 w-full"
            >
              Ver no mapa
            </a>
          )}
          <Link href="/meus-agendamentos" className="btn-mini mt-4 w-full justify-center">
            Consultar meu agendamento
          </Link>
        </div>
      </section>
    </div>
  );
}
