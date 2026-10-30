import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUserPage } from "@/lib/auth";
import CupWizard from "@/components/campeonato/CupWizard";

export const metadata = { title: "Novo campeonato" };

export default async function NovoCampeonatoPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  await requireUserPage();
  const { erro } = await searchParams;
  return (
    <div className="campeonato space-y-6">
      <Link href="/admin/campeonatos" className="inline-flex items-center gap-1 text-sm font-semibold text-unifique-blue hover:underline">
        <ChevronLeft size={16} /> Campeonatos
      </Link>
      <div>
        <h1 className="font-display text-2xl font-bold text-unifique dark:text-unifique-teal">Novo campeonato</h1>
        <p className="text-sm text-gray-500">Três passos e a tabela está pronta.</p>
      </div>
      <CupWizard erro={erro} />
    </div>
  );
}
