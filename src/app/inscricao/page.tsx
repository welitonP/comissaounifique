import Link from "next/link";
import { ClipboardList, Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { isInscricoesAbertas } from "@/lib/settings";
import { createEnrollment } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function InscricaoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const [aberto, modalities] = await Promise.all([
    isInscricoesAbertas(),
    prisma.modality.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
  ]);

  if (!aberto) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-unifique-light">
            <Lock className="text-unifique" size={28} />
          </span>
          <h1 className="mt-4 text-xl font-bold text-unifique">Inscrições encerradas</h1>
          <p className="mt-2 text-gray-600">
            No momento não há inscrições abertas. Fique de olho nos comunicados: avisaremos quando
            abrir a próxima janela de inscrições.
          </p>
          <Link
            href="/comunicados"
            className="mt-5 inline-block rounded-xl bg-unifique px-5 py-2.5 font-display font-semibold text-white hover:bg-unifique-dark"
          >
            Ver comunicados
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-unifique to-unifique-blue p-7 text-white shadow-md">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <ClipboardList size={26} />
          </span>
          <div>
            <h1 className="text-2xl font-bold">Inscrição de atletas</h1>
            <p className="text-sm text-white/85">Represente a Unifique nas competições.</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/85">
          Preencha seus dados e marque as modalidades que deseja disputar. A comissão vai analisar
          e confirmar sua inscrição.
        </p>
      </section>

      {params.sucesso === "1" && (
        <p className="rounded-xl bg-green-100 px-4 py-3 text-sm font-medium text-green-800">
          Inscrição enviada! A comissão vai analisar e confirmar. Obrigado por participar.
        </p>
      )}
      {params.erro === "dados" && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
          Preencha seu nome e selecione pelo menos uma modalidade.
        </p>
      )}
      {params.erro === "fechado" && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
          As inscrições foram encerradas.
        </p>
      )}

      <form action={createEnrollment} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700">Nome completo</label>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-unifique focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Setor</label>
            <input
              name="sector"
              placeholder="Ex: TI, Comercial..."
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-unifique focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Tamanho de camisa</label>
            <select
              name="shirtSize"
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-unifique focus:outline-none"
            >
              <option value="">Selecione</option>
              {["PP", "P", "M", "G", "GG", "XG", "XXG"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700">
              Contato <span className="font-normal text-gray-400">(telefone ou e-mail)</span>
            </label>
            <input
              name="contact"
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-unifique focus:outline-none"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700">
            Modalidades que vou disputar
            <span className="ml-1 font-normal text-gray-400">(marque uma ou mais)</span>
          </p>
          <div className="mt-2 grid max-h-72 grid-cols-1 gap-1 overflow-y-auto rounded-xl border border-gray-200 p-3 sm:grid-cols-2">
            {modalities.map((m) => (
              <label
                key={m.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-unifique-light"
              >
                <input
                  type="checkbox"
                  name="modalidades"
                  value={m.id}
                  className="h-4 w-4 rounded border-gray-300 text-unifique focus:ring-unifique"
                />
                {m.name}
              </label>
            ))}
            {modalities.length === 0 && (
              <p className="text-sm text-gray-400">Nenhuma modalidade cadastrada.</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-unifique py-3 font-display font-semibold text-white shadow transition hover:bg-unifique-dark"
        >
          Enviar inscrição
        </button>
      </form>
    </div>
  );
}
