// Integração simples com a API do Google Gemini (plano gratuito do AI Studio).
// Configure a variável de ambiente GEMINI_API_KEY.
// Opcional: GEMINI_MODEL (padrão gemini-2.0-flash) e GEMINI_MODEL_FALLBACK.

const DEFAULT_MODEL = "gemini-2.0-flash";
const DEFAULT_FALLBACK = "gemini-2.5-flash";

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

async function callModel(
  model: string,
  key: string,
  system: string,
  userPrompt: string,
): Promise<{ ok: true; text: string } | { ok: false; status: number; detail: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { ok: false, status: res.status, detail };
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map((p: { text?: string }) => p.text ?? "").join("")
    : "";
  return { ok: true, text: text.trim() || "Não consegui gerar uma resposta agora." };
}

export async function askGemini(system: string, userPrompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "A IA ainda não está configurada. Adicione a variável GEMINI_API_KEY nas configurações.",
    );
  }

  const primary = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const fallback = process.env.GEMINI_MODEL_FALLBACK || DEFAULT_FALLBACK;
  const models = fallback && fallback !== primary ? [primary, fallback] : [primary];

  let lastStatus = 0;
  for (const model of models) {
    const result = await callModel(model, key, system, userPrompt);
    if (result.ok) return result.text;
    lastStatus = result.status;
    // Se foi cota (429) tenta o próximo modelo; outros erros também tentam o fallback.
  }

  if (lastStatus === 429) {
    throw new Error(
      "O Pablinho atingiu o limite de uso gratuito da IA por enquanto. " +
        "Tente de novo daqui a pouco. Se persistir, pode ser que a chave do Gemini esteja " +
        "compartilhada com outro site (mesma cota) — nesse caso, gere uma chave nova só para este site.",
    );
  }
  if (lastStatus === 400 || lastStatus === 403) {
    throw new Error(
      "A chave da IA parece inválida ou sem permissão. Confira a GEMINI_API_KEY nas configurações.",
    );
  }
  throw new Error(`Não consegui falar com a IA agora (erro ${lastStatus}). Tente novamente.`);
}
