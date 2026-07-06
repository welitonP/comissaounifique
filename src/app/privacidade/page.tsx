import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade · Comissão de Esportes Unifique",
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-unifique to-unifique-blue p-7 text-white shadow-md">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <ShieldCheck size={26} />
          </span>
          <div>
            <h1 className="text-2xl font-bold">Política de Privacidade</h1>
            <p className="text-sm text-white/85">
              Como a Comissão de Esportes trata os seus dados.
            </p>
          </div>
        </div>
      </section>

      <article className="space-y-6 rounded-2xl bg-white p-6 text-gray-700 shadow-sm sm:p-8">
        <section>
          <h2 className="font-display text-lg font-bold text-unifique">1. Quem somos</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Este site é mantido pela Comissão de Esportes da Unifique, com finalidade
            exclusivamente interna e organizacional: divulgar jogos, comunicados e organizar a
            participação dos colaboradores nas competições esportivas.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-unifique">2. Dados que coletamos</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>
              <strong>Inscrições de atletas:</strong> nome, setor, tamanho de camisa, contato e
              modalidades escolhidas.
            </li>
            <li>
              <strong>Confirmações de presença:</strong> nome informado ao confirmar em um jogo ou
              evento.
            </li>
            <li>
              <strong>Sugestões:</strong> o texto enviado e, se você optar por se identificar, o
              seu nome.
            </li>
            <li>
              <strong>Elencos:</strong> nome dos atletas por modalidade. Dados de contato de
              atletas não são exibidos publicamente; ficam restritos à comissão.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-unifique">3. Para que usamos</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Os dados são usados apenas para organizar as atividades esportivas: montar elencos,
            planejar jogos, entregar uniformes no tamanho certo e entrar em contato quando
            necessário. Não vendemos, não compartilhamos com terceiros e não usamos os dados para
            publicidade.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-unifique">4. Quem tem acesso</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Somente os membros da Comissão de Esportes, mediante login individual. As páginas
            públicas exibem apenas informações necessárias à divulgação (nomes em elencos,
            calendário e comunicados).
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-unifique">5. Fotos e imagem</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Fotos de eventos publicadas nos comunicados e na galeria de fotos passam pela
            comissão, que se compromete a publicar apenas imagens de pessoas que autorizaram o
            uso. Se você aparece em alguma foto e deseja a remoção, fale com qualquer membro da
            comissão e removeremos.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-unifique">6. Cookies</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Usamos apenas cookies funcionais: manter a sessão dos membros da comissão e evitar
            votos ou confirmações duplicadas. Não usamos cookies de rastreamento ou publicidade.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-unifique">7. Seus direitos (LGPD)</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode solicitar
            a qualquer momento o acesso, a correção ou a exclusão dos seus dados. Basta procurar
            qualquer membro da comissão (veja a página A Comissão) e atenderemos o pedido.
          </p>
        </section>
      </article>
    </div>
  );
}
