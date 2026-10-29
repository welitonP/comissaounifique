// O template é recriado a cada troca de página (o layout não), então a
// animação de entrada roda em toda navegação.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="transicao-pagina">{children}</div>;
}
