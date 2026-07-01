import { requireAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTeam, deleteTeam } from "@/lib/actions";

export default async function AdminTimesPage() {
  await requireAdminPage();
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-unifique-dark">Times</h1>

      <form action={createTeam} className="flex flex-wrap gap-3 rounded-lg bg-white p-4 shadow-sm">
        <input
          name="name"
          placeholder="Nome do time"
          required
          className="flex-1 rounded border border-gray-300 px-3 py-2"
        />
        <input
          name="modality"
          placeholder="Modalidade (ex: Futsal, Vôlei)"
          required
          className="flex-1 rounded border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark"
        >
          Adicionar
        </button>
      </form>

      <div className="space-y-2">
        {teams.map((team) => (
          <div
            key={team.id}
            className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm"
          >
            <span>
              <strong>{team.name}</strong> · {team.modality}
            </span>
            <form action={deleteTeam}>
              <input type="hidden" name="id" value={team.id} />
              <button type="submit" className="text-sm text-red-600 hover:underline">
                Remover
              </button>
            </form>
          </div>
        ))}
        {teams.length === 0 && <p className="text-gray-500">Nenhum time cadastrado.</p>}
      </div>
    </div>
  );
}
