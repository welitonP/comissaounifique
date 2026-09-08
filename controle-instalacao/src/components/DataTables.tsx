"use client";

import { CABLE_STATUS, EQUIPMENT_STATUS, POINT_STATUS } from "@/lib/types";
import type { BoardCable, BoardEquipment, BoardPoint, Selection } from "@/lib/board-types";

type Props = {
  points: BoardPoint[];
  equipments: BoardEquipment[];
  cables: BoardCable[];
  onSelect: (selection: Selection) => void;
};

export function DataTables({ points, equipments, cables, onSelect }: Props) {
  const equipmentById = new Map(equipments.map((item) => [item.id, item]));
  const pointById = new Map(points.map((item) => [item.id, item]));

  return (
    <div className="flex flex-col gap-4">
      <section className="table-wrap">
        <table className="data-table">
          <caption>Relação de pontos</caption>
          <thead>
            <tr>
              <th scope="col">Nº</th>
              <th scope="col">Ponto / setor</th>
              <th scope="col">Situação</th>
              <th scope="col">Posição</th>
              <th scope="col">Responsável</th>
              <th scope="col">Observações</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr
                key={point.id}
                onClick={() => onSelect({ kind: "point", id: point.id })}
                className="cursor-pointer"
              >
                <td>{point.number}</td>
                <td>
                  <b>{point.name}</b>
                  {point.sector ? <small className="micro block">{point.sector}</small> : null}
                </td>
                <td>
                  <span className={`pill ${POINT_STATUS[point.status].css}`}>
                    {POINT_STATUS[point.status].label}
                  </span>
                </td>
                <td>
                  {point.positionChecked ? (
                    <span className="pill ok">Conferida</span>
                  ) : (
                    <span className="pill review">Revisar</span>
                  )}
                </td>
                <td>{point.owner ?? ""}</td>
                <td>{point.notes ?? ""}</td>
              </tr>
            ))}
            {points.length === 0 ? (
              <tr>
                <td colSpan={6} className="micro">
                  Nenhum AP cadastrado. Use “Novo AP” ou importe o CSV.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="table-wrap">
        <table className="data-table">
          <caption>Equipamentos principais</caption>
          <thead>
            <tr>
              <th scope="col">Nº</th>
              <th scope="col">Equipamento / setor</th>
              <th scope="col">Tipo / modelo</th>
              <th scope="col">Situação</th>
              <th scope="col">Responsável</th>
              <th scope="col">Observações</th>
            </tr>
          </thead>
          <tbody>
            {equipments.map((equipment) => (
              <tr
                key={equipment.id}
                onClick={() => onSelect({ kind: "equipment", id: equipment.id })}
                className="cursor-pointer"
              >
                <td>E{equipment.number}</td>
                <td>
                  <b>{equipment.name}</b>
                  {equipment.sector ? (
                    <small className="micro block">{equipment.sector}</small>
                  ) : null}
                </td>
                <td>{equipment.kind ?? ""}</td>
                <td>
                  <span className={`pill ${EQUIPMENT_STATUS[equipment.status].css}`}>
                    {EQUIPMENT_STATUS[equipment.status].label}
                  </span>
                </td>
                <td>{equipment.owner ?? ""}</td>
                <td>{equipment.notes ?? ""}</td>
              </tr>
            ))}
            {equipments.length === 0 ? (
              <tr>
                <td colSpan={6} className="micro">
                  Nenhum equipamento cadastrado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="table-wrap">
        <table className="data-table">
          <caption>Relação de cabos</caption>
          <thead>
            <tr>
              <th scope="col">Nº</th>
              <th scope="col">Cabo</th>
              <th scope="col">Trajeto</th>
              <th scope="col">Tipo</th>
              <th scope="col">Andamento</th>
              <th scope="col">Responsável</th>
            </tr>
          </thead>
          <tbody>
            {cables.map((cable) => {
              const from = cable.fromEquipmentId
                ? equipmentById.get(cable.fromEquipmentId)
                : undefined;
              const to = cable.toPointId ? pointById.get(cable.toPointId) : undefined;
              return (
                <tr
                  key={cable.id}
                  onClick={() => onSelect({ kind: "cable", id: cable.id })}
                  className="cursor-pointer"
                >
                  <td>{cable.number}</td>
                  <td>
                    <b>{cable.label ?? `Cabo ${cable.number}`}</b>
                    {cable.lengthMeters ? (
                      <small className="micro block">{cable.lengthMeters} m</small>
                    ) : null}
                  </td>
                  <td className="micro">
                    {from ? `E${from.number} · ${from.name}` : "—"}
                    {" → "}
                    {to ? `${to.number} · ${to.name}` : "—"}
                  </td>
                  <td>{cable.kind ?? ""}</td>
                  <td>
                    <span className={`pill ${CABLE_STATUS[cable.status].css}`}>
                      {CABLE_STATUS[cable.status].label}
                    </span>
                  </td>
                  <td>{cable.owner ?? ""}</td>
                </tr>
              );
            })}
            {cables.length === 0 ? (
              <tr>
                <td colSpan={6} className="micro">
                  Nenhum cabo cadastrado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
