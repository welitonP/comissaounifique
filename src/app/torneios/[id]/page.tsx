import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, CalendarClock, Lock, ChevronLeft, Share2, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createTournamentSignup } from "@/lib/actions";
import { fmtDataHora } from "@/lib/datas";
import SuccessCelebration from "@/components/SuccessCelebration";
import ShareLink from "@/components/ShareLink";
import AddToCalendar from "@/components/AddToCalendar";
import RulesModal from "@/components/RulesModal";
import { temColunasArquivoRegulamento } from "@/lib/schema-check";
import PhoneInput from "@/components/form/PhoneInput";
import SubmitButton from "@/components/form/SubmitButton";
import RememberMe from "@/components/form/RememberMe";
import ScrollIntoView from "@/components/form/ScrollIntoView";
import StickyCta from "@/components/StickyCta";
import AnimatedCheck from "@/components/anim/AnimatedCheck";
import CountUp from "@/components/CountUp";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: ref } = await params;
  const t = await prisma.tournament.findFirst({
    where: { OR: [{ slug: ref }, { id: ref }] },
    select: { id: true, slug: true, title: true, description: true, date: true, location: true, photoMime: true },
  });
  if (!t) return { title: "Torneio" };

  const quando = t.date ? fmtDataHora(t.date) : null;
  const descricao =
    t.description?.trim() ||
    [quando ? `Quando: ${quando}` : null, t.location ? `Local: ${t.location}` : null]
      .filter(Boolean)
      .join(" · ") ||
    "Torneio interno da Comissão de Esportes Unifique. Inscreva-se!";

  // Se o torneio tem cartaz, usa ele no preview; senão, o preview padrão do site.
  const imagem = t.photoMime ? `/api/torneio-foto/${t.id}` : undefined;
  const url = `/torneios/${t.slug ?? t.id}`;

  return {
    title: t.title,
    description: descricao,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: t.title,
      description: descricao,
      url,
      ...(imagem ? { images: [{ url: imagem, alt: `Cartaz do ${t.title}` }] } : {}),
    },
    twitter: {
      card: imagem ? "summary_large_image" : "summary",
      title: t.title,
      description: descricao,
      ...(imagem ? { images: [imagem] } : {}),
    },
  };
}

export default async function TorneioDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ id: ref }, sp, comArquivo] = await Promise.all([
    params,
    searchParams,
    temColunasArquivoRegulamento(),
  ]);
  const t = await prisma.tournament.findFirst({
    where: { OR: [{ slug: ref }, { id: ref }] },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      location: true,
      date: true,
      open: true,
      questions: true,
      categories: true,
      rules: true,
      ...(comArquivo ? { rulesMime: true, rulesName: true } : {}),
      photoMime: true,
      _count: { select: { signups: true } },
    },
  });
  if (!t) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Link
          href="/torneios"
          className="inline-flex items-center gap-1 text-sm font-semibold text-unifique-blue hover:underline"
        >
          <ChevronLeft size={16} /> Todos os torneios
        </Link>
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="font-display text-lg font-bold text-unifique">Torneio não encontrado</p>
          <p className="mt-1 text-sm text-gray-500">
            Esse torneio pode ter sido removido ou o link está incorreto.
          </p>
          <Link
            href="/torneios"
            className="mt-4 inline-block rounded-xl bg-unifique px-4 py-2 text-sm font-semibold text-white hover:bg-unifique-dark"
          >
            Ver torneios
          </Link>
        </div>
      </div>
    );
  }

  const perguntas = (t.questions || "").split("\n").map((p) => p.trim()).filter(Boolean);
  const categorias = (t.categories || "").split("\n").map((c) => c.trim()).filter(Boolean);
  const arquivo = t as { rulesMime?: string | null; rulesName?: string | null };
  const regulamentoUrl = arquivo.rulesMime ? `/api/torneio-regulamento/${t.id}` : null;
  const temRegulamento = !!(t.rules || regulamentoUrl);

  // Links de "adicionar à agenda" (só quando o torneio tem data).
  let googleHref: string | null = null;
  let outlookHref: string | null = null;
  if (t.date) {
    const inicio = new Date(t.date);
    const fim = new Date(inicio.getTime() + 2 * 60 * 60 * 1000);
    const fmtUTC = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const detalhes = t.description?.trim() || "Torneio da Comissão de Esportes Unifique.";

    // Google Agenda (abre o Google Calendar já preenchido)
    const g = new URLSearchParams({
      action: "TEMPLATE",
      text: t.title,
      dates: `${fmtUTC(inicio)}/${fmtUTC(fim)}`,
      details: detalhes,
      ...(t.location ? { location: t.location } : {}),
    });
    googleHref = `https://calendar.google.com/calendar/render?${g.toString()}`;

    // Outlook / Microsoft 365 (abre a agenda do Outlook já preenchida)
    const o = new URLSearchParams({
      path: "/calendar/action/compose",
      rru: "addevent",
      subject: t.title,
      startdt: inicio.toISOString(),
      enddt: fim.toISOString(),
      body: detalhes,
      ...(t.location ? { location: t.location } : {}),
    });
    outlookHref = `https://outlook.office.com/calendar/0/deeplink/compose?${o.toString()}`;
  }

  const ok = sp.ok === "1";
  const caminho = `/torneios/${t.slug ?? t.id}`;
  const erroMsg: Record<string, string> = {
    "ja-inscrito": "Você já está inscrito neste torneio (mesmo nome ou WhatsApp). É uma inscrição por pessoa.",
    dados: "Preencha seu nome e WhatsApp para se inscrever.",
    fechado: "As inscrições deste torneio foram encerradas.",
    categoria: "Escolha a sua categoria para se inscrever.",
  };
  const erro = typeof sp.erro === "string" ? erroMsg[sp.erro] : undefined;
  const campo =
    "mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base focus:border-unifique focus:outline-none focus:ring-2 focus:ring-unifique/15 dark:border-white/15 dark:bg-gray-800 dark:text-white";

  const compartilharEAgenda = (
    <>
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <Share2 size={13} /> Chame a galera
        </p>
        <ShareLink path={caminho} message={`🏆 ${t.title} · Comissão de Esportes Unifique`} />
      </div>
      {googleHref && outlookHref && (
        <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/10">
          <AddToCalendar googleHref={googleHref} outlookHref={outlookHref} />
        </div>
      )}
    </>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-20 sm:pb-0">
      <Link
        href="/torneios"
        className="inline-flex items-center gap-1 text-sm font-semibold text-unifique-blue hover:underline"
      >
        <ChevronLeft size={16} /> Todos os torneios
      </Link>

      <SuccessCelebration active={ok} message="Inscrição confirmada! Bom jogo!" />

      {/* Informações do torneio */}
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-900">
        {t.photoMime && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <div className="max-h-80 overflow-hidden">
            <img
              src={`/api/torneio-foto/${t.id}`}
              alt={`Cartaz do ${t.title}`}
              className="zoom-lento max-h-80 w-full object-cover"
            />
          </div>
        )}
        <div className="p-5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              t.open
                ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
            }`}
          >
            {t.open && <span className="anim-respirar h-1.5 w-1.5 rounded-full bg-green-500" />}
            {t.open ? "Inscrições abertas" : "Inscrições encerradas"}
          </span>
          <h1 className="mt-2 font-display text-2xl font-bold text-unifique sm:text-3xl dark:text-white">{t.title}</h1>
          {t.description && (
            <p className="mt-2 whitespace-pre-wrap text-gray-600 dark:text-gray-300">{t.description}</p>
          )}
          <div className="em-sequencia mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-xl bg-unifique-light/70 px-3 py-2.5 text-gray-700 dark:bg-white/5 dark:text-gray-300">
              <CalendarClock size={18} className="flex-none text-unifique-blue" />
              <span>{t.date ? fmtDataHora(t.date) : "Data a definir"}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-unifique-light/70 px-3 py-2.5 text-gray-700 dark:bg-white/5 dark:text-gray-300">
              <MapPin size={18} className="flex-none text-unifique-blue" />
              <span>{t.location || "Local a definir"}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-unifique-light/70 px-3 py-2.5 font-semibold text-unifique dark:bg-white/5 dark:text-unifique-blue">
              <Users size={18} className="flex-none text-unifique-blue" />
              <span>
                <CountUp value={t._count.signups} /> inscrito(s)
              </span>
            </div>
          </div>

          {temRegulamento && (
            <div className="mt-4">
              <RulesModal
                title={t.title}
                text={t.rules}
                fileUrl={regulamentoUrl}
                fileMime={arquivo.rulesMime ?? null}
                fileName={arquivo.rulesName ?? null}
              />
            </div>
          )}
        </div>
      </section>

      {/* Inscrição */}
      <section id="inscricao" className="scroll-mt-24 overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-900">
        {ok ? (
          <ScrollIntoView className="p-6">
            <div className="text-center">
              <AnimatedCheck size={72} />
              <h2 className="mt-3 font-display text-2xl font-bold text-unifique dark:text-white">Inscrição confirmada!</h2>
              <p className="mt-1 text-gray-600 dark:text-gray-300">
                Você está na lista do <strong>{t.title}</strong>. Se precisar, a comissão chama no seu WhatsApp.
              </p>
            </div>
            <div className="mt-6 rounded-2xl border border-gray-100 p-4 dark:border-white/10">{compartilharEAgenda}</div>
            <div className="mt-4 text-center">
              <Link href={`${caminho}#inscricao`} className="text-sm font-semibold text-unifique-blue hover:underline">
                Inscrever outra pessoa
              </Link>
            </div>
          </ScrollIntoView>
        ) : t.open ? (
          <form action={createTournamentSignup} className="space-y-4 p-5">
            <input type="hidden" name="tournamentId" value={t.id} />
            {/* honeypot */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <div>
              <h2 className="font-display text-xl font-bold text-unifique dark:text-white">Quero participar</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Leva menos de 1 minuto.</p>
            </div>

            {erro && (
              <ScrollIntoView>
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">{erro}</p>
              </ScrollIntoView>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Nome completo <span className="text-unifique-blue">*</span>
              </label>
              <input name="name" required maxLength={100} autoComplete="name" className={campo} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                WhatsApp <span className="text-unifique-blue">*</span>
              </label>
              <PhoneInput className={campo} />
            </div>

            {categorias.length > 0 && (
              <fieldset>
                <legend className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Categoria <span className="text-unifique-blue">*</span>
                </legend>
                <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {categorias.map((c) => (
                    <label key={c} className="cursor-pointer">
                      <input type="radio" name="category" value={c} required className="peer sr-only" />
                      <span className="block rounded-xl border-2 border-gray-200 px-3 py-3 text-center font-semibold text-gray-700 transition peer-checked:animate-[pulinho_0.3s_ease-out] peer-checked:border-unifique peer-checked:bg-unifique peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-unifique/30 dark:border-white/15 dark:text-gray-200">
                        {c}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {perguntas.map((pergunta, i) => (
              <div key={i}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {pergunta} <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <input name={`q_${i}`} maxLength={200} className={campo} />
              </div>
            ))}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Observação <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <input name="note" maxLength={200} placeholder="Algo que a comissão precise saber" className={campo} />
            </div>

            <RememberMe />

            {temRegulamento && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ao se inscrever, você declara que leu o{" "}
                <RulesModal
                  variant="link"
                  title={t.title}
                  text={t.rules}
                  fileUrl={regulamentoUrl}
                  fileMime={arquivo.rulesMime ?? null}
                  fileName={arquivo.rulesName ?? null}
                />{" "}
                do torneio.
              </p>
            )}
            <SubmitButton className="btn-brilho w-full rounded-xl bg-unifique py-3.5 font-display text-lg font-semibold text-white shadow transition hover:bg-unifique-dark">
              Confirmar inscrição
            </SubmitButton>
          </form>
        ) : (
          <div className="flex items-center gap-3 p-5 text-gray-500 dark:text-gray-400">
            <Lock size={20} className="flex-none" />
            <p>As inscrições deste torneio estão encerradas.</p>
          </div>
        )}
      </section>

      {!ok && <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">{compartilharEAgenda}</section>}

      {t.open && !ok && <StickyCta targetId="inscricao">Quero participar</StickyCta>}
    </div>
  );
}
