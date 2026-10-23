import { CalendarPlus } from "lucide-react";

// Botões "adicionar à agenda". São apenas links (sem JS no cliente):
//   - Baixar .ics  -> funciona no Apple Agenda, Outlook, etc.
//   - Google Agenda -> abre o Google Calendar já preenchido.
export default function AddToCalendar({
  googleHref,
  outlookHref,
}: {
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
      </div>
    </div>
  );
}
