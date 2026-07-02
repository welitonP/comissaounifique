import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-unifique-dark text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div className="flex items-start gap-3">
          <Image
            src="/logo-comissao.jpg"
            alt="Comissão de Esportes Unifique"
            width={52}
            height={52}
            className="rounded-full bg-white"
          />
          <div>
            <p className="font-display font-bold">Comissão de Esportes</p>
            <p className="text-sm text-white/60">Unifique · desde 2015</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-unifique-teal">
            Acesso rápido
          </p>
          <ul className="space-y-1 text-sm text-white/80">
            <li><Link href="/calendario" className="hover:text-white">Calendário de jogos</Link></li>
            <li><Link href="/comunicados" className="hover:text-white">Comunicados</Link></li>
            <li><Link href="/entre-empresas" className="hover:text-white">Entre Empresas</Link></li>
            <li><Link href="/sugestoes" className="hover:text-white">Sugestões</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-unifique-teal">
            Sobre
          </p>
          <p className="text-sm text-white/70">
            A Comissão de Esportes organiza a participação da Unifique nas competições
            esportivas e promove o esporte entre os colaboradores.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {ano} Comissão de Esportes Unifique. Todos os direitos reservados.
      </div>
    </footer>
  );
}
