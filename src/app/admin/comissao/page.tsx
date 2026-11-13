import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCommissionMember } from "@/lib/actions";
import CommissionMemberRow from "@/components/CommissionMemberRow";
import AdminTopo from "@/components/admin/AdminTopo";
import Campo from "@/components/admin/Campo";

export const dynamic = "force-dynamic";

export default async function AdminComissaoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUserPage();
  const params = await searchParams;
  const membros = await prisma.commissionMember.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <AdminTopo titulo="A Comissão (membros)" />

      {params.erro === "foto" && (
        <p className="aviso-erro">
          A foto precisa ser uma imagem de até 2MB.
        </p>
      )}
      {params.erro === "dados" && (
        <p className="aviso-erro">
          Preencha nome e função do membro.
        </p>
      )}
      {params.sucesso === "editado" && (
        <p className="aviso-ok">
          Membro atualizado com sucesso.
        </p>
      )}

      <form action={createCommissionMember} className="cartao space-y-3">
        <h2 className="cartao-titulo">Novo membro</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Nome">
            <input
              name="name"
              required
              className="campo"
            />
          </Campo>
          <Campo rotulo="Função">
            <input
              name="role"
              placeholder="Ex: Coordenador de Futsal"
              required
              className="campo"
            />
          </Campo>
          <Campo rotulo="WhatsApp com DDD">
            <input
              name="whatsapp"
              placeholder="Ex: 47999998888"
              className="campo"
            />
          </Campo>
          <div>
            <label className="block">
              <span className="rotulo">Ordem de exibição (0 aparece primeiro)</span>
              <input
                name="order"
                type="number"
                defaultValue={0}
                className="campo"
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="block text-xs font-medium text-gray-500">Foto (opcional)</span>
              <input
                type="file"
                name="photo"
                accept="image/*"
                className="mt-1 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-unifique file:px-3 file:py-1.5 file:text-sm file:text-white"
              />
            </label>
          </div>
        </div>
        <button
          type="submit"
          className="btn-primario"
        >
          Adicionar membro
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {membros.map((m) => (
          <CommissionMemberRow
            key={m.id}
            member={{
              id: m.id,
              name: m.name,
              role: m.role,
              whatsapp: m.whatsapp,
              order: m.order,
              photoMime: m.photoMime,
            }}
          />
        ))}
        {membros.length === 0 && <p className="vazio">Nenhum membro cadastrado.</p>}
      </div>
    </div>
  );
}
