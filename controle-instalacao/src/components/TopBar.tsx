import Link from "next/link";
import { LogOut, Radio, Users } from "lucide-react";
import { logoutAction } from "@/lib/actions";
import { buttonClass } from "@/components/ui/button";
import type { Session } from "@/lib/auth";

export function TopBar({
  session,
  subtitle,
  children,
}: {
  session: Session;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="topbar">
      <Link href="/" className="brand-icon" aria-label="Ir para a lista de eventos">
        <Radio size={18} />
      </Link>

      <div className="brand min-w-0 flex-1">
        <b className="truncate">Controle de instalação</b>
        <small className="truncate">{subtitle}</small>
      </div>

      <div className="inline-actions">
        {children}
        {session.role === "admin" ? (
          <Link href="/membros" className={buttonClass("default", "sm")}>
            <Users size={15} />
            <span className="hidden sm:inline">Membros</span>
          </Link>
        ) : null}
        <form action={logoutAction}>
          <button type="submit" className={buttonClass("ghost", "sm")} title={`Sair (${session.name})`}>
            <LogOut size={15} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </form>
      </div>
    </header>
  );
}
