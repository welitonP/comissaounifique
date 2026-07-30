// Integração com a API da Anthropic (Claude).
// Configure a variável de ambiente ANTHROPIC_API_KEY.
// Opcional:
//   ANTHROPIC_MODEL     -> modelo usado (padrão: claude-haiku-4-5, rápido e econômico).
//   ANTHROPIC_BASE_URL  -> caso a empresa use um gateway próprio (padrão: api.anthropic.com).
//
// Por que Haiku como padrão: os textos da comissão (comunicados, chamada de torneio,
// respostas do Pablinho) são curtos e o Haiku já entrega qualidade ótima gastando bem
// menos. Para mais capricho, é só trocar ANTHROPIC_MODEL para claude-sonnet-5 ou
// claude-opus-5 nas variáveis de ambiente, sem mexer no código.

const DEFAULT_MODEL = "claude-haiku-4-5";

// Ferramenta de busca na web (roda no servidor da Anthropic). Usamos a variante
// básica, que funciona em todos os modelos, inclusive o Haiku. max_uses limita
// quantas buscas o Claude pode fazer por pergunta (controle de custo).
const WEB_SEARCH_TOOL = { type: "web_search_20250305", name: "web_search", max_uses: 4 };

export type AskClaudeOptions = { webSearch?: boolean };

type Msg = { role: "user" | "assistant"; content: unknown };

export function isClaudeConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function askClaude(
  system: string,
  userPrompt: string,
  opts: AskClaudeOptions = {},
): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("Claude não configurado (falta a variável ANTHROPIC_API_KEY).");
  }

  const model = (process.env.ANTHROPIC_MODEL || DEFAULT_MODEL).trim();
  const baseUrl = (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/+$/, "");

  const body: Record<string, unknown> = {
    model,
    max_tokens: 4096,
    temperature: 0.5,
    system,
  };
  if (opts.webSearch) body.tools = [WEB_SEARCH_TOOL];

  const messages: Msg[] = [{ role: "user", content: userPrompt }];

  // Com ferramentas de servidor (busca web), o Claude pode devolver "pause_turn"
  // quando precisa de mais uma rodada; reenviamos a conversa para ele continuar.
  // O limite baixo evita laço infinito.
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ ...body, messages }),
      cache: "no-store",
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          "A chave do Claude parece inválida ou sem permissão. Confira a ANTHROPIC_API_KEY nas configurações.",
        );
      }
      if (res.status === 429 || res.status === 529) {
        throw new Error(
          "O Claude atingiu o limite de uso por enquanto. Tente novamente daqui a pouco.",
        );
      }
      throw new Error(`Não consegui falar com o Claude agora (erro ${res.status}). ${detail.slice(0, 200)}`);
    }

    const data = await res.json();

    // O Claude pode recusar pedidos que violem as políticas de uso.
    if (data?.stop_reason === "refusal") {
      throw new Error("O Claude preferiu não responder a esse pedido. Reformule o texto e tente de novo.");
    }

    // Precisa continuar (busca web ainda rodando): devolve o turno e repete.
    if (data?.stop_reason === "pause_turn" && Array.isArray(data?.content)) {
      messages.push({ role: "assistant", content: data.content });
      continue;
    }

    // A resposta vem como uma lista de blocos; juntamos só os de texto.
    const blocks = Array.isArray(data?.content) ? data.content : [];
    const text = blocks
      .filter((b: { type?: string }) => b?.type === "text")
      .map((b: { text?: string }) => b.text ?? "")
      .join("")
      .trim();

    if (!text) {
      throw new Error("O Claude não retornou texto agora. Tente novamente.");
    }
    return text;
  }

  throw new Error("A busca demorou demais para o Claude concluir. Tente reformular a pergunta.");
}
