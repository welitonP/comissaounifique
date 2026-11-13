// Campo de formulário com o nome ligado a ele: tocar no nome seleciona o
// campo e leitores de tela anunciam o que é. Uso:
//   <Campo rotulo="Nome"><input name="name" className="campo" /></Campo>
export default function Campo({
  rotulo,
  opcional,
  dica,
  className = "",
  children,
}: {
  rotulo: string;
  opcional?: boolean;
  dica?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="rotulo">
        {rotulo}
        {opcional && <span className="font-normal text-gray-400"> (opcional)</span>}
      </span>
      {children}
      {dica && <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{dica}</span>}
    </label>
  );
}
