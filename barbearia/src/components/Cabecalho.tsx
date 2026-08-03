import Link from "next/link";
import { IconeTesoura } from "./Icones";

export default function Cabecalho({ nome }: { nome: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-barba-borda/70 bg-barba-preto/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-barba-ouro text-black">
            <IconeTesoura className="h-5 w-5" />
          </span>
          <span className="titulo text-lg leading-none text-barba-creme">{nome}</span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link
            href="/meus-agendamentos"
            className="hidden rounded-lg px-3 py-2 text-barba-cinza transition hover:text-barba-ouro sm:block"
          >
            Meus horários
          </Link>
          <Link href="/agendar" className="btn-ouro px-4 py-2">
            Agendar
          </Link>
        </nav>
      </div>
    </header>
  );
}
