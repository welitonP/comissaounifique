import Link from "next/link";
import Image from "next/image";

const LINKS = [
  { href: "/calendario", label: "Calendário" },
  { href: "/treinos", label: "Treinos" },
  { href: "/torneios", label: "Torneios" },
  { href: "/entre-empresas", label: "Entre Empresas" },
  { href: "/comunicados", label: "Comunicados" },
  { href: "/fotos", label: "Fotos" },
  { href: "/resultados", label: "Resultados" },
  { href: "/enquetes", label: "Enquetes" },
  { href: "/comissao", label: "A Comissão" },
  { href: "/sugestoes", label: "Sugestões" },
];

// Rodapé: compacto no celular (logo + links em 2 colunas) e em 3 colunas no
// computador, com o texto "Sobre".
export default function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer className="mt-12 bg-unifique-dark text-white sm:mt-16">
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:grid-cols-[1fr_1.4fr_1fr] sm:gap-8 sm:py-10">
        <div className="flex items-center gap-3 sm:items-start">
          <Image
            src="/logo-comissao.png"
            alt="Comissão de Esportes Unifique"
            width={52}
            height={52}
            className="h-10 w-10 rounded-full bg-white sm:h-[52px] sm:w-[52px]"
          />
          <div>
            <p className="font-display font-bold leading-tight">Comissão de Esportes</p>
            <p className="text-xs text-white/60 sm:text-sm">Unifique · desde 2015</p>
          </div>
        </div>

        <nav aria-label="Acesso rápido">
          <p className="mb-2 hidden text-xs font-bold uppercase tracking-widest text-unifique-teal sm:block">
            Acesso rápido
          </p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-white/80">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden sm:block">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-unifique-teal">Sobre</p>
          <p className="text-sm text-white/70">
            A Comissão de Esportes organiza a participação da Unifique nas competições
            esportivas e promove o esporte entre os colaboradores.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-3 text-center text-[11px] text-white/50 sm:py-4 sm:text-xs">
        © {ano} Comissão de Esportes Unifique. Todos os direitos reservados. ·{" "}
        <Link href="/privacidade" className="underline hover:text-white">
          Política de Privacidade
        </Link>
      </div>
    </footer>
  );
}
