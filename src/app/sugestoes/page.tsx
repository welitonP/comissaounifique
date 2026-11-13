import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { createSuggestion } from "@/lib/actions";
import SuccessCelebration from "@/components/SuccessCelebration";

export const dynamic = "force-dynamic";

export default async function SugestoesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <SuccessCelebration
        active={params.sucesso === "1"}
        message="Sugestão enviada! Obrigado pela contribuição."
      />
      <section className="rounded-2xl bg-gradient-to-br from-unifique to-unifique-blue p-7 text-white shadow-md">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <Lightbulb size={26} className="text-unifique-yellow" />
          </span>
          <div>
            <h1 className="text-2xl font-bold">Caixa de sugestões</h1>
            <p className="text-sm text-white/85">Seu canal direto com a comissão.</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/85">
          Envie sugestões de modalidades, horários, uniformes, eventos e melhorias.
          Você pode se identificar ou enviar de forma anônima. Apenas a comissão tem acesso.
        </p>
      </section>

      {params.sucesso === "1" && (
        <p className="aviso-ok">
          Sugestão enviada com sucesso. Obrigado pela contribuição!
        </p>
      )}
      {params.erro === "limite" && (
        <p className="aviso-erro">
          Muitas sugestões vieram deste mesmo lugar em pouco tempo. Aguarde um pouco e tente de novo.
        </p>
      )}
      {params.erro === "curta" && (
        <p className="aviso-erro">
          Descreva sua sugestão com um pouco mais de detalhes.
        </p>
      )}

      <form action={createSuggestion} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        {/* honeypot anti-spam (invisível) */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />
        <div>
          <label className="block">
            <span className="rotulo">Seu nome <span className="font-normal text-gray-400">(opcional)</span></span>
            <input
              name="name"
              placeholder="Deixe em branco para enviar anonimamente"
              className="campo"
            />
          </label>
        </div>
        <div>
          <label className="block">
            <span className="rotulo">Sua sugestão</span>
            <textarea
              name="message"
              required
              rows={5}
              placeholder="Descreva sua sugestão..."
              className="campo"
            />
          </label>
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-unifique py-3 font-display font-semibold text-white shadow transition hover:bg-unifique-dark"
        >
          Enviar sugestão
        </button>
        <p className="text-center text-xs text-gray-400">
          Seus dados são usados apenas pela comissão, conforme a{" "}
          <Link href="/privacidade" className="underline hover:text-unifique">
            Política de Privacidade
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
