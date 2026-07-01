import Link from "next/link";
import Image from "next/image";

const links = [
  { href: "/", label: "Início" },
  { href: "/entre-empresas", label: "Entre Empresas" },
  { href: "/calendario", label: "Calendário" },
  { href: "/agenda", label: "Agenda" },
  { href: "/classificacao", label: "Classificação" },
  { href: "/materiais", label: "Materiais" },
  { href: "/comunicados", label: "Comunicados" },
  { href: "/enquetes", label: "Enquetes" },
];

export default function NavBar() {
  return (
    <header className="bg-unifique text-white shadow">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo-comissao.svg"
            alt="Comissão de Esportes Unifique"
            width={44}
            height={44}
            className="rounded-full bg-white/10"
            priority
          />
          <span className="text-base font-bold leading-tight tracking-tight sm:text-lg">
            Comissão de Esportes
            <span className="block text-xs font-normal text-unifique-teal">Unifique</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-unifique-teal">
              {link.label}
            </Link>
          ))}
          <Link href="/admin" className="rounded bg-white/15 px-3 py-1 hover:bg-white/25">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
