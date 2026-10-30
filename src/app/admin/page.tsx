import Link from "next/link";
import {
  Camera,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  Dumbbell,
  KeyRound,
  Lightbulb,
  Medal,
  Megaphone,
  Package,
  ShieldCheck,
  Shirt,
  Swords,
  Trophy,
  Truck,
  Users,
  Vote,
  type LucideIcon,
} from "lucide-react";
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

  type Secao = { href: string; label: string; description: string; icon: LucideIcon };
  const grupos: { titulo: string; itens: Secao[] }[] = [
    {
      titulo: "Competições",
      itens: [
        { href: "/admin/campeonatos", label: "Campeonatos", description: "Tabela, chave, placar ao vivo e artilharia.", icon: Medal },
        { href: "/admin/torneios", label: "Torneios internos", description: "Criar torneios, ver inscritos e regulamento.", icon: Swords },
        { href: "/admin/entre-empresas", label: "Entre Empresas", description: "Modalidades e empresas inscritas.", icon: Trophy },
        { href: "/admin/calendario", label: "Calendário", description: "Datas de jogos e eventos.", icon: CalendarDays },
        { href: "/admin/treinos", label: "Grade de treinos", description: "Horários e quem participa.", icon: Dumbbell },
        { href: "/admin/resultados", label: "Resultados", description: "Conquistas e medalhas.", icon: Medal },
        { href: "/admin/presencas", label: "Presenças", description: "Quem confirmou nos jogos.", icon: CheckCircle2 },
      ],
    },
    {
      titulo: "Atletas",
      itens: [
        { href: "/admin/inscricoes", label: "Inscrições", description: "Abrir/fechar e aprovar atletas.", icon: ClipboardList },
        { href: "/admin/exportar", label: "Exportar dados", description: "Elenco em planilha, por modalidade.", icon: Download },
      ],
    },
    {
      titulo: "Conteúdo do site",
      itens: [
        { href: "/admin/comunicados", label: "Comunicados", description: "Avisos com fotos para todos.", icon: Megaphone },
        { href: "/admin/fotos", label: "Fotos", description: "Galeria pública.", icon: Camera },
        { href: "/admin/enquetes", label: "Enquetes", description: "Criar e ver resultados.", icon: Vote },
        { href: "/admin/sugestoes", label: "Sugestões", description: "O que os atletas sugeriram.", icon: Lightbulb },
        { href: "/admin/comissao", label: "A Comissão", description: "Membros na vitrine do site.", icon: Users },
      ],
    },
    {
      titulo: "Equipamentos",
      itens: [
        { href: "/admin/materiais", label: "Materiais", description: "Estoque de materiais.", icon: Package },
        { href: "/admin/uniformes", label: "Uniformes", description: "Quem está com cada item.", icon: Shirt },
        { href: "/admin/saidas", label: "Saídas de equipamento", description: "Checklist do que sai e volta.", icon: Truck },
      ],
    },
    {
      titulo: "Conta",
      itens: [
        { href: "/admin/conta", label: "Minha conta", description: "Alterar minha senha.", icon: KeyRound },
        ...(user.role === "master" || user.role === "admin"
          ? [{ href: "/admin/membros", label: "Membros", description: "Quem tem acesso ao painel.", icon: ShieldCheck }]
          : []),
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-unifique">Gerenciar</h1>
          <p className="text-sm text-gray-500">
            Você está logado como <strong>{user.name}</strong>
            {user.role === "master" ? " (master)" : user.role === "admin" ? " (administrador)" : ""}.
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

      {grupos.map((g) => (
        <section key={g.titulo} className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">{g.titulo}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.itens.map((s) => {
              const badge = badges[s.href] ?? 0;
              const Icon = s.icon;
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className="group relative flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-unifique/30"
                >
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-unifique-light text-unifique transition group-hover:bg-unifique group-hover:text-white">
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display font-semibold text-gray-900">{s.label}</span>
                    <span className="block text-xs text-gray-500">{s.description}</span>
                  </span>
                  {badge > 0 && (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-unifique-yellow px-1.5 text-xs font-bold text-unifique-dark">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
