import { prisma } from "@/lib/prisma";
import { exigirUsuarioPagina, ehDono } from "@/lib/auth";
import { criarAgendamentoAction } from "@/lib/acoes-admin";
import { paraInputLocal } from "@/lib/datas";
import { fmtPreco } from "@/lib/formato";

export const dynamic = "force-dynamic";
export const metadata = { title: "Encaixar cliente" };

export default async function PaginaEncaixe({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const usuario = await exigirUsuarioPagina();
  const dono = ehDono(usuario.papel);

  const [servicos, profissionais] = await Promise.all([
    prisma.servico.findMany({
      where: { ativo: true },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    }),
    prisma.profissional.findMany({
      where: { ativo: true },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    }),
  ]);

  // Sugere o próximo horário "redondo" (de 15 em 15 minutos).
  const agora = new Date();
  const sugestao = new Date(Math.ceil(agora.getTime() / 900000) * 900000);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="titulo text-2xl text-barba-creme">Encaixar cliente</h1>
      <p className="mt-1 text-sm text-barba-cinza">
        Para quem ligou, mandou mensagem ou chegou na porta.
      </p>

      {erro && (
        <p className="mt-4 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {erro}
        </p>
      )}

      <form action={criarAgendamentoAction} className="card mt-6 space-y-4">
        <div>
          <label className="rotulo" htmlFor="nome">
            Nome do cliente
          </label>
          <input id="nome" name="nome" className="campo" required maxLength={120} />
        </div>

        <div>
          <label className="rotulo" htmlFor="telefone">
            WhatsApp
          </label>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            inputMode="numeric"
            className="campo"
            placeholder="(47) 99999-8888"
            required
          />
          <p className="mt-1 text-xs text-barba-cinza">
            Se o telefone já existir, o cadastro do cliente é reaproveitado.
          </p>
        </div>

        <div>
          <label className="rotulo" htmlFor="servico">
            Serviço
          </label>
          <select id="servico" name="servico" className="campo" required>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} — {s.duracaoMin} min — {fmtPreco(s.precoCentavos)}
              </option>
            ))}
          </select>
        </div>

        {dono && (
          <div>
            <label className="rotulo" htmlFor="profissional">
              Profissional
            </label>
            <select
              id="profissional"
              name="profissional"
              className="campo"
              defaultValue={usuario.profissionalId ?? undefined}
              required
            >
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.apelido || p.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="rotulo" htmlFor="inicio">
            Começa em
          </label>
          <input
            id="inicio"
            name="inicio"
            type="datetime-local"
            className="campo"
            defaultValue={paraInputLocal(sugestao)}
            required
          />
          <p className="mt-1 text-xs text-barba-cinza">
            O fim é calculado sozinho pela duração do serviço.
          </p>
        </div>

        <div>
          <label className="rotulo" htmlFor="observacao">
            Observação (opcional)
          </label>
          <input id="observacao" name="observacao" className="campo" maxLength={300} />
        </div>

        <label className="flex items-start gap-2 rounded-xl border border-barba-borda bg-barba-grafite px-4 py-3 text-sm">
          <input type="checkbox" name="forcar" className="mt-0.5 accent-barba-ouro" />
          <span>
            <span className="font-semibold text-barba-creme">Encaixar mesmo assim</span>
            <span className="block text-xs text-barba-cinza">
              Marque para permitir dois clientes no mesmo horário (sobreposição proposital).
            </span>
          </span>
        </label>

        <button type="submit" className="btn-ouro w-full py-3">
          Salvar agendamento
        </button>
      </form>
    </div>
  );
}
