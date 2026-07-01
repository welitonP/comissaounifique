import Link from "next/link";

const links = [
  { href: "/", label: "Início" },
  { href: "/agenda", label: "Agenda" },
  { href: "/classificacao", label: "Classificação" },
  { href: "/comunicados", label: "Comunicados" },
  { href: "/enquetes", label: "Enquetes" },
];

export default function NavBar() {
  return (
    <header className="bg-unifique text-white shadow">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Comissão de Esportes Unifique
        </Link>
        <nav className="flex flex-wrap gap-4 text-sm font-medium">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:underline">
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
