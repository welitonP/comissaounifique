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

type ModelResult =
  | { ok: true; text: string; finishReason?: string }
  | { ok: false; status: number; detail: string };

async function callModel(
  model: string,
  key: string,
  system: string,
  userPrompt: string,
): Promise<ModelResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  // Espaço de saída bem folgado para o texto nunca cortar no meio (o resumo da
  // semana é a resposta mais longa e era a que truncava).
  const generationConfig: Record<string, unknown> = {
    temperature: 0.5,
    maxOutputTokens: 8192,
  };
  // Modelos com "raciocínio" (família 2.5 e variantes *thinking*) gastam tokens
  // escondidos "pensando", e esse gasto entra no mesmo orçamento da resposta.
  // Sem desligar, eles estouram o limite e devolvem só a primeira linha (ex.:
  // "* Próximos Eventos/Jogos:" e nada mais). Desligamos para o texto sair
  // completo e mais rápido.
  if (/2\.5|thinking/i.test(model)) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { ok: false, status: res.status, detail };
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const parts = candidate?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map((p: { text?: string }) => p.text ?? "").join("").trim()
    : "";
  return { ok: true, text, finishReason: candidate?.finishReason };
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
  let partial = ""; // melhor resposta que veio cortada, usada só como último recurso
  for (const model of models) {
    const result = await callModel(model, key, system, userPrompt);
    if (!result.ok) {
      lastStatus = result.status;
      // 429 (cota) ou 404 (modelo indisponível): tenta o próximo modelo da lista.
      continue;
    }
    // Resposta completa: entrega na hora.
    if (result.text && result.finishReason !== "MAX_TOKENS") return result.text;
    // Veio cortada por limite de tokens (ou vazia): guarda a maior parcial e
    // tenta outro modelo, que pode devolver o texto inteiro.
    if (result.text.length > partial.length) partial = result.text;
  }

  if (partial) return partial;

  if (lastStatus === 429) {
    throw new Error(
      "O Pablinho atingiu o limite de uso gratuito da IA por enquanto. " +
        "Tente de novo daqui a pouco. Se persistir, pode ser que a chave do Gemini esteja " +
        "compartilhada com outro site (mesma cota). Nesse caso, gere uma chave nova só para este site.",
    );
  }
  if (lastStatus === 400 || lastStatus === 403) {
    throw new Error(
      "A chave da IA parece inválida ou sem permissão. Confira a GEMINI_API_KEY nas configurações.",
    );
  }
  if (lastStatus === 0) {
    // Os modelos responderam, mas sem texto aproveitável.
    throw new Error("A IA não conseguiu gerar uma resposta agora. Tente novamente.");
  }
  throw new Error(`Não consegui falar com a IA agora (erro ${lastStatus}). Tente novamente.`);
}
