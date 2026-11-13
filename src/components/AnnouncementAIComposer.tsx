"use client";

import { useActionState, useEffect, useState } from "react";
import { generateAnnouncement, type ComposeState } from "@/lib/ai-actions";
import { createAnnouncement } from "@/lib/actions";
import Campo from "@/components/admin/Campo";

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
      <h2 className="cartao-titulo">Gerar comunicado com IA</h2>
      <p className="text-xs text-gray-500">
        Descreva o assunto em poucas palavras e a IA escreve o comunicado. Depois é só revisar e
        publicar.
      </p>

      <form action={formAction} className="mt-3 flex flex-wrap items-end gap-2">
        <Campo rotulo="Sobre o que é o comunicado?" className="flex-1">
          <input
            name="topic"
            placeholder="Ex: treino de futsal cancelado na quinta por causa da chuva"
            className="campo"
          />
        </Campo>
        <button
          type="submit"
          disabled={pending}
          className="btn-azul min-h-[42px]"
        >
          {pending ? "Gerando..." : "Gerar"}
        </button>
      </form>

      {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}

      {(title || body) && (
        <form action={createAnnouncement} className="mt-4 space-y-2 border-t border-unifique-blue/20 pt-3">
          <Campo rotulo="Título">
            <input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="campo"
            />
          </Campo>
          <Campo rotulo="Mensagem">
            <textarea
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              required
              className="campo"
            />
          </Campo>
          <button
            type="submit"
            className="btn-primario"
          >
            Publicar comunicado
          </button>
        </form>
      )}
    </section>
  );
}
