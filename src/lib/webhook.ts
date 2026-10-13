// Dispara um webhook de saída para automações (ex: N8N) quando algo acontece
// no site (nova inscrição em torneio, novo inscrito em treino, etc.).
//
// É opcional: só funciona se a variável N8N_WEBHOOK_URL estiver configurada.
// Nunca quebra o fluxo do usuário: qualquer erro ou demora é engolido (a
// automação é "best effort", a inscrição acontece de qualquer jeito).
//
// Configuração (Vercel → Environment Variables):
//   N8N_WEBHOOK_URL     -> a URL do nó "Webhook" do seu fluxo no n8n.
//   N8N_WEBHOOK_SECRET  -> (opcional) um segredo; vai no header x-webhook-secret
//                          para o n8n confirmar que o chamado veio do site.
export async function notifyWebhook(
  event: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const url = process.env.N8N_WEBHOOK_URL;
    // Só dispara se houver uma URL http(s) válida configurada. Qualquer coisa
    // diferente (vazio, URL sem esquema, valor estranho) é ignorada de propósito:
    // a automação é opcional e NUNCA pode atrapalhar a inscrição.
    if (!url || !/^https?:\/\//i.test(url)) return;
    const secret = process.env.N8N_WEBHOOK_SECRET;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(secret ? { "x-webhook-secret": secret } : {}),
      },
      body: JSON.stringify({ event, data, at: new Date().toISOString() }),
      cache: "no-store",
      signal: ctrl.signal,
    }).finally(() => clearTimeout(timer));
  } catch {
    // silencioso de propósito: um webhook com problema nunca derruba o fluxo.
  }
}
