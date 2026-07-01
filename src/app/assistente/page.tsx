import { requireUserPage } from "@/lib/auth";
import { isGeminiConfigured } from "@/lib/gemini";
import AssistantChat from "@/components/AssistantChat";

export const dynamic = "force-dynamic";

export default async function AssistentePage() {
  await requireUserPage();
  const configured = isGeminiConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-unifique">Assistente IA</h1>
        <p className="mt-1 text-gray-600">
          Pergunte sobre materiais, uniformes, jogos e atletas. A IA responde com base no que está
          cadastrado no site.
        </p>
      </div>

      {!configured && (
        <p className="rounded bg-yellow-100 px-4 py-3 text-sm text-yellow-800">
          A IA ainda não foi ativada. Falta configurar a chave <code>GEMINI_API_KEY</code> nas
          variáveis de ambiente (Vercel). Assim que configurar, o assistente funciona.
        </p>
      )}

      <AssistantChat />
    </div>
  );
}
