import Cabecalho from "@/components/Cabecalho";
import Rodape from "@/components/Rodape";
import { getConfig } from "@/lib/config";

export default async function LayoutSite({ children }: { children: React.ReactNode }) {
  const config = await getConfig();

  return (
    <div className="flex min-h-screen flex-col">
      <Cabecalho nome={config.nome} />
      <main className="flex-1">{children}</main>
      <Rodape config={config} />
    </div>
  );
}
