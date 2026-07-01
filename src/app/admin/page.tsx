import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";

export default async function AdminDashboardPage() {
  await requireAdminPage();

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
    { href: "/admin/times", label: "Times", description: "Cadastrar e remover times." },
    { href: "/admin/jogos", label: "Jogos", description: "Agendar jogos e lançar resultados." },
    {
      href: "/admin/comunicados",
      label: "Comunicados",
      description: "Publicar avisos para todos.",
    },
    { href: "/admin/enquetes", label: "Enquetes", description: "Criar enquetes e ver resultados." },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-unifique-dark">Painel da Comissão</h1>
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-gray-500 underline">
            Sair
          </button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="rounded-lg bg-white p-5 shadow-sm hover:shadow-md">
            <h2 className="font-semibold text-unifique-dark">{s.label}</h2>
            <p className="mt-1 text-sm text-gray-500">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
