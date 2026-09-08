"use client";

import { useActionState, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { createEventAction, type ActionState } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

export function NewEventDialog({ events }: { events: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(createEventAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <Button variant="primary" size="md" onClick={() => setOpen(true)}>
        <Plus size={16} /> Novo evento
      </Button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Novo evento"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="map-panel max-h-[90dvh] w-full max-w-lg overflow-y-auto">
        <div className="side-title">
          <h2 className="flex-1">Novo evento</h2>
          <Button variant="ghost" size="icon" aria-label="Fechar" onClick={() => setOpen(false)}>
            <X size={16} />
          </Button>
        </div>

        <form ref={formRef} action={action} className="edit-form">
          <Field label="Nome do evento">
            <Input name="name" required maxLength={120} placeholder="Ex.: Expo 2027" />
          </Field>

          <div className="form-grid">
            <Field label="Cidade">
              <Input name="city" maxLength={80} placeholder="Videira, SC" />
            </Field>
            <Field label="Endereço">
              <Input name="address" maxLength={200} placeholder="Rua Dez de Setembro" />
            </Field>
          </div>

          <div className="form-grid">
            <Field label="Início">
              <Input name="startsAt" type="date" />
            </Field>
            <Field label="Término">
              <Input name="endsAt" type="date" />
            </Field>
          </div>

          <Field
            label="Planta do local"
            hint="PNG, JPG, WEBP ou AVIF, até 10 MB. Dá para enviar depois."
          >
            <Input name="plan" type="file" accept="image/png,image/jpeg,image/webp,image/avif" />
          </Field>

          {events.length > 0 ? (
            <Field
              label="Clonar de um evento anterior"
              hint="Traz APs, equipamentos e cabos com as posições — todos entram como pendentes e com a posição a conferir."
            >
              <Select name="cloneFrom" defaultValue="">
                <option value="">Começar do zero</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          <Field label="Observações">
            <Textarea name="notes" rows={2} maxLength={1000} placeholder="Contato do local, particularidades da instalação…" />
          </Field>

          {state.error ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {state.error}
            </p>
          ) : null}

          <div className="editor-actions">
            <Button type="submit" variant="primary" size="md" disabled={pending}>
              <Plus size={16} />
              {pending ? "Criando…" : "Criar evento"}
            </Button>
            <Button type="button" size="md" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
