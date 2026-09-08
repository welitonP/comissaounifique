"use client";

import { useEffect, useState } from "react";
import {
  Cable as CableIcon,
  Eye,
  EyeOff,
  Plus,
  Radio,
  Server,
} from "lucide-react";
import { MapView } from "@/components/MapView";
import { EditorPanel } from "@/components/EditorPanel";
import { UtilityBar } from "@/components/UtilityBar";
import { DataTables } from "@/components/DataTables";
import { Button } from "@/components/ui/button";
import type {
  BoardCable,
  BoardEquipment,
  BoardEvent,
  BoardPoint,
  Selection,
} from "@/lib/board-types";

type Props = {
  event: BoardEvent;
  points: BoardPoint[];
  equipments: BoardEquipment[];
  cables: BoardCable[];
  canUndo: boolean;
};

export function ControlBoard({ event, points, equipments, cables, canUndo }: Props) {
  const [selection, setSelection] = useState<Selection>(null);
  const [placing, setPlacing] = useState(false);
  const [draftPosition, setDraftPosition] = useState<{ x: number; y: number } | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [layers, setLayers] = useState({ points: true, equipments: true, cables: true });

  // Trocar de item zera a posição em edição e sai do modo "posicionar".
  useEffect(() => {
    setPlacing(false);
    if (!selection) {
      setDraftPosition(null);
      return;
    }
    if (selection.kind === "point") {
      const point = points.find((item) => item.id === selection.id);
      setDraftPosition(point ? { x: point.x, y: point.y } : null);
    } else if (selection.kind === "equipment") {
      const equipment = equipments.find((item) => item.id === selection.id);
      setDraftPosition(equipment ? { x: equipment.x, y: equipment.y } : null);
    } else if (selection.kind === "new-point" || selection.kind === "new-equipment") {
      setDraftPosition({ x: 50, y: 50 });
      setPlacing(true);
    } else {
      setDraftPosition(null);
    }
    // A dependência é a identidade do item selecionado, não a lista inteira.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection?.kind, selection && "id" in selection ? selection.id : null]);

  const planUrl = event.hasPlan
    ? `/api/planta/${event.id}${showOriginal && event.hasOriginal ? "?versao=original" : ""}`
    : null;

  function toggleLayer(key: keyof typeof layers) {
    setLayers((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <>
      <div className="work-grid">
        <section className="map-panel">
          <div className="map-toolbar">
            <div>
              <h2>Mapa operacional</h2>
              <p>
                Posicione a infraestrutura e acompanhe o andamento de cada trajeto até o AP.
              </p>
            </div>

            <div className="inline-actions no-print">
              {event.hasOriginal ? (
                <Button
                  size="sm"
                  aria-pressed={showOriginal}
                  onClick={() => setShowOriginal((value) => !value)}
                >
                  <Eye size={14} /> {showOriginal ? "Ver tratado" : "Ver original"}
                </Button>
              ) : null}
              <Button size="sm" aria-pressed={!layers.points} onClick={() => toggleLayer("points")}>
                {layers.points ? <EyeOff size={14} /> : <Eye size={14} />}
                {layers.points ? "Ocultar APs" : "Mostrar APs"}
              </Button>
              <Button
                size="sm"
                aria-pressed={!layers.equipments}
                onClick={() => toggleLayer("equipments")}
              >
                {layers.equipments ? <EyeOff size={14} /> : <Eye size={14} />}
                {layers.equipments ? "Ocultar equipamentos" : "Mostrar equipamentos"}
              </Button>
              <Button size="sm" aria-pressed={!layers.cables} onClick={() => toggleLayer("cables")}>
                {layers.cables ? <EyeOff size={14} /> : <Eye size={14} />}
                {layers.cables ? "Ocultar cabos" : "Mostrar cabos"}
              </Button>
            </div>
          </div>

          <MapView
            planUrl={planUrl}
            points={points}
            equipments={equipments}
            cables={cables}
            layers={layers}
            selection={selection}
            placing={placing}
            draftPosition={draftPosition}
            onSelect={setSelection}
            onPlace={(position) => {
              setDraftPosition(position);
              setPlacing(false);
            }}
          />

          <div className="map-bottom">
            <div className="legend">
              <span><i className="pending" /> AP pendente</span>
              <span><i className="cabled" /> AP cabeado</span>
              <span><i className="active" /> AP ativo</span>
              <span><i className="equipment" /> Equipamento</span>
              <span><i className="review" /> Posição a conferir</span>
              <span><b className="planned" /> Cabo planejado</span>
              <span><b className="laid" /> Cabo passado</span>
              <span><b className="tested" /> Cabo testado</span>
            </div>

            <div className="inline-actions no-print">
              <Button size="sm" onClick={() => setSelection({ kind: "new-point" })}>
                <Radio size={14} /> Novo AP
              </Button>
              <Button size="sm" onClick={() => setSelection({ kind: "new-equipment" })}>
                <Server size={14} /> Novo equipamento
              </Button>
              <Button size="sm" onClick={() => setSelection(null)} disabled={!selection}>
                <Plus size={14} className="rotate-45" /> Limpar seleção
              </Button>
            </div>
          </div>
        </section>

        <EditorPanel
          eventId={event.id}
          selection={selection}
          points={points}
          equipments={equipments}
          cables={cables}
          draftPosition={draftPosition}
          placing={placing}
          onPositionChange={setDraftPosition}
          onTogglePlacing={() => setPlacing((value) => !value)}
          onClose={() => setSelection(null)}
        />
      </div>

      <UtilityBar event={event} canUndo={canUndo} />

      <DataTables
        points={points}
        equipments={equipments}
        cables={cables}
        onSelect={setSelection}
      />

      {cables.length === 0 ? (
        <p className="micro flex items-center gap-1.5">
          <CableIcon size={13} /> Nenhum cabo cadastrado ainda — importe o CSV de cabos ou
          cadastre pelo backup.
        </p>
      ) : null}
    </>
  );
}
