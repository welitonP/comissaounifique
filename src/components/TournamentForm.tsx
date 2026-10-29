"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  CalendarClock,
  FileText,
  Image as ImageIcon,
  ListChecks,
  Paperclip,
  Sparkles,
  Type,
} from "lucide-react";
import { createTournament, updateTournament } from "@/lib/actions";
import { generateTournamentText, type TournamentComposeState } from "@/lib/ai-actions";
import PhotoField from "@/components/PhotoField";

export type TournamentData = {
  id: string;
  title: string;
  description: string;
  location: string;
  questions: string;
  categories: string;
  rules: string;
  dateLocal: string;
  hasPhoto: boolean;
  rulesFileName: string | null;
};

const campo =
  "mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-unifique focus:outline-none focus:ring-2 focus:ring-unifique/15";
const rotulo = "block text-sm font-semibold text-gray-700";
const ajuda = "mt-1 text-xs text-gray-500";

const RULES_MAX_MB = 3;

function Secao({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Type;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-unifique-light text-unifique">
          <Icon size={18} />
        </span>
        <div>
          <h3 className="font-display font-semibold text-unifique">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function BotaoSalvar({ editando }: { editando: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-unifique px-6 py-2.5 font-display font-semibold text-white shadow transition hover:bg-unifique-dark disabled:opacity-60"
    >
      {pending ? "Salvando..." : editando ? "Salvar alterações" : "Criar torneio"}
    </button>
  );
}

// Campo de arquivo do regulamento (PDF ou imagem), com validação de tamanho
// no navegador para avisar antes de enviar.
function CampoArquivoRegulamento({ atual }: { atual: string | null }) {
  const [nome, setNome] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  return (
    <div>
      <label className={rotulo}>
        Arquivo do regulamento <span className="font-normal text-gray-400">(opcional)</span>
      </label>
      {atual && (
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
          <Paperclip size={15} className="text-unifique" />
          <span className="min-w-0 flex-1 truncate font-medium text-gray-700">{atual}</span>
          <label className="flex items-center gap-1.5 text-xs text-red-600">
            <input type="checkbox" name="removeRulesFile" value="1" /> Remover
          </label>
        </div>
      )}
      <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 px-4 py-4 text-sm text-gray-600 transition hover:border-unifique hover:bg-unifique-light/40">
        <Paperclip size={18} className="text-unifique" />
        <span className="min-w-0 flex-1 truncate">
          {nome ?? (atual ? "Trocar arquivo (PDF ou imagem)" : "Anexar PDF ou imagem")}
        </span>
        <span className="text-xs text-gray-400">até {RULES_MAX_MB} MB</span>
        <input
          type="file"
          name="rulesFile"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setErro(null);
            if (!f) return setNome(null);
            if (f.size > RULES_MAX_MB * 1024 * 1024) {
              setErro(`O arquivo tem ${(f.size / 1024 / 1024).toFixed(1)} MB. O limite é ${RULES_MAX_MB} MB.`);
              e.target.value = "";
              return setNome(null);
            }
            setNome(f.name);
          }}
        />
      </label>
      {erro && <p className="mt-1 text-xs font-medium text-red-600">{erro}</p>}
      <p className={ajuda}>
        Na página do torneio aparece o botão &quot;Ver regulamento&quot;, que abre o texto e o arquivo numa janela.
      </p>
    </div>
  );
}

export default function TournamentForm({ tournament }: { tournament?: TournamentData }) {
  const editando = !!tournament;
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

  return (
    <div className="space-y-5">
      {/* Ajuda da IA (fica fora do formulário principal) */}
      <details className="group rounded-2xl border border-unifique-blue/30 bg-unifique-light/50 p-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-unifique">
          <Sparkles size={16} /> Escrever título e descrição com IA
          <span className="ml-auto text-xs font-normal text-gray-500 group-open:hidden">abrir</span>
        </summary>
        <p className="mt-2 text-xs text-gray-500">
          Descreva o torneio em poucas palavras e a IA preenche o título e a descrição abaixo.
        </p>
        <form action={gerar} className="mt-2 flex flex-wrap gap-2">
          <input
            name="topic"
            placeholder="Ex: torneio de futvôlei em duplas, sábado às 14h, na areia"
            className={`${campo} mt-0 flex-1`}
          />
          <button
            type="submit"
            disabled={gerando}
            className="rounded-xl bg-unifique-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-unifique disabled:opacity-60"
          >
            {gerando ? "Gerando..." : "Gerar"}
          </button>
        </form>
        {ia?.error && <p className="mt-1 text-xs text-red-600">{ia.error}</p>}
      </details>

      <form action={editando ? updateTournament : createTournament} className="space-y-5">
        {editando && <input type="hidden" name="id" value={tournament!.id} />}

        <Secao icon={Type} title="Informações" subtitle="O que aparece no topo da página do torneio.">
          <div>
            <label className={rotulo}>
              Título <span className="text-unifique-blue">*</span>
            </label>
            <input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Torneio de Truco"
              required
              className={campo}
            />
          </div>
          <div>
            <label className={rotulo}>
              Descrição <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Um resumo convidativo: formato, premiação, quem pode participar..."
              className={campo}
            />
          </div>
        </Secao>

        <Secao icon={CalendarClock} title="Data e local" subtitle="Com data, o torneio entra no calendário e na home.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={rotulo}>Data e hora</label>
              <input
                type="datetime-local"
                name="date"
                defaultValue={tournament?.dateLocal ?? ""}
                className={campo}
              />
            </div>
            <div>
              <label className={rotulo}>Local</label>
              <input
                name="location"
                defaultValue={tournament?.location ?? ""}
                placeholder="Ex: Arena Passeboll"
                className={campo}
              />
            </div>
          </div>
        </Secao>

        <Secao icon={ListChecks} title="Inscrição" subtitle="Como a galera se inscreve e como a lista fica organizada.">
          <div>
            <label className={rotulo}>
              Categorias <span className="font-normal text-gray-400">(uma por linha)</span>
            </label>
            <textarea
              name="categories"
              defaultValue={tournament?.categories ?? ""}
              rows={2}
              placeholder={"Ex:\nFeminino\nMasculino"}
              className={campo}
            />
            <p className={ajuda}>
              Se preencher, o atleta escolhe a categoria (obrigatório) e os inscritos ficam separados.
            </p>
          </div>
          <div>
            <label className={rotulo}>
              Perguntas extras <span className="font-normal text-gray-400">(uma por linha)</span>
            </label>
            <textarea
              name="questions"
              defaultValue={tournament?.questions ?? ""}
              rows={3}
              placeholder={"Ex:\nTem dupla?\nQual o nome da sua dupla?"}
              className={campo}
            />
            <p className={ajuda}>Aparecem no formulário de inscrição como campos opcionais.</p>
          </div>
        </Secao>

        <Secao icon={FileText} title="Regulamento" subtitle="Texto e/ou arquivo. Abre numa janela na página do torneio.">
          <div>
            <label className={rotulo}>
              Texto do regulamento <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              name="rules"
              defaultValue={tournament?.rules ?? ""}
              rows={7}
              placeholder={"1) Duplas fixas.\n2) Partidas em melhor de 3.\n3) Tolerância de 10 minutos, depois é W.O."}
              className={`${campo} font-mono text-[13px]`}
            />
          </div>
          <CampoArquivoRegulamento atual={tournament?.rulesFileName ?? null} />
        </Secao>

        <Secao icon={ImageIcon} title="Cartaz" subtitle="Imagem de capa do torneio e do link compartilhado no WhatsApp.">
          {editando && tournament!.hasPhoto && (
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/torneio-foto/${tournament!.id}`}
                alt="Cartaz atual"
                className="h-16 w-24 rounded-lg object-cover"
              />
              <span className="flex-1 text-sm text-gray-600">Cartaz atual</span>
              <label className="flex items-center gap-1.5 pr-2 text-xs text-red-600">
                <input type="checkbox" name="removePhoto" value="1" /> Remover
              </label>
            </div>
          )}
          <PhotoField
            name="photo"
            multiple={false}
            label={editando && tournament!.hasPhoto ? "Trocar o cartaz" : "Enviar cartaz"}
            help="É reduzido automaticamente antes do envio."
          />
        </Secao>

        {/* Barra de ações fixa no rodapé da tela */}
        <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-3 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:shadow-md">
          <Link
            href={editando ? `/admin/torneios/${tournament!.id}` : "/admin/torneios"}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </Link>
          <BotaoSalvar editando={editando} />
        </div>
      </form>
    </div>
  );
}
