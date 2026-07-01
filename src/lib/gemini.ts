// Integração simples com a API do Google Gemini (plano gratuito do AI Studio).
// Configure a variável de ambiente GEMINI_API_KEY.
// Opcional: GEMINI_MODEL (padrão gemini-2.0-flash) e GEMINI_MODEL_FALLBACK.

// Ordem de tentativa: modelos "lite" têm cota gratuita diária maior.
const DEFAULT_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
];

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

  // GEMINI_MODEL pode ser um único modelo ou uma lista separada por vírgula.
  const configured = (process.env.GEMINI_MODEL || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const models = Array.from(new Set([...configured, ...DEFAULT_MODELS]));

  let lastStatus = 0;
  for (const model of models) {
    const result = await callModel(model, key, system, userPrompt);
    if (result.ok) return result.text;
    lastStatus = result.status;
    // 429 (cota) ou 404 (modelo indisponível): tenta o próximo modelo da lista.
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
