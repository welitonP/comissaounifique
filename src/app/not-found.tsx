import Link from "next/link";
import type { Metadata } from "next";
import { Bola } from "@/components/anim/Bolas";

export const metadata: Metadata = { title: "Página não encontrada" };

// Página de "não encontrado" com a cara do site (antes aparecia a tela padrão
// em inglês: "404: This page could not be found").
export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-6 sm:py-12">
      <div className="overflow-hidden rounded-3xl bg-white text-center shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-white/10">
        <div className="relative h-40 bg-gradient-to-br from-unifique to-unifique-blue">
          {/* linha lateral da quadra e a bola quicando do lado de fora */}
          <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-0.5 bg-white/30" />
          <div aria-hidden="true" className="absolute bottom-6 left-[62%] h-24 w-10">
            <div className="bola-sombra absolute bottom-0 left-1.5 h-1.5 w-7 rounded-full bg-black/50 blur-[1px]" />
            <div className="bola-quique absolute bottom-1.5 left-0 flex w-10 justify-center">
              <Bola tipo="futebol" className="bola-giro h-9 w-9 drop-shadow-md" />
            </div>
          </div>
          <p className="absolute left-5 top-4 font-display text-6xl font-extrabold text-white/20">404</p>
        </div>
        <div className="p-6 sm:p-8">
          <h1 className="font-display text-3xl font-extrabold text-unifique dark:text-white">Bola fora!</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Essa página não existe ou mudou de lugar. Confira o endereço ou volte para o jogo por um dos atalhos.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/" className="btn-primario">
              Voltar para o início
            </Link>
            <Link href="/calendario" className="btn-claro">
              Calendário
            </Link>
            <Link href="/torneios" className="btn-claro">
              Torneios
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
