import { CalendarPlus } from "lucide-react";

// Botões "adicionar à agenda". São apenas links (sem JS no cliente):
//   - Baixar .ics  -> funciona no Apple Agenda, Outlook, etc.
//   - Google Agenda -> abre o Google Calendar já preenchido.
export default function AddToCalendar({
  icsHref,
  googleHref,
  outlookHref,
}: {
  icsHref: string;
  googleHref: string;
  outlookHref: string;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        <CalendarPlus size={13} /> Adicionar à agenda
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={outlookHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-unifique px-3 py-1.5 text-sm font-semibold text-unifique transition hover:bg-unifique/10 dark:border-unifique-blue/60 dark:text-unifique-blue dark:hover:bg-unifique-blue/10"
        >
          Outlook
        </a>
        <a
          href={googleHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-unifique px-3 py-1.5 text-sm font-semibold text-unifique transition hover:bg-unifique/10 dark:border-unifique-blue/60 dark:text-unifique-blue dark:hover:bg-unifique-blue/10"
        >
          Google Agenda
        </a>
        <a
          href={icsHref}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-white/15 dark:text-gray-300 dark:hover:bg-white/5"
        >
          Apple / outros (.ics)
        </a>
      </div>
    </div>
  );
}
