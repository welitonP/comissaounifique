import Link from "next/link";
import { requireUserPage } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";

export default async function AdminDashboardPage() {
  const user = await requireUserPage();

  const sections = [
    {
      href: "/admin/entre-empresas",
      label: "Entre Empresas",
      description: "Modalidades e empresas inscritas.",
    },
    {
      href: "/admin/calendario",
      label: "Calendário",
      description: "Datas de jogos e eventos.",
    },
    { href: "/admin/materiais", label: "Materiais", description: "Estoque de materiais." },
    {
      href: "/admin/uniformes",
      label: "Uniformes",
      description: "Itens controlados e quem está com eles.",
    },
    {
      href: "/admin/times",
      label: "Times (interno)",
      description: "Para campeonatos internos. Cadastrar times.",
    },
    {
      href: "/admin/jogos",
      label: "Jogos (interno)",
      description: "Agendar jogos internos e lançar resultados.",
    },
    {
      href: "/classificacao",
      label: "Classificação (interno)",
      description: "Tabela de pontos dos campeonatos internos.",
    },
    {
      href: "/admin/comunicados",
      label: "Comunicados",
      description: "Publicar avisos (com fotos) para todos.",
    },
    {
      href: "/admin/sugestoes",
      label: "Sugestões",
      description: "Ver o que os atletas sugeriram.",
    },
    { href: "/admin/enquetes", label: "Enquetes", description: "Criar enquetes e ver resultados." },
    { href: "/admin/conta", label: "Minha conta", description: "Alterar minha senha." },
  ];

  if (user.role === "admin") {
    sections.push({
      href: "/admin/membros",
      label: "Membros",
      description: "Gerenciar quem tem acesso ao site.",
    });
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

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="rounded-lg bg-white p-5 shadow-sm hover:shadow-md">
            <h2 className="font-semibold text-unifique">{s.label}</h2>
            <p className="mt-1 text-sm text-gray-500">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
