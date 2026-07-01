"use client";

import { useActionState } from "react";
import { askAssistant, type AssistantState } from "@/lib/ai-actions";

const SUGESTOES = [
  "Quem está com a bolsa de uniforme?",
  "Quando é o próximo jogo?",
  "Quantas bolas de futsal temos?",
  "Quais itens estão emprestados?",
];

export default function AssistantChat() {
  const [state, formAction, pending] = useActionState<AssistantState | null, FormData>(
    askAssistant,
    null,
  );

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-3 rounded-lg bg-white p-4 shadow-sm">
        <textarea
          name="question"
          rows={3}
          required
          placeholder="Pergunte algo sobre materiais, uniformes, jogos, atletas..."
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark disabled:opacity-60"
          >
            {pending ? "Pensando..." : "Perguntar"}
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        {SUGESTOES.map((s) => (
          <form action={formAction} key={s}>
            <input type="hidden" name="question" value={s} />
            <button
              type="submit"
              disabled={pending}
              className="rounded-full border border-unifique-blue/40 bg-unifique-light px-3 py-1 text-xs text-unifique hover:bg-unifique-blue/10 disabled:opacity-60"
            >
              {s}
            </button>
          </form>
        ))}
      </div>

      {state?.error && (
        <p className="rounded bg-red-100 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}

      {state?.answer && (
        <div className="rounded-lg border-l-4 border-unifique-blue bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {state.question}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-gray-800">{state.answer}</p>
        </div>
      )}
    </div>
  );
}
