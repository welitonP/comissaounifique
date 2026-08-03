import { prisma } from "@/lib/prisma";
import { exigirDonoPagina } from "@/lib/auth";
import { alternarServicoAction, salvarServicoAction } from "@/lib/acoes-admin";
import { fmtPreco } from "@/lib/formato";

export const dynamic = "force-dynamic";
export const metadata = { title: "Serviços" };

export default async function PaginaServicos() {
  await exigirDonoPagina();

  const servicos = await prisma.servico.findMany({
    orderBy: [{ ativo: "desc" }, { ordem: "asc" }, { nome: "asc" }],
  });

  return (
    <div>
      <h1 className="titulo text-2xl text-barba-creme">Serviços</h1>
      <p className="mt-1 text-sm text-barba-cinza">
        Preço e duração daqui alimentam o site e a agenda.
      </p>

      {/* Novo serviço */}
      <form action={salvarServicoAction} className="card mt-6 grid gap-3 sm:grid-cols-2">
        <p className="titulo text-barba-ouro sm:col-span-2">Novo serviço</p>
        <div>
          <label className="rotulo">Nome</label>
          <input name="nome" className="campo" placeholder="Corte masculino" required />
        </div>
        <div>
          <label className="rotulo">Descrição</label>
          <input name="descricao" className="campo" placeholder="Máquina, tesoura e finalização" />
        </div>
        <div>
          <label className="rotulo">Preço</label>
          <input name="preco" className="campo" placeholder="45,00" required />
        </div>
        <div>
          <label className="rotulo">Duração (min)</label>
          <input name="duracao" type="number" min={5} step={5} className="campo" defaultValue={30} required />
        </div>
        <div>
          <label className="rotulo">Ordem na lista</label>
          <input name="ordem" type="number" className="campo" defaultValue={0} />
        </div>
        <label className="flex items-center gap-2 self-end pb-3 text-sm text-barba-creme">
          <input type="checkbox" name="destaque" className="accent-barba-ouro" /> Marcar como “mais
          pedido”
        </label>
        <button type="submit" className="btn-ouro sm:col-span-2">
          Adicionar serviço
        </button>
      </form>

      {/* Lista */}
      <div className="mt-8 space-y-3">
        {servicos.map((s) => (
          <form
            key={s.id}
            action={salvarServicoAction}
            className={`card grid gap-3 sm:grid-cols-6 ${s.ativo ? "" : "opacity-50"}`}
          >
            <input type="hidden" name="id" value={s.id} />

            <div className="sm:col-span-2">
              <label className="rotulo">Nome</label>
              <input name="nome" className="campo" defaultValue={s.nome} required />
            </div>
            <div className="sm:col-span-2">
              <label className="rotulo">Descrição</label>
              <input name="descricao" className="campo" defaultValue={s.descricao ?? ""} />
            </div>
            <div>
              <label className="rotulo">Preço</label>
              <input
                name="preco"
                className="campo"
                defaultValue={(s.precoCentavos / 100).toFixed(2).replace(".", ",")}
                required
              />
            </div>
            <div>
              <label className="rotulo">Duração</label>
              <input
                name="duracao"
                type="number"
                min={5}
                step={5}
                className="campo"
                defaultValue={s.duracaoMin}
                required
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:col-span-6">
              <label className="flex items-center gap-2 text-sm text-barba-creme">
                <input
                  type="checkbox"
                  name="destaque"
                  defaultChecked={s.destaque}
                  className="accent-barba-ouro"
                />
                Mais pedido
              </label>
              <label className="flex items-center gap-2 text-sm text-barba-cinza">
                Ordem
                <input
                  name="ordem"
                  type="number"
                  className="campo w-20 px-2 py-1"
                  defaultValue={s.ordem}
                />
              </label>
              <span className="text-sm text-barba-cinza">
                No site: {fmtPreco(s.precoCentavos)} · {s.duracaoMin} min
              </span>

              <div className="ml-auto flex gap-2">
                <button type="submit" className="btn-mini">
                  Salvar
                </button>
                <button
                  type="submit"
                  formAction={alternarServicoAction}
                  className={`btn-mini ${s.ativo ? "text-red-400" : "text-green-400"}`}
                >
                  {s.ativo ? "Desativar" : "Reativar"}
                </button>
              </div>
            </div>
          </form>
        ))}
      </div>

      <p className="mt-6 text-xs text-barba-cinza">
        Serviço desativado some do site, mas o histórico de quem já cortou continua intacto.
      </p>
    </div>
  );
}
