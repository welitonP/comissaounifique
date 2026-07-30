// Ponto único de IA do site. As telas e ações chamam sempre askAI, sem saber
// qual provedor está por trás.
//
// Ordem: Claude (Anthropic) primeiro, por ser o modelo aprovado pela empresa e
// mais confiável. Se o Claude não estiver configurado, ou falhar por instabilidade,
// cai automaticamente para o Gemini (plano gratuito) para o site nunca ficar sem IA.

import { askClaude, isClaudeConfigured } from "./claude";
import { askGemini, isGeminiConfigured } from "./gemini";

export function isAIConfigured(): boolean {
  return isClaudeConfigured() || isGeminiConfigured();
}

export async function askAI(system: string, userPrompt: string): Promise<string> {
  const temClaude = isClaudeConfigured();
  const temGemini = isGeminiConfigured();

  if (temClaude) {
    try {
      return await askClaude(system, userPrompt);
    } catch (e) {
      // Sem Gemini de reserva: repassa o erro do Claude como está.
      if (!temGemini) throw e;
      // Com Gemini disponível, tenta ele antes de desistir.
    }
  }

  if (temGemini) {
    return await askGemini(system, userPrompt);
  }

  throw new Error(
    "A IA ainda não está configurada. Adicione ANTHROPIC_API_KEY (Claude) ou GEMINI_API_KEY nas configurações.",
  );
}
