"use client";

import { useState } from "react";
import { updatePoll } from "@/lib/actions";

type Poll = {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
};

export default function PollEditForm({ poll }: { poll: Poll }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setEditing((v) => !v)}
        className="text-sm font-medium text-unifique-blue hover:underline"
      >
        {editing ? "Fechar edição" : "Editar enquete"}
      </button>

      {editing && (
        <form
          action={updatePoll}
          className="mt-3 space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
        >
          <input type="hidden" name="id" value={poll.id} />
          <input type="hidden" name="optionIds" value={poll.options.map((o) => o.id).join(",")} />

          <div>
            <label className="block text-xs font-medium text-gray-500">Pergunta</label>
            <input
              name="question"
              defaultValue={poll.question}
              required
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500">
              Opções <span className="font-normal text-gray-400">(marque para remover)</span>
            </label>
            <div className="mt-1 space-y-2">
              {poll.options.map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <input
                    name={`opt_${o.id}`}
                    defaultValue={o.text}
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                  <span className="whitespace-nowrap text-xs text-gray-400">{o.votes} voto(s)</span>
                  <label className="flex items-center gap-1 text-xs text-red-600">
                    <input type="checkbox" name="removeOption" value={o.id} className="h-3 w-3" />
                    remover
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500">
              Adicionar opções <span className="font-normal text-gray-400">(uma por linha)</span>
            </label>
            <textarea
              name="newOptions"
              rows={2}
              placeholder={"Ex:\nBeach Tennis\nPadel"}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="rounded bg-unifique px-4 py-2 text-sm font-medium text-white hover:bg-unifique-dark"
          >
            Salvar enquete
          </button>
        </form>
      )}
    </div>
  );
}
