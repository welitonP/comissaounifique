// Tela de carregamento global: aparece na hora em que o usuário clica,
// enquanto o servidor busca os dados. Dá a sensação de resposta imediata.
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando">
      {/* faixa/título */}
      <div className="skeleton h-28 w-full rounded-2xl" />

      {/* linha de blocos */}
      <div className="grid grid-cols-3 gap-3">
        <div className="skeleton h-20 rounded-2xl" />
        <div className="skeleton h-20 rounded-2xl" />
        <div className="skeleton h-20 rounded-2xl" />
      </div>

      {/* cartões */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-24 rounded-2xl" />
      </div>
    </div>
  );
}
