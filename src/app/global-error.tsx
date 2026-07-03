"use client";

// Rede de segurança para erros que acontecem no layout raiz.
// Precisa renderizar suas próprias tags <html>/<body>.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f0f4fb",
          color: "#1a1c2e",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <h1 style={{ color: "#212492", fontSize: 22, margin: "12px 0 8px" }}>
            Algo não carregou
          </h1>
          <p style={{ color: "#4b5563", margin: "0 0 20px" }}>
            Tivemos um problema inesperado. Tente novamente em instantes.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#212492",
              color: "#fff",
              border: 0,
              borderRadius: 12,
              padding: "10px 20px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
