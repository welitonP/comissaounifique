"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type ItemNav = { href: string; nome: string };

export default function NavAdmin({ itens }: { itens: ItemNav[] }) {
  const caminho = usePathname();

  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1">
      {itens.map((i) => {
        // "/admin" só fica ativo na própria página; os demais aceitam subrotas.
        const ativo = i.href === "/admin" ? caminho === "/admin" : caminho.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              ativo
                ? "bg-barba-ouro text-black"
                : "text-barba-cinza hover:bg-barba-grafite hover:text-barba-creme"
            }`}
          >
            {i.nome}
          </Link>
        );
      })}
    </nav>
  );
}
