import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUserPage } from "@/lib/auth";
import TournamentForm from "@/components/TournamentForm";

export const dynamic = "force-dynamic";

const ERROS: Record<string, string> = {
  titulo: "Dê um título para o torneio.",
  foto: "O cartaz precisa ser uma imagem (JPG, PNG ou WEBP) de até 2 MB.",
  regulamento: "O arquivo do regulamento precisa ser PDF ou imagem, de até 3 MB.",
  banco: "Para anexar arquivo, falta rodar o SQL do regulamento no Supabase. Nada foi salvo: rode o SQL ou salve sem o arquivo.",
};

export default async function NovoTorneioPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUserPage();
  const { erro } = await searchParams;
  const msgErro = typeof erro === "string" ? ERROS[erro] : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/admin/torneios"
        className="inline-flex items-center gap-1 text-sm font-semibold text-unifique-blue hover:underline"
      >
        <ChevronLeft size={16} /> Torneios
      </Link>
      <div>
        <h1 className="font-display text-2xl font-bold text-unifique">Novo torneio</h1>
        <p className="text-sm text-gray-500">
          Preencha o essencial agora; dá para editar tudo depois.
        </p>
      </div>
      {msgErro && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm font-medium text-red-700">{msgErro}</p>
      )}
      <TournamentForm />
    </div>
  );
}
