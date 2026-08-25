import { importarBackup } from "@/lib/actions";
import Aviso from "@/components/Aviso";

export const dynamic = "force-dynamic";

export default async function ImportarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const erro = typeof params.erro === "string" ? params.erro : undefined;

  return (
    <div className="space-y-5">
      <Aviso erro={erro} />

      <div>
        <h1 className="text-xl font-bold text-unifique">Importar backup antigo</h1>
        <p className="mt-1 text-sm text-gray-600">
          Se você já usou a primeira versão (aquele HTML que rodava direto no
          navegador), clique em <b>Backup</b> lá, abra o arquivo <code>.json</code> num
          editor de texto e cole o conteúdo aqui. Os itens entram no banco
          compartilhado, incluindo o histórico de saídas.
        </p>
      </div>

      <form action={importarBackup} className="space-y-3">
        <textarea
          name="json"
          required
          rows={12}
          placeholder='{"itens": [...], "saidas": [...]}'
          className="w-full rounded-lg border border-gray-300 p-3 font-mono text-xs focus:border-unifique-blue focus:outline-none focus:ring-1 focus:ring-unifique-blue"
        />
        <button
          type="submit"
          className="rounded-lg bg-unifique px-4 py-2 text-sm font-semibold text-white hover:bg-unifique-dark"
        >
          Importar
        </button>
      </form>

      <p className="text-xs text-gray-500">
        Importar não apaga nada — só acrescenta. Se rodar duas vezes, os itens
        aparecem duplicados.
      </p>
    </div>
  );
}
