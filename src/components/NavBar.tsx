"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  CalendarDays,
  Home,
  Megaphone,
  Menu,
  Trophy,
  Vote,
  Lightbulb,
  Package,
  Shirt,
  X,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";

const PUBLIC_LINKS = [
  { href: "/", label: "Início", Icon: Home },
  { href: "/calendario", label: "Calendário", Icon: CalendarDays },
  { href: "/comunicados", label: "Comunicados", Icon: Megaphone },
  { href: "/entre-empresas", label: "Entre Empresas", Icon: Trophy },
  { href: "/enquetes", label: "Enquetes", Icon: Vote },
  { href: "/sugestoes", label: "Sugestões", Icon: Lightbulb },
];

const MEMBER_LINKS = [
  { href: "/materiais", label: "Materiais", Icon: Package },
  { href: "/uniformes", label: "Uniformes", Icon: Shirt },
];

export default function NavBar({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const links = user ? [...PUBLIC_LINKS, ...MEMBER_LINKS] : PUBLIC_LINKS;

  return (
    <header className="sticky top-0 z-40 bg-unifique text-white shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Image
            src="/logo-comissao.jpg"
            alt="Comissão de Esportes Unifique"
            width={46}
            height={46}
            className="rounded-full bg-white ring-2 ring-white/40"
            priority
          />
          <span className="font-display text-base font-bold leading-tight tracking-tight">
            Comissão de Esportes
            <span className="block text-[11px] font-semibold uppercase tracking-widest text-unifique-teal">
              Unifique · desde 2015
            </span>
          </span>
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              {label}
            </Link>
          ))}
          {user ? (
            <div className="ml-2 flex items-center gap-2 border-l border-white/20 pl-3">
              <Link
                href="/admin"
                className="rounded-lg bg-unifique-blue px-3.5 py-2 text-sm font-semibold text-white shadow hover:brightness-110"
              >
                Gerenciar
              </Link>
              <span className="text-xs font-medium text-unifique-teal">
                {user.name.split(" ")[0]}
              </span>
              <form action={logoutAction}>
                <button type="submit" className="text-xs text-white/70 underline hover:text-white">
                  Sair
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 rounded-lg bg-white/15 px-3.5 py-2 text-sm font-semibold hover:bg-white/25"
            >
              Área da comissão
            </Link>
          )}
        </nav>

        {/* Mobile: hambúrguer */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          className="rounded-lg p-2 hover:bg-white/10 lg:hidden"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Painel mobile */}
      {open && (
        <nav className="border-t border-white/10 bg-unifique-dark px-4 pb-4 pt-2 lg:hidden">
          <div className="grid gap-1">
            {links.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10"
              >
                <Icon size={18} className="text-unifique-teal" />
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-3 border-t border-white/10 pt-3">
            {user ? (
              <div className="flex items-center justify-between">
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-unifique-blue px-4 py-2 text-sm font-semibold text-white"
                >
                  Gerenciar
                </Link>
                <form action={logoutAction}>
                  <button type="submit" className="text-sm text-white/70 underline">
                    Sair ({user.name.split(" ")[0]})
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block rounded-lg bg-white/15 px-4 py-2.5 text-center text-sm font-semibold"
              >
                Área da comissão
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
