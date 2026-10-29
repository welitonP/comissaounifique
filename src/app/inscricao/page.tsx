import Link from "next/link";
import { ClipboardList, Lock, MessageCircle, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { isInscricoesAbertas } from "@/lib/settings";
import { createEnrollment } from "@/lib/actions";
import SuccessCelebration from "@/components/SuccessCelebration";
import PhoneInput from "@/components/form/PhoneInput";
import SubmitButton from "@/components/form/SubmitButton";
import Etapas from "@/components/form/Etapas";
import AnimatedCheck from "@/components/anim/AnimatedCheck";
import RememberMe from "@/components/form/RememberMe";
import ScrollIntoView from "@/components/form/ScrollIntoView";
import ModalidadesPicker from "@/components/form/ModalidadesPicker";

export const dynamic = "force-dynamic";

const TAMANHOS = ["PP", "P", "M", "G", "GG", "XG", "XXG"];

const campo =
  "mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base focus:border-unifique focus:outline-none focus:ring-2 focus:ring-unifique/15 dark:border-white/15 dark:bg-gray-800 dark:text-white";
const rotulo = "block text-sm font-semibold text-gray-700 dark:text-gray-200";

const ERROS: Record<string, string> = {
  dados: "Faltou alguma informação. Confira os campos com * e marque pelo menos uma modalidade.",
  fechado: "As inscrições foram encerradas.",
  "ja-inscrito": "Já recebemos uma inscrição com este WhatsApp e ela está em análise. Se quiser mudar algo, fale com a comissão.",
};

export default async function InscricaoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const [aberto, modalities] = await Promise.all([
    isInscricoesAbertas(),
    prisma.modality.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  const sucesso = params.sucesso === "1";
  const erro = typeof params.erro === "string" ? ERROS[params.erro] : undefined;

  if (sucesso) {
    return (
      <div className="mx-auto max-w-lg">
        <SuccessCelebration active message="Inscrição enviada! A comissão vai confirmar." />
        <ScrollIntoView className="entrada-sucesso rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-900">
          <AnimatedCheck size={72} />
          <h1 className="mt-3 font-display text-2xl font-bold text-unifique dark:text-white">Inscrição enviada!</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Obrigado por querer representar a Unifique. 💙</p>
          <ol className="mx-auto mt-6 max-w-sm space-y-3 text-left text-sm text-gray-600 dark:text-gray-300">
            <li className="flex gap-3">
              <ShieldCheck size={20} className="flex-none text-unifique-blue" />
              A comissão analisa sua inscrição e confirma as modalidades.
            </li>
            <li className="flex gap-3">
              <MessageCircle size={20} className="flex-none text-unifique-blue" />
              Se precisar de algo, falamos com você pelo WhatsApp informado.
            </li>
            <li className="flex gap-3">
              <ClipboardList size={20} className="flex-none text-unifique-blue" />
              Acompanhe os jogos e treinos no calendário do site.
            </li>
          </ol>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/calendario" className="rounded-xl bg-unifique px-5 py-2.5 font-display font-semibold text-white hover:bg-unifique-dark">
              Ver calendário
            </Link>
            <Link href="/treinos" className="rounded-xl border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/15 dark:text-gray-200">
              Ver treinos
            </Link>
          </div>
        </ScrollIntoView>
      </div>
    );
  }

  if (!aberto) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-900">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-unifique-light">
            <Lock className="text-unifique" size={28} />
          </span>
          <h1 className="mt-4 font-display text-xl font-bold text-unifique dark:text-white">Inscrições encerradas</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            No momento não há inscrições abertas. Fique de olho nos comunicados: avisaremos quando abrir a próxima
            janela de inscrições.
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
    <div className="mx-auto max-w-2xl space-y-5">
      <section className="banner-vivo rounded-2xl bg-gradient-to-br from-unifique to-unifique-blue p-6 text-white shadow-md sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-white/15">
            <ClipboardList size={26} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">Inscrição de atletas</h1>
            <p className="text-sm text-white/85">Represente a Unifique nas competições.</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/85">
          São 2 etapas rápidas: seus dados e as modalidades. A comissão analisa e confirma.
        </p>
      </section>

      {erro && (
        <ScrollIntoView>
          <p className="aviso-entrar rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">{erro}</p>
        </ScrollIntoView>
      )}

      <form action={createEnrollment} className="space-y-6 rounded-2xl bg-white p-5 shadow-sm sm:p-6 dark:bg-gray-900">
        {/* honeypot anti-spam (invisível) */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

        <Etapas
          titulos={["Seus dados", "Modalidades"]}
          etapas={[
            <div key="dados" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={rotulo}>
                    Nome completo <span className="text-unifique-blue">*</span>
                  </label>
                  <input name="name" required maxLength={100} autoComplete="name" className={campo} />
                </div>
                <div>
                  <label className={rotulo}>
                    Data de nascimento <span className="text-unifique-blue">*</span>
                  </label>
                  <input type="date" name="birthDate" required max="2015-12-31" min="1940-01-01" className={campo} />
                </div>
                <div>
                  <label className={rotulo}>
                    WhatsApp <span className="text-unifique-blue">*</span>
                  </label>
                  <PhoneInput className={campo} />
                </div>
                <div className="sm:col-span-2">
                  <label className={rotulo}>
                    Setor <span className="text-unifique-blue">*</span>
                  </label>
                  <input name="sector" required maxLength={100} placeholder="Ex: TI, Comercial, Atendimento..." className={campo} />
                </div>
              </div>
              <fieldset>
                <legend className={rotulo}>
                  Tamanho de camisa <span className="text-unifique-blue">*</span>
                </legend>
                <div className="mt-1 grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {TAMANHOS.map((t) => (
                    <label key={t} className="cursor-pointer">
                      <input type="radio" name="shirtSize" value={t} required className="peer sr-only" />
                      <span className="block rounded-xl border-2 border-gray-200 py-2.5 text-center font-bold text-gray-700 transition peer-checked:border-unifique peer-checked:bg-unifique peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-unifique/30 dark:border-white/15 dark:text-gray-200">
                        {t}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>,
            <div key="modalidades" className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Marque todas as modalidades que você quer disputar.</p>
              <ModalidadesPicker modalidades={modalities} />
            </div>,
          ]}
          final={
            <>
              <RememberMe fields={["name", "phone", "birthDate", "sector"]} />
              <SubmitButton className="w-full rounded-xl bg-unifique py-3.5 font-display text-lg font-semibold text-white shadow transition hover:bg-unifique-dark">
                Enviar inscrição
              </SubmitButton>
              <p className="text-center text-xs text-gray-400">
                Ao enviar, você autoriza a comissão a usar estes dados para organizar as competições, conforme a{" "}
                <Link href="/privacidade" className="underline hover:text-unifique">
                  Política de Privacidade
                </Link>
                .
              </p>
            </>
          }
        />
      </form>
    </div>
  );
}
