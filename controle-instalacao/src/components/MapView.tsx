"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BoardCable, BoardEquipment, BoardPoint, Selection } from "@/lib/board-types";
import { CABLE_STATUS, EQUIPMENT_STATUS, POINT_STATUS } from "@/lib/types";

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 8;
/** Arraste maior que isso conta como pan, não como clique. */
const CLICK_SLOP_PX = 5;

type Layers = { points: boolean; equipments: boolean; cables: boolean };

type Props = {
  planUrl: string | null;
  points: BoardPoint[];
  equipments: BoardEquipment[];
  cables: BoardCable[];
  layers: Layers;
  selection: Selection;
  placing: boolean;
  draftPosition: { x: number; y: number } | null;
  onSelect: (selection: Selection) => void;
  onPlace: (position: { x: number; y: number }) => void;
};

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function MapView({
  planUrl,
  points,
  equipments,
  cables,
  layers,
  selection,
  placing,
  draftPosition,
  onSelect,
  onPlace,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);

  // Espelhos síncronos: pan e pinça chegam mais rápido que um novo render.
  const zoomRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });

  const applyView = useCallback((nextZoom: number, nextOffset: { x: number; y: number }) => {
    zoomRef.current = nextZoom;
    offsetRef.current = nextOffset;
    setZoom(nextZoom);
    setOffset(nextOffset);
  }, []);

  const reset = useCallback(() => applyView(1, { x: 0, y: 0 }), [applyView]);

  /** Amplia mantendo fixo o ponto sob o cursor (ou o centro, sem cursor). */
  const zoomAt = useCallback(
    (nextZoom: number, clientX?: number, clientY?: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const rect = viewport.getBoundingClientRect();
      const px = clientX === undefined ? rect.width / 2 : clientX - rect.left;
      const py = clientY === undefined ? rect.height / 2 : clientY - rect.top;

      const currentZoom = zoomRef.current;
      const current = offsetRef.current;
      const anchorX = (px - current.x) / currentZoom;
      const anchorY = (py - current.y) / currentZoom;

      applyView(nextZoom, { x: px - anchorX * nextZoom, y: py - anchorY * nextZoom });
    },
    [applyView],
  );

  const panBy = useCallback(
    (dx: number, dy: number) => {
      const current = offsetRef.current;
      applyView(zoomRef.current, { x: current.x + dx, y: current.y + dy });
    },
    [applyView],
  );

  // Ponteiros ativos: um = arrastar, dois = pinça.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ moved: 0, lastX: 0, lastY: 0, pinchDistance: 0 });

  // Registrado à mão porque o React trata onWheel como listener passivo.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = Math.exp(-event.deltaY * 0.0015);
      zoomAt(clampZoom(zoomRef.current * factor), event.clientX, event.clientY);
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  function percentFromClient(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    // Duas casas bastam e mantêm o valor válido para o passo dos campos.
    const round = (value: number) =>
      Math.round(Math.min(100, Math.max(0, value)) * 100) / 100;

    return {
      x: round(((clientX - rect.left) / rect.width) * 100),
      y: round(((clientY - rect.top) / rect.height) * 100),
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);

    if (pointers.current.size === 1) {
      gesture.current.moved = 0;
      gesture.current.lastX = event.clientX;
      gesture.current.lastY = event.clientY;
      setPanning(true);
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current.pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const previous = gesture.current.pinchDistance;
      if (previous > 0 && distance > 0) {
        zoomAt(
          clampZoom(zoomRef.current * (distance / previous)),
          (a.x + b.x) / 2,
          (a.y + b.y) / 2,
        );
      }
      gesture.current.pinchDistance = distance;
      gesture.current.moved = CLICK_SLOP_PX + 1;
      return;
    }

    const dx = event.clientX - gesture.current.lastX;
    const dy = event.clientY - gesture.current.lastY;
    gesture.current.lastX = event.clientX;
    gesture.current.lastY = event.clientY;
    gesture.current.moved += Math.abs(dx) + Math.abs(dy);

    panBy(dx, dy);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const wasClick = gesture.current.moved <= CLICK_SLOP_PX;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 0) setPanning(false);
    if (pointers.current.size < 2) gesture.current.pinchDistance = 0;

    if (!wasClick) return;

    if (placing) {
      const position = percentFromClient(event.clientX, event.clientY);
      if (position) onPlace(position);
      return;
    }

    // Clique no vazio da planta limpa a seleção.
    if (event.target === event.currentTarget || event.target === canvasRef.current) {
      onSelect(null);
    }
  }

  const pointById = new Map(points.map((point) => [point.id, point]));
  const equipmentById = new Map(equipments.map((equipment) => [equipment.id, equipment]));

  /** Trajeto completo: equipamento → desvios → AP. */
  function cablePath(cable: BoardCable): string {
    const nodes: { x: number; y: number }[] = [];
    const from = cable.fromEquipmentId ? equipmentById.get(cable.fromEquipmentId) : null;
    const to = cable.toPointId ? pointById.get(cable.toPointId) : null;

    if (from) nodes.push({ x: from.x, y: from.y });
    nodes.push(...cable.path);
    if (to) nodes.push({ x: to.x, y: to.y });

    return nodes.map((node) => `${node.x},${node.y}`).join(" ");
  }

  const selectedId = selection && "id" in selection ? selection.id : null;

  return (
    <>
      <div className="zoom-toolbar">
        <Button
          variant="default"
          size="icon"
          aria-label="Diminuir zoom"
          title="Diminuir zoom"
          onClick={() => zoomAt(clampZoom(zoomRef.current / 1.25))}
        >
          <Minus size={15} />
        </Button>
        <output>{Math.round(zoom * 100)} %</output>
        <Button
          variant="default"
          size="icon"
          aria-label="Aumentar zoom"
          title="Aumentar zoom"
          onClick={() => zoomAt(clampZoom(zoomRef.current * 1.25))}
        >
          <Plus size={15} />
        </Button>
        <Button size="sm" title="Voltar para a visão completa" onClick={reset}>
          <Maximize2 size={14} /> 100%
        </Button>
        <small className="zoom-instructions">
          {placing
            ? "Toque na planta para posicionar o item selecionado."
            : "Use a roda do mouse sobre o mapa para ampliar. Toque em + ou −, ou use dois dedos para aproximar."}
        </small>
      </div>

      <div
        ref={viewportRef}
        className={`map-viewport${panning ? " is-panning" : ""}${placing ? " is-placing" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          ref={canvasRef}
          className="map-canvas"
          style={{
            width: "100%",
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          }}
        >
          {planUrl ? (
            // Imagem servida pela nossa própria rota; o next/image não agrega aqui.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={planUrl} alt="Planta do local" draggable={false} />
          ) : (
            <div className="grid aspect-[16/9] place-items-center bg-[var(--color-muted)] text-center">
              <p className="micro max-w-xs">
                Nenhuma planta enviada ainda. Envie a imagem do local em
                <b> Editar evento</b> para posicionar os pontos.
              </p>
            </div>
          )}

          {layers.cables ? (
            <svg className="map-cables" viewBox="0 0 100 100" preserveAspectRatio="none">
              {cables.map((cable) => {
                const path = cablePath(cable);
                if (!path.includes(" ")) return null;
                return (
                  <polyline
                    key={cable.id}
                    points={path}
                    vectorEffect="non-scaling-stroke"
                    className={`${CABLE_STATUS[cable.status].css}${
                      selectedId === cable.id ? " selected" : ""
                    }`}
                    style={{ pointerEvents: "stroke", strokeWidth: 2 }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      onSelect({ kind: "cable", id: cable.id });
                    }}
                  />
                );
              })}
            </svg>
          ) : null}

          {layers.equipments
            ? equipments.map((equipment) => {
                const isSelected = selectedId === equipment.id;
                const position =
                  isSelected && draftPosition ? draftPosition : { x: equipment.x, y: equipment.y };
                return (
                  <button
                    key={equipment.id}
                    type="button"
                    className={[
                      "map-equipment",
                      EQUIPMENT_STATUS[equipment.status].css,
                      equipment.positionChecked ? "" : "review",
                      isSelected ? "selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{ left: `${position.x}%`, top: `${position.y}%` }}
                    aria-label={`Equipamento ${equipment.number}, ${equipment.name}, ${EQUIPMENT_STATUS[equipment.status].label}`}
                    title={`E${equipment.number} · ${equipment.name} · ${EQUIPMENT_STATUS[equipment.status].label}`}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => onSelect({ kind: "equipment", id: equipment.id })}
                  >
                    E{equipment.number}
                  </button>
                );
              })
            : null}

          {layers.points
            ? points.map((point) => {
                const isSelected = selectedId === point.id;
                const position =
                  isSelected && draftPosition ? draftPosition : { x: point.x, y: point.y };
                return (
                  <button
                    key={point.id}
                    type="button"
                    className={[
                      "map-point",
                      POINT_STATUS[point.status].css,
                      point.positionChecked ? "" : "review",
                      isSelected ? "selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{ left: `${position.x}%`, top: `${position.y}%` }}
                    aria-label={`AP ${point.number}, ${point.name}, ${POINT_STATUS[point.status].label}`}
                    title={`${point.number} · ${point.name} · ${POINT_STATUS[point.status].label}${
                      point.positionChecked ? "" : " · posição a conferir"
                    }`}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => onSelect({ kind: "point", id: point.id })}
                  >
                    {point.number}
                  </button>
                );
              })
            : null}
        </div>
      </div>
    </>
  );
}
