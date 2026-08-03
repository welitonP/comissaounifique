import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export { hashSenha, conferirSenha } from "./senha";

export type UsuarioSessao = {
  id: string;
  nome: string;
  usuario: string;
  papel: string;
  profissionalId: string | null;
};

// ===== Usuário atual a partir do cookie de sessão =====

export async function usuarioAtual(): Promise<UsuarioSessao | null> {
  const store = await cookies();
  const userId = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  const u = await prisma.usuario.findUnique({ where: { id: userId } });
  if (!u || !u.ativo) return null;
  return {
    id: u.id,
    nome: u.nome,
    usuario: u.usuario,
    papel: u.papel,
    profissionalId: u.profissionalId,
  };
}

// Para páginas (Server Components): manda para o login se não estiver logado.
export async function exigirUsuarioPagina(): Promise<UsuarioSessao> {
  const u = await usuarioAtual();
  if (!u) redirect("/login");
  return u;
}

// Para server actions (mutações): estoura erro se não autorizado.
export async function exigirUsuario(): Promise<UsuarioSessao> {
  const u = await usuarioAtual();
  if (!u) throw new Error("Não autenticado.");
  return u;
}

export function ehDono(papel: string): boolean {
  return papel === "dono";
}

// Só o dono mexe em serviços, profissionais, preços e configuração.
export async function exigirDono(): Promise<UsuarioSessao> {
  const u = await exigirUsuario();
  if (!ehDono(u.papel)) throw new Error("Apenas o dono da barbearia.");
  return u;
}

export async function exigirDonoPagina(): Promise<UsuarioSessao> {
  const u = await exigirUsuarioPagina();
  if (!ehDono(u.papel)) redirect("/admin");
  return u;
}
