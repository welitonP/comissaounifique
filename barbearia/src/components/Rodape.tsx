import Link from "next/link";
import { IconeInstagram, IconeLocal, IconeTelefone, IconeWhatsApp } from "./Icones";
import { fmtTelefone, linkWhatsApp } from "@/lib/formato";
import type { Config } from "@/lib/config";

export default function Rodape({ config }: { config: Config }) {
  return (
    <footer className="mt-16 border-t border-barba-borda/70 bg-barba-carvao/50">
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="titulo text-base text-barba-ouro">{config.nome}</p>
          {config.slogan && <p className="mt-1 text-sm text-barba-cinza">{config.slogan}</p>}
        </div>

        <div className="space-y-2 text-sm text-barba-cinza">
          {config.endereco && (
            <p className="flex items-start gap-2">
              <IconeLocal className="mt-0.5 h-4 w-4 shrink-0 text-barba-ouro" />
              {config.mapsUrl ? (
                <a href={config.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-barba-ouro">
                  {config.endereco}
                </a>
              ) : (
                config.endereco
              )}
            </p>
          )}
          {config.telefone && (
            <p className="flex items-center gap-2">
              <IconeTelefone className="h-4 w-4 shrink-0 text-barba-ouro" />
              {fmtTelefone(config.telefone)}
            </p>
          )}
        </div>

        <div className="flex flex-col items-start gap-3 text-sm">
          {config.whatsapp && (
            <a
              href={linkWhatsApp(config.whatsapp, `Olá! Vim pelo site da ${config.nome}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-mini"
            >
              <IconeWhatsApp className="h-4 w-4 text-green-400" /> WhatsApp
            </a>
          )}
          {config.instagram && (
            <a
              href={`https://instagram.com/${config.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-mini"
            >
              <IconeInstagram className="h-4 w-4" /> @{config.instagram}
            </a>
          )}
        </div>
      </div>

      <div className="border-t border-barba-borda/50 px-4 py-4 text-center text-xs text-barba-cinza/70">
        <Link href="/admin" className="transition hover:text-barba-ouro">
          Área do barbeiro
        </Link>
      </div>
    </footer>
  );
}
