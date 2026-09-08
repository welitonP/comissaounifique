"use client";

import { useActionState, useEffect, useState } from "react";
import { ArrowLeft, Move, Save, Trash2 } from "lucide-react";
import {
  deleteCableAction,
  deleteEquipmentAction,
  deletePointAction,
  saveCableAction,
  saveEquipmentAction,
  savePointAction,
  type ActionState,
} from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { CABLE_STATUS, EQUIPMENT_STATUS, POINT_STATUS } from "@/lib/types";
import type { BoardCable, BoardEquipment, BoardPoint, Selection } from "@/lib/board-types";

type Props = {
  eventId: string;
  selection: Selection;
  points: BoardPoint[];
  equipments: BoardEquipment[];
  cables: BoardCable[];
  draftPosition: { x: number; y: number } | null;
  placing: boolean;
  onPositionChange: (position: { x: number; y: number }) => void;
  onTogglePlacing: () => void;
  onClose: () => void;
};

export function EditorPanel(props: Props) {
  const { selection } = props;

  if (!selection) {
    return <EmptyPanel />;
  }

  if (selection.kind === "point" || selection.kind === "new-point") {
    const point =
      selection.kind === "point" ? props.points.find((item) => item.id === selection.id) : undefined;
    // O item pode ter acabado de ser excluído por este ou por outro usuário.
    if (selection.kind === "point" && !point) return <EmptyPanel />;
    return <PointForm key={point?.id ?? "new-point"} point={point} {...props} />;
  }

  if (selection.kind === "equipment" || selection.kind === "new-equipment") {
    const equipment =
      selection.kind === "equipment"
        ? props.equipments.find((item) => item.id === selection.id)
        : undefined;
    if (selection.kind === "equipment" && !equipment) return <EmptyPanel />;
    return <EquipmentForm key={equipment?.id ?? "new-equipment"} equipment={equipment} {...props} />;
  }

  const cable = props.cables.find((item) => item.id === selection.id);
  if (!cable) return <EmptyPanel />;
  return <CableForm key={cable.id} cable={cable} {...props} />;
}

function EmptyPanel() {
  return (
      <aside className="side-panel">
        <div className="side-title">
          <h2>Detalhes</h2>
        </div>
        <div className="edit-form">
          <p className="micro">
            Clique em um AP, equipamento ou cabo do mapa para editar. Use os botões
            abaixo do mapa para adicionar um item novo.
          </p>
        </div>
      </aside>
  );
}

// ------------------------------------------------------------------- APs

function PointForm({
  point,
  eventId,
  draftPosition,
  placing,
  onPositionChange,
  onTogglePlacing,
  onClose,
}: Props & { point?: BoardPoint }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(savePointAction, {});
  const [removeState, removeAction, removing] = useActionState<ActionState, FormData>(
    deletePointAction,
    {},
  );

  const position = draftPosition ?? { x: point?.x ?? 50, y: point?.y ?? 50 };

  // Depois de cadastrar, fecha o painel: reabrir "Novo AP" começa em branco.
  useEffect(() => {
    if (state.ok && !point) onClose();
  }, [state.ok, point, onClose]);

  return (
    <aside className="side-panel">
      <div className="side-title">
        <Button variant="ghost" size="icon" aria-label="Voltar para a lista" onClick={onClose}>
          <ArrowLeft size={16} />
        </Button>
        <h2 className="flex-1">{point ? `Editar AP #${point.number}` : "Novo AP"}</h2>
      </div>

      <form action={action} className="edit-form">
        <input type="hidden" name="eventId" value={eventId} />
        {point ? <input type="hidden" name="id" value={point.id} /> : null}

        <div className="form-grid">
          <Field label="Número">
            <Input name="number" type="number" min={1} max={9999} defaultValue={point?.number ?? ""} />
          </Field>
          <Field label="Setor">
            <Input name="sector" defaultValue={point?.sector ?? ""} maxLength={80} />
          </Field>
        </div>

        <Field label="Nome do ponto">
          <Input name="name" defaultValue={point?.name ?? ""} maxLength={120} required />
        </Field>

        <fieldset>
          <legend className="mb-1.5 text-xs font-semibold">Situação</legend>
          <div className="status-options">
            {(Object.keys(POINT_STATUS) as (keyof typeof POINT_STATUS)[]).map((key) => (
              <label key={key} className={POINT_STATUS[key].css}>
                <input
                  type="radio"
                  name="status"
                  value={key}
                  defaultChecked={(point?.status ?? "PENDING") === key}
                />
                <span>
                  <b>{POINT_STATUS[key].label}</b>
                  <small>{POINT_STATUS[key].hint}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="field-check">
          <input
            type="checkbox"
            name="positionChecked"
            defaultChecked={point?.positionChecked ?? false}
          />
          <span>
            <b>Posição conferida em campo</b>
            <small>Desmarque se este marcador ainda precisar de ajuste na planta.</small>
          </span>
        </label>

        <Field label="Responsável ou equipe">
          <Input name="owner" defaultValue={point?.owner ?? ""} maxLength={80} />
        </Field>

        <Field label="Observações">
          <Textarea
            name="notes"
            rows={3}
            defaultValue={point?.notes ?? ""}
            maxLength={1000}
            placeholder="Cabo, porta, equipamento ou pendência…"
          />
        </Field>

        <PositionFields position={position} onChange={onPositionChange} />

        {point ? (
          <p className="micro">
            Última alteração: {new Date(point.updatedAt).toLocaleString("pt-BR")}
          </p>
        ) : null}

        <Message state={state} fallback={removeState} />

        <div className="editor-actions">
          <Button type="submit" variant="primary" size="md" disabled={pending}>
            <Save size={15} /> {pending ? "Salvando…" : "Salvar ponto"}
          </Button>
          <Button type="button" size="md" onClick={onTogglePlacing}>
            <Move size={15} /> {placing ? "Concluir" : "Mover no mapa"}
          </Button>
        </div>
      </form>

      {point ? (
        <form action={removeAction} className="border-t px-3.5 py-3">
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="id" value={point.id} />
          <Button type="submit" variant="ghost" size="sm" disabled={removing}>
            <Trash2 size={15} /> Excluir ponto
          </Button>
        </form>
      ) : null}
    </aside>
  );
}

// --------------------------------------------------------- equipamentos

function EquipmentForm({
  equipment,
  eventId,
  draftPosition,
  placing,
  onPositionChange,
  onTogglePlacing,
  onClose,
}: Props & { equipment?: BoardEquipment }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveEquipmentAction, {});
  const [removeState, removeAction, removing] = useActionState<ActionState, FormData>(
    deleteEquipmentAction,
    {},
  );

  const position = draftPosition ?? { x: equipment?.x ?? 50, y: equipment?.y ?? 50 };

  useEffect(() => {
    if (state.ok && !equipment) onClose();
  }, [state.ok, equipment, onClose]);

  return (
    <aside className="side-panel">
      <div className="side-title">
        <Button variant="ghost" size="icon" aria-label="Voltar para a lista" onClick={onClose}>
          <ArrowLeft size={16} />
        </Button>
        <h2 className="flex-1">
          {equipment ? `Editar equipamento E${equipment.number}` : "Novo equipamento"}
        </h2>
      </div>

      <form action={action} className="edit-form">
        <input type="hidden" name="eventId" value={eventId} />
        {equipment ? <input type="hidden" name="id" value={equipment.id} /> : null}

        <div className="form-grid">
          <Field label="Número">
            <Input
              name="number"
              type="number"
              min={1}
              max={9999}
              defaultValue={equipment?.number ?? ""}
            />
          </Field>
          <Field label="Setor">
            <Input name="sector" defaultValue={equipment?.sector ?? ""} maxLength={80} />
          </Field>
        </div>

        <Field label="Nome do equipamento">
          <Input name="name" defaultValue={equipment?.name ?? ""} maxLength={120} required />
        </Field>

        <Field label="Tipo / modelo" hint="Ex.: Switch 24P + RB + ZTE">
          <Input name="kind" defaultValue={equipment?.kind ?? ""} maxLength={120} />
        </Field>

        <fieldset>
          <legend className="mb-1.5 text-xs font-semibold">Situação</legend>
          <div className="status-options">
            {(Object.keys(EQUIPMENT_STATUS) as (keyof typeof EQUIPMENT_STATUS)[]).map((key) => (
              <label key={key} className={EQUIPMENT_STATUS[key].css}>
                <input
                  type="radio"
                  name="status"
                  value={key}
                  defaultChecked={(equipment?.status ?? "PLANNED") === key}
                />
                <span>
                  <b>{EQUIPMENT_STATUS[key].label}</b>
                  <small>{EQUIPMENT_STATUS[key].hint}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="field-check">
          <input
            type="checkbox"
            name="positionChecked"
            defaultChecked={equipment?.positionChecked ?? false}
          />
          <span>
            <b>Posição conferida em campo</b>
            <small>Desmarque se este marcador ainda precisar de ajuste na planta.</small>
          </span>
        </label>

        <Field label="Responsável ou equipe">
          <Input name="owner" defaultValue={equipment?.owner ?? ""} maxLength={80} />
        </Field>

        <Field label="Observações">
          <Textarea
            name="notes"
            rows={3}
            defaultValue={equipment?.notes ?? ""}
            maxLength={1000}
            placeholder="Ex.: porta 10 da RB para as câmeras"
          />
        </Field>

        <PositionFields position={position} onChange={onPositionChange} />

        <Message state={state} fallback={removeState} />

        <div className="editor-actions">
          <Button type="submit" variant="primary" size="md" disabled={pending}>
            <Save size={15} /> {pending ? "Salvando…" : "Salvar equipamento"}
          </Button>
          <Button type="button" size="md" onClick={onTogglePlacing}>
            <Move size={15} /> {placing ? "Concluir" : "Mover no mapa"}
          </Button>
        </div>
      </form>

      {equipment ? (
        <form action={removeAction} className="border-t px-3.5 py-3">
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="id" value={equipment.id} />
          <Button type="submit" variant="ghost" size="sm" disabled={removing}>
            <Trash2 size={15} /> Excluir equipamento
          </Button>
        </form>
      ) : null}
    </aside>
  );
}

// ----------------------------------------------------------------- cabos

function CableForm({
  cable,
  eventId,
  points,
  equipments,
  onClose,
}: Props & { cable: BoardCable }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveCableAction, {});
  const [removeState, removeAction, removing] = useActionState<ActionState, FormData>(
    deleteCableAction,
    {},
  );

  return (
    <aside className="side-panel">
      <div className="side-title">
        <Button variant="ghost" size="icon" aria-label="Voltar para a lista" onClick={onClose}>
          <ArrowLeft size={16} />
        </Button>
        <h2 className="flex-1">Editar cabo #{cable.number}</h2>
      </div>

      <form action={action} className="edit-form">
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="id" value={cable.id} />
        <input type="hidden" name="waypoints" value={JSON.stringify(cable.path)} />

        <div className="form-grid">
          <Field label="Número">
            <Input name="number" type="number" min={1} max={9999} defaultValue={cable.number} />
          </Field>
          <Field label="Tipo" hint="Ex.: CAT6 externo">
            <Input name="kind" defaultValue={cable.kind ?? ""} maxLength={80} />
          </Field>
        </div>

        <Field label="Identificação">
          <Input name="label" defaultValue={cable.label ?? ""} maxLength={120} />
        </Field>

        <div className="form-grid">
          <Field label="Sai do equipamento">
            <Select name="fromEquipmentId" defaultValue={cable.fromEquipmentId ?? ""}>
              <option value="">—</option>
              {equipments.map((equipment) => (
                <option key={equipment.id} value={equipment.id}>
                  E{equipment.number} · {equipment.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Chega no AP">
            <Select name="toPointId" defaultValue={cable.toPointId ?? ""}>
              <option value="">—</option>
              {points.map((point) => (
                <option key={point.id} value={point.id}>
                  {point.number} · {point.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-xs font-semibold">Andamento</legend>
          <div className="status-options">
            {(Object.keys(CABLE_STATUS) as (keyof typeof CABLE_STATUS)[]).map((key) => (
              <label key={key} className={CABLE_STATUS[key].css}>
                <input type="radio" name="status" value={key} defaultChecked={cable.status === key} />
                <span>
                  <b>{CABLE_STATUS[key].label}</b>
                  <small>{CABLE_STATUS[key].hint}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="form-grid">
          <Field label="Metragem (m)">
            <Input
              name="lengthMeters"
              type="number"
              min={0}
              step="0.1"
              defaultValue={cable.lengthMeters ?? ""}
            />
          </Field>
          <Field label="Responsável">
            <Input name="owner" defaultValue={cable.owner ?? ""} maxLength={80} />
          </Field>
        </div>

        <Field label="Desvios e observações">
          <Textarea name="notes" rows={3} defaultValue={cable.notes ?? ""} maxLength={1000} />
        </Field>

        <p className="micro">
          O trajeto segue o equipamento de origem e o AP de destino. Vértices
          intermediários chegam pela importação ou pelo backup.
        </p>

        <Message state={state} fallback={removeState} />

        <div className="editor-actions">
          <Button type="submit" variant="primary" size="md" disabled={pending}>
            <Save size={15} /> {pending ? "Salvando…" : "Salvar cabo"}
          </Button>
        </div>
      </form>

      <form action={removeAction} className="border-t px-3.5 py-3">
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="id" value={cable.id} />
        <Button type="submit" variant="ghost" size="sm" disabled={removing}>
          <Trash2 size={15} /> Excluir cabo
        </Button>
      </form>
    </aside>
  );
}

// ------------------------------------------------------------- auxiliares

/** Posição por teclado, espelhando o que o clique no mapa define. */
function PositionFields({
  position,
  onChange,
}: {
  position: { x: number; y: number };
  onChange: (position: { x: number; y: number }) => void;
}) {
  const [local, setLocal] = useState(position);

  useEffect(() => {
    setLocal(position);
  }, [position.x, position.y]);

  function update(axis: "x" | "y", raw: string) {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    const value = Math.round(Math.min(100, Math.max(0, parsed)) * 100) / 100;
    const next = { ...local, [axis]: value };
    setLocal(next);
    onChange(next);
  }

  return (
    <details className="rounded-lg border px-2.5 py-2">
      <summary className="cursor-pointer text-xs font-semibold">
        Posição na planta (ajuste por teclado)
      </summary>
      <div className="form-grid mt-2">
        <Field label="Horizontal (%)">
          <Input
            name="x"
            type="number"
            min={0}
            max={100}
            step="any"
            value={local.x}
            onChange={(event) => update("x", event.target.value)}
          />
        </Field>
        <Field label="Vertical (%)">
          <Input
            name="y"
            type="number"
            min={0}
            max={100}
            step="any"
            value={local.y}
            onChange={(event) => update("y", event.target.value)}
          />
        </Field>
      </div>
    </details>
  );
}

function Message({ state, fallback }: { state: ActionState; fallback: ActionState }) {
  const message = state.error ?? fallback.error ?? state.ok ?? fallback.ok;
  if (!message) return null;
  const isError = Boolean(state.error ?? fallback.error);
  return (
    <p
      className={`text-sm ${isError ? "text-[var(--color-destructive)]" : "text-[var(--color-active)]"}`}
      role={isError ? "alert" : "status"}
    >
      {message}
    </p>
  );
}
