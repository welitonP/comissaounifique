const MENSAGENS: Record<string, string> = {
  entrada: "Entrada registrada.",
  saida: "Saída registrada.",
  excluido: "Item excluído.",
  desfeito: "Saída desfeita — o item voltou pro estoque.",
  importado: "Backup importado.",
};

const ERROS: Record<string, string> = {
  nome: "Informe o equipamento antes de salvar.",
  id: "Item não encontrado.",
  json: "Arquivo inválido — use um backup gerado pela versão antiga.",
  vazio: "O arquivo não tinha nenhum item.",
};

/** Faixa de confirmação/erro lida da query string depois de uma ação. */
export default function Aviso({
  ok,
  erro,
  quantidade,
}: {
  ok?: string;
  erro?: string;
  quantidade?: number;
}) {
  if (erro && ERROS[erro]) {
    return (
      <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
        {ERROS[erro]}
      </p>
    );
  }

  if (ok && MENSAGENS[ok]) {
    const sufixo =
      quantidade && quantidade > 1 ? ` (${quantidade} peças)` : "";
    return (
      <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
        ✓ {MENSAGENS[ok]}
        {sufixo}
      </p>
    );
  }

  return null;
}
