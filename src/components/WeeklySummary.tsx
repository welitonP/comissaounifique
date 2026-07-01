"use client";

import { useActionState } from "react";
import { weeklySummary, type SummaryState } from "@/lib/ai-actions";

export default function WeeklySummary() {
  const [state, formAction, pending] = useActionState<SummaryState | null, FormData>(
    weeklySummary,
    null,
  );

  return (
    <section className="rounded-lg border-t-4 border-unifique-green bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-unifique">Resumo da semana (IA)</h2>
        <form action={formAction}>
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-unifique px-3 py-1.5 text-sm font-medium text-white hover:bg-unifique-dark disabled:opacity-60"
          >
            {pending ? "Gerando..." : "Gerar resumo"}
          </button>
        </form>
      </div>

      {state?.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}

      {state?.summary ? (
        <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{state.summary}</p>
      ) : (
        !state?.error && (
          <p className="mt-3 text-sm text-gray-400">
            Clique em “Gerar resumo” para a IA montar um apanhado dos próximos eventos e pendências.
          </p>
        )
      )}
    </section>
  );
}
