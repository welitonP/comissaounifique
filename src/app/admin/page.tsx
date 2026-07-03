import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { requireUserPage } from "@/lib/auth";
import { logoutAction, saveTeamsLink } from "@/lib/actions";
import { getTeamsLink } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireUserPage();
  const teamsLink = await getTeamsLink();
  const params = await searchParams;

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
      href: "/admin/saidas",
      label: "Saídas de equipamento",
      description: "Kits e checklist do que sai/volta nos jogos.",
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
      href: "/admin/inscricoes",
      label: "Inscrições",
      description: "Abrir/fechar e aprovar inscrições de atletas.",
    },
    {
      href: "/admin/presencas",
      label: "Presenças",
      description: "Quem confirmou presença nos jogos.",
    },
    {
      href: "/admin/sugestoes",
      label: "Sugestões",
      description: "Ver o que os atletas sugeriram.",
    },
    {
      href: "/admin/resultados",
      label: "Resultados",
      description: "Registrar conquistas e medalhas.",
    },
    {
      href: "/admin/comissao",
      label: "A Comissão",
      description: "Apresentar os membros da comissão.",
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

      {/* Chat da comissão no Teams */}
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} className="text-[#5b5fc7]" />
            <h2 className="font-semibold text-unifique">Chat da Comissão (Teams)</h2>
          </div>
          {teamsLink && (
            <a
              href={teamsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-[#5b5fc7] px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
            >
              Abrir chat no Teams
            </a>
          )}
        </div>
        {params.erro === "link" && (
          <p className="mt-2 rounded bg-red-100 px-3 py-2 text-sm text-red-700">
            O link precisa começar com https://
          </p>
        )}
        <form action={saveTeamsLink} className="mt-3 flex flex-wrap gap-2">
          <input
            name="link"
            defaultValue={teamsLink ?? ""}
            placeholder="Cole aqui o link do chat em grupo do Teams"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-unifique px-4 py-2 text-sm font-medium text-white hover:bg-unifique-dark"
          >
            Salvar
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-400">
          Use o link do chat em grupo (no Teams: abra o chat &gt; ··· &gt; Copiar link). Evite links
          com &quot;48:notes&quot;, que são das suas notas pessoais.
        </p>
      </section>

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
