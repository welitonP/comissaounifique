"use client";

import { useActionState, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { createTournament, updateTournament } from "@/lib/actions";
import { generateTournamentText, type TournamentComposeState } from "@/lib/ai-actions";

type TournamentData = {
  id: string;
  title: string;
  description: string;
  location: string;
  questions: string;
  dateLocal: string;
};

export default function TournamentForm({ tournament }: { tournament?: TournamentData }) {
  const editando = !!tournament;
  const [aberto, setAberto] = useState(!editando);
  const [title, setTitle] = useState(tournament?.title ?? "");
  const [description, setDescription] = useState(tournament?.description ?? "");

  const [ia, gerar, gerando] = useActionState<TournamentComposeState | null, FormData>(
    generateTournamentText,
    null,
  );
  useEffect(() => {
    if (ia?.title) setTitle(ia.title);
    if (ia?.description) setDescription(ia.description);
  }, [ia]);

  if (editando && !aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="mt-3 text-sm font-medium text-unifique-blue hover:underline"
      >
        Editar torneio
      </button>
    );
  }

  return (
    <div className={editando ? "mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3" : "rounded-xl bg-white p-4 shadow-sm"}>
      {!editando && <h2 className="font-semibold text-unifique">Novo torneio</h2>}

      {/* Ajuda da IA para escrever o texto */}
      <div className="mt-2 rounded-lg border border-unifique-blue/30 bg-unifique-light/60 p-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-unifique">
          <Sparkles size={15} /> Escrever com IA
        </p>
        <p className="text-xs text-gray-500">
          Descreva o torneio em poucas palavras que a IA monta o título e o texto.
        </p>
        <form action={gerar} className="mt-2 flex flex-wrap gap-2">
          <input
            name="topic"
            placeholder="Ex: torneio de futvôlei em duplas, sábado às 14h, na areia"
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={gerando}
            className="rounded bg-unifique-blue px-4 py-2 text-sm font-medium text-white hover:bg-unifique disabled:opacity-60"
          >
            {gerando ? "Gerando..." : "Gerar"}
          </button>
        </form>
        {ia?.error && <p className="mt-1 text-xs text-red-600">{ia.error}</p>}
      </div>

      {/* Formulário do torneio */}
      <form
        action={editando ? updateTournament : createTournament}
        className="mt-3 space-y-3"
      >
        {editando && <input type="hidden" name="id" value={tournament!.id} />}
        <div>
          <label className="block text-xs font-medium text-gray-500">Título</label>
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Torneio de Truco"
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">
            Descrição <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Formato, premiação, regras..."
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-500">Data e hora (opcional)</label>
            <input
              type="datetime-local"
              name="date"
              defaultValue={tournament?.dateLocal ?? ""}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Local (opcional)</label>
            <input
              name="location"
              defaultValue={tournament?.location ?? ""}
              placeholder="Ex: Sede da comissão"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">
            Perguntas extras na inscrição{" "}
            <span className="font-normal text-gray-400">(uma por linha, opcional)</span>
          </label>
          <textarea
            name="questions"
            defaultValue={tournament?.questions ?? ""}
            rows={3}
            placeholder={"Ex:\nTem dupla? Quem é?\nJá tem time formado? Qual?"}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-gray-400">
            Essas perguntas aparecem no formulário de inscrição (o atleta responde se quiser).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark"
          >
            {editando ? "Salvar alterações" : "Criar torneio"}
          </button>
          {editando && (
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
