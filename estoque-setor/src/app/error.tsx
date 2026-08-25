"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h1 className="text-lg font-bold text-red-800">Não deu pra carregar</h1>
      <p className="mt-2 text-sm text-red-700">
        Normalmente é conexão com o banco de dados. Confira se as variáveis{" "}
        <code>DATABASE_URL</code> e <code>DIRECT_URL</code> estão configuradas e se
        as tabelas já foram criadas com <code>npm run db:push</code>.
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
      >
        Tentar de novo
      </button>
    </div>
  );
}
