import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, CalendarClock, Lock, ChevronLeft, Share2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createTournamentSignup } from "@/lib/actions";
import { fmtDataHora } from "@/lib/datas";
import SuccessCelebration from "@/components/SuccessCelebration";
import ShareLink from "@/components/ShareLink";
import AddToCalendar from "@/components/AddToCalendar";

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
  const [{ id: ref }, sp] = await Promise.all([params, searchParams]);
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

  // Links de "adicionar à agenda" (só quando o torneio tem data).
  let icsHref: string | null = null;
  let googleHref: string | null = null;
  let outlookHref: string | null = null;
  if (t.date) {
    const inicio = new Date(t.date);
    const fim = new Date(inicio.getTime() + 2 * 60 * 60 * 1000);
    const fmtUTC = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const detalhes = t.description?.trim() || "Torneio da Comissão de Esportes Unifique.";
    icsHref = `/api/ics/torneio/${t.slug ?? t.id}`;

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

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/torneios"
        className="inline-flex items-center gap-1 text-sm font-semibold text-unifique-blue hover:underline"
      >
        <ChevronLeft size={16} /> Todos os torneios
      </Link>

      <SuccessCelebration active={sp.ok === "1"} message="Inscrição finalizada! Bom jogo!" />
      {sp.ok === "1" && (
        <p className="rounded-xl bg-green-100 px-4 py-3 text-sm font-medium text-green-800">
          ✅ Inscrição finalizada com sucesso! Você está confirmado. Nos vemos no jogo!
        </p>
      )}
      {sp.erro === "ja-inscrito" && (
        <p className="rounded-xl bg-yellow-100 px-4 py-3 text-sm text-yellow-800">
          Você já está inscrito neste torneio (mesmo nome ou telefone). Uma inscrição por pessoa.
        </p>
      )}
      {sp.erro === "dados" && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
          Preencha seu nome e telefone (WhatsApp) para se inscrever.
        </p>
      )}
      {sp.erro === "fechado" && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
          As inscrições deste torneio foram encerradas.
        </p>
      )}

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {t.photoMime && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/api/torneio-foto/${t.id}`}
            alt={`Cartaz do ${t.title}`}
            className="max-h-80 w-full object-cover"
          />
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-2xl font-bold text-unifique">{t.title}</h1>
            {t.open ? (
              <span className="whitespace-nowrap rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Inscrições abertas
              </span>
            ) : (
              <span className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                Encerrado
              </span>
            )}
          </div>
          {t.description && (
            <p className="mt-2 whitespace-pre-wrap text-gray-600">{t.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
            {t.date && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock size={16} className="text-unifique-blue" /> {fmtDataHora(t.date)}
              </span>
            )}
            {t.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={16} className="text-unifique-blue" /> {t.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 font-medium text-unifique">
              {t._count.signups} inscrito(s)
            </span>
          </div>

          {/* Compartilhar este torneio */}
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <Share2 size={13} /> Compartilhar este torneio
            </p>
            <ShareLink path={`/torneios/${t.slug ?? t.id}`} message={`🏆 ${t.title} · Comissão de Esportes Unifique`} />
          </div>

          {/* Adicionar à agenda (só quando tem data) */}
          {icsHref && googleHref && outlookHref && (
            <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/10">
              <AddToCalendar icsHref={icsHref} googleHref={googleHref} outlookHref={outlookHref} />
            </div>
          )}
        </div>

        {t.open ? (
          <form action={createTournamentSignup} className="space-y-3 border-t border-gray-100 p-5">
            <input type="hidden" name="tournamentId" value={t.id} />
            {/* honeypot */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />
            <p className="font-display font-semibold text-unifique">Fazer inscrição</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Nome <span className="text-unifique-blue">*</span>
                </label>
                <input
                  name="name"
                  required
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-unifique focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Telefone (WhatsApp) <span className="text-unifique-blue">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  inputMode="tel"
                  placeholder="(47) 90000-0000"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-unifique focus:outline-none"
                />
              </div>
            </div>
            {perguntas.map((pergunta, i) => (
              <div key={i}>
                <label className="block text-sm font-semibold text-gray-700">
                  {pergunta} <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <input
                  name={`q_${i}`}
                  maxLength={200}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-unifique focus:outline-none"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Observação <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <input
                name="note"
                placeholder="Algo que a comissão precise saber"
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-unifique focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-unifique py-3 font-display font-semibold text-white shadow transition hover:bg-unifique-dark"
            >
              Quero participar
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2 border-t border-gray-100 p-5 text-sm text-gray-500">
            <Lock size={16} /> Inscrições encerradas para este torneio.
          </div>
        )}
      </section>
    </div>
  );
}
