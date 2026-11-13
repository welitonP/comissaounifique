import { Download } from "lucide-react";
import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temColunasEmail } from "@/lib/schema-check";
import ConfirmButton from "@/components/ConfirmButton";
import { createTraining, deleteTraining, deleteTrainingSignup } from "@/lib/actions";
import AdminTopo from "@/components/admin/AdminTopo";
import BotaoApagar from "@/components/admin/BotaoApagar";

export const dynamic = "force-dynamic";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const ORDEM = [1, 2, 3, 4, 5, 6, 0];

export default async function AdminTreinosPage() {
  await requireUserPage();
  const comEmail = await temColunasEmail();
  const treinos = await prisma.training.findMany({
    orderBy: [{ weekday: "asc" }, { time: "asc" }],
    include: { signups: { orderBy: { createdAt: "asc" }, ...(comEmail ? { omit: { email: false } } : {}) } },
  });

  const porDia = new Map<number, typeof treinos>();
  for (const t of treinos) {
    if (!porDia.has(t.weekday)) porDia.set(t.weekday, []);
    porDia.get(t.weekday)!.push(t);
  }
  const totalInscritos = treinos.reduce((n, t) => n + t.signups.length, 0);

  // Modalidades que já têm inscritos (para o filtro do export).
  const inscritosPorModalidade = new Map<string, number>();
  for (const t of treinos) {
    inscritosPorModalidade.set(
      t.modality,
      (inscritosPorModalidade.get(t.modality) || 0) + t.signups.length,
    );
  }
  const modalidades = [...inscritosPorModalidade.entries()]
    .filter(([, n]) => n > 0)
    .sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <AdminTopo titulo="Grade de treinos" />
          <p className="text-sm text-gray-500">
            Cadastre os treinos da semana (dia, horário e local). Aparecem na aba pública Treinos.
          </p>
        </div>
        {totalInscritos > 0 && (
          <form
            method="get"
            action="/api/export/treinos"
            className="flex shrink-0 items-end gap-2"
          >
            <div>
              <label className="block">
                <span className="rotulo">Exportar inscritos</span>
                <select
                  name="modalidade"
                  defaultValue="all"
                  className="campo"
                >
                  <option value="all">Todas ({totalInscritos})</option>
                  {modalidades.map(([m, n]) => (
                    <option key={m} value={m}>
                      {m} ({n})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-unifique px-3 py-2 text-sm font-semibold text-white hover:bg-unifique-dark"
            >
              <Download size={15} /> Excel
            </button>
          </form>
        )}
      </div>

      {/* Novo treino */}
      <form action={createTraining} className="cartao space-y-3">
        <h2 className="cartao-titulo">Novo treino</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block">
              <span className="rotulo">Modalidade</span>
              <input
                name="modality"
                placeholder="Ex: Vôlei"
                required
                className="campo"
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="rotulo">Dia da semana</span>
              <select
                name="weekday"
                required
                defaultValue="1"
                className="campo"
              >
                {ORDEM.map((d) => (
                  <option key={d} value={d}>
                    {DIAS[d]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label className="block">
              <span className="rotulo">Horário</span>
              <input
                type="time"
                name="time"
                required
                className="campo"
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="rotulo">Local (opcional)</span>
              <input
                name="location"
                placeholder="Ex: Ginásio Central"
                className="campo"
              />
            </label>
          </div>
        </div>
        <div>
          <label className="block">
            <span className="rotulo">Observação (opcional)</span>
            <input
              name="notes"
              placeholder="Ex: traga sua garrafinha"
              className="campo"
            />
          </label>
        </div>
        <button
          type="submit"
          className="btn-primario"
        >
          Adicionar treino
        </button>
      </form>

      {/* Grade atual */}
      <div className="space-y-4">
        {ORDEM.filter((d) => porDia.has(d)).map((dia) => (
          <div key={dia}>
            <h2 className="cartao-titulo mb-2">{DIAS[dia]}</h2>
            <div className="space-y-2">
              {porDia.get(dia)!.map((t) => (
                <div key={t.id} className="cartao">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm">
                      <span className="cartao-titulo">{t.time}</span> · {t.modality}
                      {t.location ? ` · ${t.location}` : ""}
                      {t.notes ? <span className="text-gray-400"> · {t.notes}</span> : ""}
                    </p>
                    <form action={deleteTraining}>
                      <input type="hidden" name="id" value={t.id} />
                      <BotaoApagar mensagem="Remover este treino? Quem estava inscrito nele também sai da lista.">Remover</BotaoApagar>
                    </form>
                  </div>

                  {/* Inscritos (nome e WhatsApp, visível só para a comissão) */}
                  <div className="mt-2 border-t border-gray-100 pt-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Inscritos ({t.signups.length})
                    </p>
                    {t.signups.length === 0 ? (
                      <p className="mt-1 text-xs text-gray-400">Ninguém inscrito ainda.</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {t.signups.map((s) => (
                          <li
                            key={s.id}
                            className="flex items-center justify-between gap-2 text-sm text-gray-700"
                          >
                            <span className="min-w-0 break-words">
                              {s.name}
                              {s.phone ? <span className="text-gray-400"> · {s.phone}</span> : ""}
                              {(s as { email?: string | null }).email ? (
                                <span className="text-gray-400"> · {(s as { email?: string | null }).email}</span>
                              ) : (
                                ""
                              )}
                            </span>
                            <form action={deleteTrainingSignup}>
                              <input type="hidden" name="id" value={s.id} />
                              <ConfirmButton
                                message={`Tirar ${s.name} deste treino?`}
                                className="rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                              >
                                remover
                              </ConfirmButton>
                            </form>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {treinos.length === 0 && <p className="vazio">Nenhum treino cadastrado.</p>}
      </div>
    </div>
  );
}
