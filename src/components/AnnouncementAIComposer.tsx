"use client";

import { useActionState, useEffect, useState } from "react";
import { generateAnnouncement, type ComposeState } from "@/lib/ai-actions";
import { createAnnouncement } from "@/lib/actions";

export default function AnnouncementAIComposer() {
  const [state, formAction, pending] = useActionState<ComposeState | null, FormData>(
    generateAnnouncement,
    null,
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (state?.title) setTitle(state.title);
    if (state?.body) setBody(state.body);
  }, [state]);

  return (
    <section className="rounded-lg border border-unifique-blue/30 bg-unifique-light p-4">
      <h2 className="font-semibold text-unifique">Gerar comunicado com IA</h2>
      <p className="text-xs text-gray-500">
        Descreva o assunto em poucas palavras e a IA escreve o comunicado. Depois é só revisar e
        publicar.
      </p>

      <form action={formAction} className="mt-3 flex flex-wrap gap-2">
        <input
          name="topic"
          placeholder="Ex: treino de futsal cancelado na quinta por causa da chuva"
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-unifique-blue px-4 py-2 text-sm font-medium text-white hover:bg-unifique disabled:opacity-60"
        >
          {pending ? "Gerando..." : "Gerar"}
        </button>
      </form>

      {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}

      {(title || body) && (
        <form action={createAnnouncement} className="mt-4 space-y-2 border-t border-unifique-blue/20 pt-3">
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            required
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
          <textarea
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            required
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
          <button
            type="submit"
            className="rounded bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark"
          >
            Publicar comunicado
          </button>
        </form>
      )}
    </section>
  );
}
