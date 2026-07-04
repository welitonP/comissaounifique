import Link from "next/link";
import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireUserPage();

  // Contadores de pendências (o que precisa de ação da comissão).
  const [inscricoesPendentes, sugestoesNovas, saidasAbertas, uniformesEmprestados] =
    await Promise.all([
      prisma.enrollment.count({ where: { status: "pendente" } }),
      prisma.suggestion.count({ where: { status: "nova" } }),
      prisma.checkout.count({ where: { status: "aberto" } }),
      prisma.trackedItem.count({ where: { holderName: { not: null } } }),
    ]);

  const pendencias = [
    {
      href: "/admin/inscricoes",
      label: "Inscrições aguardando",
      count: inscricoesPendentes,
      emoji: "📝",
    },
    { href: "/admin/sugestoes", label: "Sugestões novas", count: sugestoesNovas, emoji: "💡" },
    {
      href: "/admin/saidas",
      label: "Saídas em aberto",
      count: saidasAbertas,
      emoji: "📦",
    },
    {
      href: "/admin/uniformes",
      label: "Uniformes emprestados",
      count: uniformesEmprestados,
      emoji: "👕",
    },
  ];
  const totalPendencias = inscricoesPendentes + sugestoesNovas + saidasAbertas;

  // badge por seção (mostra número quando há algo a olhar)
  const badges: Record<string, number> = {
    "/admin/inscricoes": inscricoesPendentes,
    "/admin/sugestoes": sugestoesNovas,
    "/admin/saidas": saidasAbertas,
    "/admin/uniformes": uniformesEmprestados,
  };

  const sections = [
    { href: "/admin/entre-empresas", label: "Entre Empresas", description: "Modalidades e empresas inscritas." },
    { href: "/admin/calendario", label: "Calendário", description: "Datas de jogos e eventos." },
    { href: "/admin/materiais", label: "Materiais", description: "Estoque de materiais." },
    { href: "/admin/uniformes", label: "Uniformes", description: "Itens controlados e quem está com eles." },
    { href: "/admin/saidas", label: "Saídas de equipamento", description: "Kits e checklist do que sai/volta nos jogos." },
    { href: "/admin/comunicados", label: "Comunicados", description: "Publicar avisos (com fotos) para todos." },
    { href: "/admin/inscricoes", label: "Inscrições", description: "Abrir/fechar e aprovar inscrições de atletas." },
    { href: "/admin/exportar", label: "Exportar dados", description: "Baixar o elenco em planilha, filtrando por modalidade." },
    { href: "/admin/presencas", label: "Presenças", description: "Quem confirmou presença nos jogos." },
    { href: "/admin/sugestoes", label: "Sugestões", description: "Ver o que os atletas sugeriram." },
    { href: "/admin/resultados", label: "Resultados", description: "Registrar conquistas e medalhas." },
    { href: "/admin/comissao", label: "A Comissão", description: "Apresentar os membros da comissão." },
    { href: "/admin/enquetes", label: "Enquetes", description: "Criar enquetes e ver resultados." },
    { href: "/admin/conta", label: "Minha conta", description: "Alterar minha senha." },
  ];

  if (user.role === "admin") {
    sections.push({ href: "/admin/membros", label: "Membros", description: "Gerenciar quem tem acesso ao site." });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-unifique">Gerenciar</h1>
          <p className="text-sm text-gray-500">
            Você está logado como <strong>{user.name}</strong>
            {user.role === "admin" ? " (administrador)" : ""}.
          </p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-gray-500 underline">
            Sair
          </button>
        </form>
      </div>

      {/* Painel de pendências */}
      <section className="rounded-2xl bg-gradient-to-br from-unifique to-unifique-blue p-5 text-white shadow-md">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold">Pendências</h2>
          {totalPendencias === 0 ? (
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              Tudo em dia ✅
            </span>
          ) : (
            <span className="rounded-full bg-unifique-yellow px-3 py-1 text-xs font-bold text-unifique-dark">
              {totalPendencias} a resolver
            </span>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {pendencias.map((p) => (
            <Link
              key={p.href + p.label}
              href={p.href}
              className={`rounded-xl px-3 py-3 text-center transition hover:scale-[1.03] ${
                p.count > 0 ? "bg-white/15 ring-1 ring-white/25" : "bg-white/5"
              }`}
            >
              <p className="text-2xl font-extrabold leading-none">
                {p.emoji} {p.count}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/80">
                {p.label}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => {
          const badge = badges[s.href] ?? 0;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="group relative rounded-lg bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {badge > 0 && (
                <span className="absolute right-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-unifique-yellow px-1.5 text-xs font-bold text-unifique-dark">
                  {badge}
                </span>
              )}
              <h2 className="font-semibold text-unifique group-hover:text-unifique-dark">{s.label}</h2>
              <p className="mt-1 text-sm text-gray-500">{s.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
