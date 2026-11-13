import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTeam, deleteTeam } from "@/lib/actions";
import AdminTopo from "@/components/admin/AdminTopo";
import BotaoApagar from "@/components/admin/BotaoApagar";
import Campo from "@/components/admin/Campo";

export default async function AdminTimesPage() {
  await requireUserPage();
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <AdminTopo titulo="Times" />

      <form action={createTeam} className="cartao grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Campo rotulo="Nome do time">
          <input
            name="name"
            required
            className="campo"
          />
        </Campo>
        <Campo rotulo="Modalidade">
          <input
            name="modality"
            placeholder="Ex: Futsal, Vôlei"
            required
            className="campo"
          />
        </Campo>
        <button
          type="submit"
          className="btn-primario"
        >
          Adicionar
        </button>
      </form>

      <div className="space-y-2">
        {teams.map((team) => (
          <div
            key={team.id}
            className="cartao flex items-center justify-between"
          >
            <span>
              <strong>{team.name}</strong> · {team.modality}
            </span>
            <form action={deleteTeam}>
              <input type="hidden" name="id" value={team.id} />
              <BotaoApagar mensagem="Remover este time? Os jogos dele também podem ser apagados.">Remover</BotaoApagar>
            </form>
          </div>
        ))}
        {teams.length === 0 && <p className="vazio">Nenhum time cadastrado.</p>}
      </div>
    </div>
  );
}
