import { Trash2 } from "lucide-react";
import ConfirmButton from "@/components/ConfirmButton";

// Botão de apagar padrão das telas da comissão: sempre pede confirmação e tem
// área de toque grande. Vai dentro de um <form action={...}> com o id escondido.
export default function BotaoApagar({
  mensagem,
  children = "Remover",
  icone = true,
}: {
  mensagem: string;
  children?: React.ReactNode;
  icone?: boolean;
}) {
  return (
    <ConfirmButton message={mensagem} className="btn-perigo">
      {icone && <Trash2 size={15} />}
      {children}
    </ConfirmButton>
  );
}
