"use client";

import { useActionState, useState } from "react";
import { Settings, X } from "lucide-react";
import { updateEventAction, type ActionState } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";

type EventForm = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  startsAt: string | null;
  endsAt: string | null;
  notes: string | null;
  archived: boolean;
};

export function EventSettings({ event, isAdmin }: { event: EventForm; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(updateEventAction, {});

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Settings size={15} />
        <span className="hidden sm:inline">Evento</span>
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Configurações do evento"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="map-panel max-h-[90dvh] w-full max-w-lg overflow-y-auto">
            <div className="side-title">
              <h2 className="flex-1">Configurações do evento</h2>
              <Button variant="ghost" size="icon" aria-label="Fechar" onClick={() => setOpen(false)}>
                <X size={16} />
              </Button>
            </div>

            <form action={action} className="edit-form">
              <input type="hidden" name="id" value={event.id} />

              <Field label="Nome">
                <Input name="name" defaultValue={event.name} maxLength={120} required />
              </Field>

              <div className="form-grid">
                <Field label="Cidade">
                  <Input name="city" defaultValue={event.city ?? ""} maxLength={80} />
                </Field>
                <Field label="Endereço">
                  <Input name="address" defaultValue={event.address ?? ""} maxLength={200} />
                </Field>
              </div>

              <div className="form-grid">
                <Field label="Início">
                  <Input name="startsAt" type="date" defaultValue={event.startsAt ?? ""} />
                </Field>
                <Field label="Término">
                  <Input name="endsAt" type="date" defaultValue={event.endsAt ?? ""} />
                </Field>
              </div>

              <Field
                label="Planta (versão em uso)"
                hint="Enviar uma nova imagem substitui a planta atual. As posições ficam em porcentagem, então continuam válidas se o enquadramento for o mesmo."
              >
                <Input name="plan" type="file" accept="image/png,image/jpeg,image/webp,image/avif" />
              </Field>

              <Field
                label="Planta original"
                hint="Opcional. Fica disponível no botão “Ver original” para comparar com a versão tratada."
              >
                <Input
                  name="planOriginal"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                />
              </Field>

              <Field label="Observações">
                <Textarea name="notes" rows={3} defaultValue={event.notes ?? ""} maxLength={1000} />
              </Field>

              <label className="field-check">
                <input type="checkbox" name="archived" defaultChecked={event.archived} />
                <span>
                  <b>Arquivar evento</b>
                  <small>Some da frente da lista, mas continua acessível pelo link.</small>
                </span>
              </label>

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
                  {pending ? "Salvando…" : "Salvar evento"}
                </Button>
                <Button type="button" size="md" onClick={() => setOpen(false)}>
                  Fechar
                </Button>
              </div>

              {isAdmin ? (
                <p className="micro">
                  Para excluir o evento em definitivo, use a área de administração — a
                  exclusão apaga pontos, equipamentos, cabos e histórico junto.
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
