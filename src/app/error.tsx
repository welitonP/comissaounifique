"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-10">
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-unifique-light text-2xl">
          ⚠️
        </span>
        <h1 className="mt-4 text-xl font-bold text-unifique">Algo não carregou</h1>
        <p className="mt-2 text-gray-600">
          Tivemos um problema ao processar esta ação. Nada foi perdido. Tente novamente e, se a
          foto for muito pesada, escolha uma imagem menor.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-unifique px-5 py-2.5 font-display font-semibold text-white hover:bg-unifique-dark"
          >
            Tentar de novo
          </button>
          <Link
            href="/"
            className="rounded-xl border border-gray-300 px-5 py-2.5 font-medium text-gray-600 hover:bg-gray-50"
          >
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
