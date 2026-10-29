"use client";

import { useState } from "react";
import { Bola, type TipoBola } from "./Bolas";

// Bola que atravessa o banner quicando. A cada passada troca de esporte,
// seguindo as modalidades cadastradas pela comissão.
const TAMANHO: Record<TipoBola, string> = {
  volei: "h-8 w-8",
  futebol: "h-8 w-8",
  handebol: "h-8 w-8",
  basquete: "h-9 w-9",
  tenis: "h-6 w-6",
  pingpong: "h-8 w-8",
};

export default function BolaQuicando({ tipos }: { tipos: TipoBola[] }) {
  const [i, setI] = useState(0);
  const tipo = tipos[i % tipos.length] ?? "volei";

  return (
    <div
      className="bola-trilho absolute bottom-1 h-28 w-9"
      onAnimationIteration={(e) => {
        if (e.animationName === "bola-x" && tipos.length > 1) setI((n) => n + 1);
      }}
    >
      <div className="bola-sombra absolute bottom-0 left-1 h-1.5 w-7 rounded-full bg-black/60 blur-[1px]" />
      <div className="bola-quique absolute bottom-1.5 left-0 flex w-9 justify-center">
        <Bola tipo={tipo} className={`bola-giro drop-shadow-md ${TAMANHO[tipo]}`} />
      </div>
    </div>
  );
}
