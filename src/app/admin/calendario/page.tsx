import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/actions";
import { fmtDataHora } from "@/lib/datas";
import AdminTopo from "@/components/admin/AdminTopo";
import BotaoApagar from "@/components/admin/BotaoApagar";
import Campo from "@/components/admin/Campo";

export default async function AdminCalendarioPage() {
  await requireUserPage();
  const [events, modalities] = await Promise.all([
    prisma.calendarEvent.findMany({ orderBy: { date: "asc" }, include: { modality: true } }),
    prisma.modality.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <AdminTopo titulo="Calendário" />

      <section className="cartao">
        <h2 className="cartao-titulo">Nova data</h2>
        <form action={createCalendarEvent} className="mt-3 grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Título" className="sm:col-span-2">
            <input
              name="title"
              placeholder="Ex: Rodada de Futsal"
              required
              className="campo"
            />
          </Campo>
          <Campo rotulo="Data e hora">
            <input
              type="datetime-local"
              name="date"
              required
              className="campo"
            />
          </Campo>
          <Campo rotulo="Modalidade">
            <select name="modalityId" className="campo">
              <option value="">Sem modalidade</option>
              {modalities.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Local" opcional>
            <input
              name="location"
              className="campo"
            />
          </Campo>
          <Campo rotulo="Descrição" opcional>
            <input
              name="description"
              className="campo"
            />
          </Campo>
          <button
            type="submit"
            className="btn-primario sm:col-span-2"
          >
            Adicionar data
          </button>
        </form>
      </section>

      <div className="space-y-2">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="cartao flex items-center justify-between"
          >
            <div>
              <p className="font-medium">
                {fmtDataHora(ev.date)} · {ev.title}
              </p>
              <p className="text-xs text-gray-500">
                {ev.modality ? ev.modality.name : "Geral"}
                {ev.location ? ` · ${ev.location}` : ""}
              </p>
            </div>
            <form action={deleteCalendarEvent}>
              <input type="hidden" name="id" value={ev.id} />
              <BotaoApagar mensagem="Remover esta data do calendário? As confirmações de presença dela também são apagadas.">Remover</BotaoApagar>
            </form>
          </div>
        ))}
        {events.length === 0 && <p className="vazio">Nenhuma data cadastrada.</p>}
      </div>
    </div>
  );
}
