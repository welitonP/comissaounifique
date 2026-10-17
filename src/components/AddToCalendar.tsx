import { CalendarPlus } from "lucide-react";

// Botões "adicionar à agenda". São apenas links (sem JS no cliente):
//   - Baixar .ics  -> funciona no Apple Agenda, Outlook, etc.
//   - Google Agenda -> abre o Google Calendar já preenchido.
export default function AddToCalendar({
  icsHref,
  googleHref,
}: {
  icsHref: string;
  googleHref: string;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
        <CalendarPlus size={13} /> Adicionar à agenda
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={googleHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-unifique px-3 py-1.5 text-sm font-semibold text-unifique transition hover:bg-unifique/10"
        >
          Google Agenda
        </a>
        <a
          href={icsHref}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Apple / Outlook (.ics)
        </a>
      </div>
    </div>
  );
}
