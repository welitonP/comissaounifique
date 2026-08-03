import { exigirDonoPagina } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { salvarConfigAction } from "@/lib/acoes-admin";
import { fmtTelefone } from "@/lib/formato";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ajustes" };

export default async function PaginaConfig() {
  await exigirDonoPagina();
  const config = await getConfig();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="titulo text-2xl text-barba-creme">Ajustes da barbearia</h1>
      <p className="mt-1 text-sm text-barba-cinza">
        O que aparece no site e as regras da agenda online.
      </p>

      <form action={salvarConfigAction} className="card mt-6 grid gap-4 sm:grid-cols-2">
        <p className="titulo text-barba-ouro sm:col-span-2">Identidade</p>

        <div>
          <label className="rotulo">Nome da barbearia</label>
          <input name="nome" className="campo" defaultValue={config.nome} required />
        </div>
        <div>
          <label className="rotulo">Frase de efeito</label>
          <input name="slogan" className="campo" defaultValue={config.slogan ?? ""} />
        </div>
        <div className="sm:col-span-2">
          <label className="rotulo">Endereço</label>
          <input name="endereco" className="campo" defaultValue={config.endereco ?? ""} />
        </div>
        <div className="sm:col-span-2">
          <label className="rotulo">Link do Google Maps</label>
          <input name="mapsUrl" className="campo" defaultValue={config.mapsUrl ?? ""} />
        </div>
        <div>
          <label className="rotulo">Telefone fixo</label>
          <input
            name="telefone"
            className="campo"
            defaultValue={config.telefone ? fmtTelefone(config.telefone) : ""}
          />
        </div>
        <div>
          <label className="rotulo">WhatsApp</label>
          <input
            name="whatsapp"
            className="campo"
            defaultValue={config.whatsapp ? fmtTelefone(config.whatsapp) : ""}
          />
        </div>
        <div>
          <label className="rotulo">Instagram (sem @)</label>
          <input name="instagram" className="campo" defaultValue={config.instagram ?? ""} />
        </div>

        <p className="titulo mt-4 text-barba-ouro sm:col-span-2">Regras da agenda</p>

        <div>
          <label className="rotulo">Intervalo entre horários (min)</label>
          <input
            name="passoMin"
            type="number"
            min={5}
            max={60}
            step={5}
            className="campo"
            defaultValue={config.passoMin}
          />
          <p className="mt-1 text-xs text-barba-cinza">
            15 = horários de 15 em 15 (09:00, 09:15, 09:30...).
          </p>
        </div>
        <div>
          <label className="rotulo">Antecedência mínima (min)</label>
          <input
            name="antecedenciaMin"
            type="number"
            min={0}
            max={1440}
            className="campo"
            defaultValue={config.antecedenciaMin}
          />
          <p className="mt-1 text-xs text-barba-cinza">
            Evita alguém marcar para daqui a 5 minutos.
          </p>
        </div>
        <div>
          <label className="rotulo">Agenda aberta por (dias)</label>
          <input
            name="diasMax"
            type="number"
            min={1}
            max={90}
            className="campo"
            defaultValue={config.diasMax}
          />
          <p className="mt-1 text-xs text-barba-cinza">Até quando o cliente pode marcar.</p>
        </div>
        <div>
          <label className="rotulo">Cancelamento até (horas antes)</label>
          <input
            name="limiteCancelamentoH"
            type="number"
            min={0}
            max={72}
            className="campo"
            defaultValue={config.limiteCancelamentoH}
          />
          <p className="mt-1 text-xs text-barba-cinza">
            Depois disso o cliente precisa falar com a barbearia.
          </p>
        </div>

        <button type="submit" className="btn-ouro sm:col-span-2">
          Salvar ajustes
        </button>
      </form>
    </div>
  );
}
