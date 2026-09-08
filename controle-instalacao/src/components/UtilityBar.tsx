"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  History,
  Printer,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { importCsvAction, undoLastChangeAction, type ActionState } from "@/lib/actions";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import type { BoardEvent } from "@/lib/board-types";

export function UtilityBar({ event, canUndo }: { event: BoardEvent; canUndo: boolean }) {
  const [undoState, undoAction, undoing] = useActionState<ActionState, FormData>(
    undoLastChangeAction,
    {},
  );
  const [importOpen, setImportOpen] = useState(false);

  return (
    <section className="utility-bar no-print">
      <form action={undoAction}>
        <input type="hidden" name="eventId" value={event.id} />
        <Button type="submit" size="sm" disabled={!canUndo || undoing}>
          <Undo2 size={14} /> {undoing ? "Desfazendo…" : "Desfazer"}
        </Button>
      </form>

      <Button size="sm" onClick={() => setImportOpen(true)}>
        <Upload size={14} /> Importar
      </Button>

      <a className={buttonClass()} href={`/api/export/${event.slug}/pontos`}>
        <FileSpreadsheet size={14} /> Pontos CSV
      </a>
      <a className={buttonClass()} href={`/api/export/${event.slug}/equipamentos`}>
        <FileSpreadsheet size={14} /> Equipamentos CSV
      </a>
      <a className={buttonClass()} href={`/api/export/${event.slug}/cabos`}>
        <FileSpreadsheet size={14} /> Cabos CSV
      </a>
      <a className={buttonClass()} href={`/api/backup/${event.slug}`}>
        <Download size={14} /> Backup
      </a>

      <Button size="sm" onClick={() => window.print()}>
        <Printer size={14} /> Imprimir
      </Button>

      <Link className={buttonClass()} href={`/eventos/${event.slug}/historico`}>
        <History size={14} /> Histórico
      </Link>

      <p className="micro flex-1 text-right">
        {undoState.error ?? undoState.ok ?? "Cada alteração é salva no controle compartilhado."}
      </p>

      {importOpen ? <ImportDialog event={event} onClose={() => setImportOpen(false)} /> : null}
    </section>
  );
}

function ImportDialog({ event, onClose }: { event: BoardEvent; onClose: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(importCsvAction, {});
  const dialogRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Importar CSV"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="map-panel w-full max-w-md">
        <div className="side-title">
          <h2 className="flex-1">Importar CSV</h2>
          <Button variant="ghost" size="icon" aria-label="Fechar" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        <form action={action} className="edit-form">
          <input type="hidden" name="eventId" value={event.id} />

          <Field label="O que está importando?">
            <Select name="kind" defaultValue="point">
              <option value="point">Pontos (APs)</option>
              <option value="equipment">Equipamentos</option>
              <option value="cable">Cabos</option>
            </Select>
          </Field>

          <Field
            label="Arquivo CSV"
            hint="Separador ; ou vírgula. Linhas com número já existente são atualizadas; as demais são criadas."
          >
            <Input name="file" type="file" accept=".csv,text/csv" required />
          </Field>

          <p className="micro">
            Colunas aceitas: <b>numero</b>, <b>nome</b>, <b>setor</b>, <b>situacao</b>,{" "}
            <b>x</b>, <b>y</b>, <b>posicao</b>, <b>responsavel</b>, <b>observacoes</b>. Baixe
            um export para usar como modelo.
          </p>

          {state.error ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {state.error}
            </p>
          ) : null}
          {state.ok ? (
            <p className="text-sm text-[var(--color-active)]" role="status">
              {state.ok}
            </p>
          ) : null}

          <div className="editor-actions">
            <Button type="submit" variant="primary" size="md" disabled={pending}>
              <Upload size={15} /> {pending ? "Importando…" : "Importar"}
            </Button>
            <Button type="button" size="md" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
