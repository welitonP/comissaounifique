import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/actions";

export default async function AdminCalendarioPage() {
  await requireUserPage();
  const [events, modalities] = await Promise.all([
    prisma.calendarEvent.findMany({ orderBy: { date: "asc" }, include: { modality: true } }),
    prisma.modality.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-unifique">Calendário</h1>

      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-unifique">Nova data</h2>
        <form action={createCalendarEvent} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            name="title"
            placeholder="Título (ex: Rodada de Futsal)"
            required
            className="rounded border border-gray-300 px-3 py-2 sm:col-span-2"
          />
          <input
            type="datetime-local"
            name="date"
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
          <select name="modalityId" className="rounded border border-gray-300 px-3 py-2">
            <option value="">Sem modalidade</option>
            {modalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input
            name="location"
            placeholder="Local (opcional)"
            className="rounded border border-gray-300 px-3 py-2"
          />
          <input
            name="description"
            placeholder="Descrição (opcional)"
            className="rounded border border-gray-300 px-3 py-2"
          />
          <button
            type="submit"
            className="rounded bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark sm:col-span-2"
          >
            Adicionar data
          </button>
        </form>
      </section>

      <div className="space-y-2">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm"
          >
            <div>
              <p className="font-medium">
                {new Date(ev.date).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                — {ev.title}
              </p>
              <p className="text-xs text-gray-500">
                {ev.modality ? ev.modality.name : "Geral"}
                {ev.location ? ` · ${ev.location}` : ""}
              </p>
            </div>
            <form action={deleteCalendarEvent}>
              <input type="hidden" name="id" value={ev.id} />
              <button type="submit" className="text-sm text-red-600 hover:underline">
                Remover
              </button>
            </form>
          </div>
        ))}
        {events.length === 0 && <p className="text-gray-500">Nenhuma data cadastrada.</p>}
      </div>
    </div>
  );
}
