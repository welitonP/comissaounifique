import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// Cabeçalho padrão das telas da comissão: link para voltar, título, uma linha
// explicando a tela e, se houver, ações à direita (ex: "Baixar Excel").
export default function AdminTopo({
  titulo,
  descricao,
  voltar = "/admin",
  voltarRotulo = "Gerenciar",
  children,
}: {
  titulo: string;
  descricao?: React.ReactNode;
  voltar?: string;
  voltarRotulo?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="space-y-2">
      <Link
        href={voltar}
        className="inline-flex min-h-[36px] items-center gap-1 text-sm font-semibold text-unifique-blue hover:underline"
      >
        <ChevronLeft size={16} /> {voltarRotulo}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-unifique dark:text-white">{titulo}</h1>
          {descricao && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{descricao}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}
