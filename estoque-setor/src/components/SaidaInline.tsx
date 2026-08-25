"use client";

import { useState } from "react";
import { registrarSaida } from "@/lib/actions";
import PessoaField from "./PessoaField";

/** Botão "dar saída" que abre o formulário de destino ali mesmo, na linha. */
export default function SaidaInline({ id }: { id: string }) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="rounded-lg bg-unifique-light px-3 py-1.5 text-xs font-semibold text-unifique hover:bg-unifique/10"
      >
        Dar saída
      </button>
    );
  }

  return (
    <form
      action={registrarSaida}
      className="flex flex-wrap items-center gap-2 rounded-lg bg-unifique-light/60 p-2"
    >
      <input type="hidden" name="id" value={id} />
      <input
        name="destino"
        autoFocus
        maxLength={200}
        placeholder="Pra onde foi? (cliente, instalado...)"
        className="min-w-[180px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-unifique-blue focus:outline-none focus:ring-1 focus:ring-unifique-blue"
      />
      <PessoaField className="w-32" />
      <button
        type="submit"
        className="rounded-lg bg-unifique px-3 py-2 text-xs font-semibold text-white hover:bg-unifique-dark"
      >
        Confirmar
      </button>
      <button
        type="button"
        onClick={() => setAberto(false)}
        className="px-2 py-2 text-xs text-gray-500 hover:text-gray-800"
      >
        Cancelar
      </button>
    </form>
  );
}
