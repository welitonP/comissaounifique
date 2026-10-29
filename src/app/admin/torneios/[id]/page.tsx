import Link from "next/link";
import {
  CalendarClock,
  ChevronLeft,
  Download,
  ExternalLink,
  FileText,
  Lock,
  MapPin,
  Pencil,
  Swords,
  Trash2,
  Unlock,
  Users,
} from "lucide-react";
import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleTournament, deleteTournament } from "@/lib/actions";
import { fmtDataHora, toInputLocal } from "@/lib/datas";
import ConfirmButton from "@/components/ConfirmButton";
import ShareLink from "@/components/ShareLink";
import TournamentForm from "@/components/TournamentForm";
import AdminSignupList, { type AdminSignup } from "@/components/AdminSignupList";

export const dynamic = "force-dynamic";

const ERROS: Record<string, string> = {
  titulo: "O torneio precisa de um título.",
  foto: "O cartaz precisa ser uma imagem (JPG, PNG ou WEBP) de até 2 MB.",
  regulamento: "O arquivo do regulamento precisa ser PDF ou imagem, de até 3 MB.",
};

function parseAnswers(raw: string | null): [string, string][] {
  if (!raw) return [];
  try {
    return Object.entries(JSON.parse(raw) as Record<string, string>);
  } catch {
    return [];
  }
}

export default async function AdminTorneioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUserPage();
  const [{ id }, sp] = await Promise.all([params, searchParams]);

  const t = await prisma.tournament.findUnique({
    where: { id },
    // sem os blobs (cartaz/regulamento): só os metadados.
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
      rulesMime: true,
      rulesName: true,
      photoMime: true,
      signups: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, phone: true, category: true, note: true, answers: true, createdAt: true },
      },
    },
  });

  if (!t) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Link href="/admin/torneios" className="inline-flex items-center gap-1 text-sm font-semibold text-unifique-blue hover:underline">
          <ChevronLeft size={16} /> Torneios
        </Link>
        <p className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">Torneio não encontrado.</p>
      </div>
    );
  }

  const aba = sp.aba === "editar" ? "editar" : "inscritos";
  const msgErro = typeof sp.erro === "string" ? ERROS[sp.erro] : undefined;
  const cats = (t.categories || "").split("\n").map((c) => c.trim()).filter(Boolean);
  const caminhoPublico = `/torneios/${t.slug ?? t.id}`;

  const signups: AdminSignup[] = t.signups.map((s) => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    category: s.category,
    note: s.note,
    answers: parseAnswers(s.answers),
    createdAt: fmtDataHora(s.createdAt),
  }));

  const contadores = [
    { rotulo: "Total", n: signups.length, destaque: true },
    ...cats.map((c) => ({ rotulo: c, n: signups.filter((s) => s.category === c).length, destaque: false })),
  ];

  const abaClasse = (ativa: boolean) =>
    `inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
      ativa ? "border-unifique text-unifique" : "border-transparent text-gray-500 hover:text-unifique"
    }`;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/admin/torneios" className="inline-flex items-center gap-1 text-sm font-semibold text-unifique-blue hover:underline">
        <ChevronLeft size={16} /> Torneios
      </Link>

      {sp.ok === "criado" && (
        <p className="rounded-xl bg-green-100 px-4 py-3 text-sm font-medium text-green-800">
          Torneio criado! Agora é só compartilhar o link abaixo.
        </p>
      )}
      {sp.ok === "editado" && (
        <p className="rounded-xl bg-green-100 px-4 py-3 text-sm font-medium text-green-800">
          Alterações salvas.
        </p>
      )}
      {msgErro && <p className="rounded-xl bg-red-100 px-4 py-3 text-sm font-medium text-red-700">{msgErro}</p>}

      {/* Cabeçalho do torneio */}
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="relative h-36 bg-gradient-to-br from-unifique to-unifique-blue sm:h-44">
          {t.photoMime ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={`/api/torneio-foto/${t.id}`} alt="" className="h-full w-full object-cover" />
          ) : (
            <Swords size={44} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                t.open ? "bg-green-500 text-white" : "bg-gray-700 text-white"
              }`}
            >
              {t.open ? "Inscrições abertas" : "Inscrições encerradas"}
            </span>
            <h1 className="mt-1.5 font-display text-2xl font-bold text-white drop-shadow sm:text-3xl">{t.title}</h1>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock size={15} className="text-unifique-blue" />
              {t.date ? fmtDataHora(t.date) : "Sem data definida"}
            </span>
            {t.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} className="text-unifique-blue" /> {t.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <FileText size={15} className="text-unifique-blue" />
              {t.rules || t.rulesMime ? "Regulamento publicado" : "Sem regulamento"}
            </span>
          </div>

          {/* Ações */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={caminhoPublico}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink size={15} /> Ver página
            </a>
            <form action={toggleTournament}>
              <input type="hidden" name="id" value={t.id} />
              <button
                type="submit"
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold ${
                  t.open
                    ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                    : "border border-green-300 bg-green-50 text-green-800 hover:bg-green-100"
                }`}
              >
                {t.open ? <Lock size={15} /> : <Unlock size={15} />}
                {t.open ? "Encerrar inscrições" : "Reabrir inscrições"}
              </button>
            </form>
            <form action={deleteTournament} className="ml-auto">
              <input type="hidden" name="id" value={t.id} />
              <ConfirmButton
                message={`Excluir o torneio "${t.title}" e todas as ${signups.length} inscrições? Não dá pra desfazer.`}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 size={15} /> Excluir
              </ConfirmButton>
            </form>
          </div>

          <div className="rounded-xl bg-gray-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Link para divulgar</p>
            <ShareLink path={caminhoPublico} message={`🏆 ${t.title} · Comissão de Esportes Unifique`} />
          </div>
        </div>

        {/* Abas */}
        <nav className="flex border-t border-gray-100 px-2">
          <Link href={`/admin/torneios/${t.id}`} className={abaClasse(aba === "inscritos")}>
            <Users size={16} /> Inscritos
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{signups.length}</span>
          </Link>
          <Link href={`/admin/torneios/${t.id}?aba=editar`} className={abaClasse(aba === "editar")}>
            <Pencil size={16} /> Editar torneio
          </Link>
        </nav>
      </section>

      {aba === "inscritos" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-stretch gap-3">
            {contadores.map((c) => (
              <div
                key={c.rotulo}
                className={`min-w-[7rem] flex-1 rounded-2xl p-4 shadow-sm ${
                  c.destaque ? "bg-unifique text-white" : "bg-white text-unifique ring-1 ring-gray-200"
                }`}
              >
                <p className="font-display text-2xl font-extrabold leading-none">{c.n}</p>
                <p className={`mt-1 text-xs font-semibold uppercase tracking-wide ${c.destaque ? "text-white/80" : "text-gray-400"}`}>
                  {c.rotulo}
                </p>
              </div>
            ))}
            {signups.length > 0 && (
              <a
                href={`/api/export/torneio?id=${t.id}`}
                className="flex min-w-[7rem] flex-1 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-unifique/30 p-4 text-sm font-semibold text-unifique transition hover:border-unifique hover:bg-unifique-light/50"
              >
                <Download size={20} /> Baixar Excel
              </a>
            )}
          </div>

          <AdminSignupList signups={signups} categories={cats} />
        </section>
      ) : (
        <TournamentForm
          tournament={{
            id: t.id,
            title: t.title,
            description: t.description ?? "",
            location: t.location ?? "",
            questions: t.questions ?? "",
            categories: t.categories ?? "",
            rules: t.rules ?? "",
            dateLocal: toInputLocal(t.date),
            hasPhoto: !!t.photoMime,
            rulesFileName: t.rulesMime ? t.rulesName || "regulamento" : null,
          }}
        />
      )}
    </div>
  );
}
