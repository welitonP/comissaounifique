import Link from "next/link";
import { exigirUsuarioPagina, ehDono } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { sairAction } from "@/lib/acoes-admin";
import NavAdmin, { type ItemNav } from "@/components/NavAdmin";
import { IconeTesoura } from "@/components/Icones";

export const dynamic = "force-dynamic";

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const [usuario, config] = await Promise.all([exigirUsuarioPagina(), getConfig()]);
  const dono = ehDono(usuario.papel);

  const itens: ItemNav[] = [
    { href: "/admin", nome: "Agenda" },
    { href: "/admin/novo", nome: "Encaixar" },
    { href: "/admin/bloqueios", nome: "Folgas" },
    ...(dono
      ? [
          { href: "/admin/clientes", nome: "Clientes" },
          { href: "/admin/servicos", nome: "Serviços" },
          { href: "/admin/profissionais", nome: "Equipe" },
          { href: "/admin/relatorios", nome: "Relatórios" },
          { href: "/admin/config", nome: "Ajustes" },
        ]
      : []),
    { href: "/admin/conta", nome: "Minha conta" },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-barba-borda/70 bg-barba-carvao/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-barba-ouro text-black">
                <IconeTesoura className="h-4 w-4" />
              </span>
              <span className="titulo leading-none text-barba-creme">{config.nome}</span>
            </Link>

            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="hidden text-barba-cinza sm:block">
                {usuario.nome} · {dono ? "dono" : "barbeiro"}
              </span>
              <Link href="/" className="btn-mini" target="_blank">
                Ver site
              </Link>
              <form action={sairAction}>
                <button type="submit" className="btn-mini">
                  Sair
                </button>
              </form>
            </div>
          </div>

          <div className="mt-3">
            <NavAdmin itens={itens} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
