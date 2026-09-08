/**
 * Só o nome do cookie. Fica separado porque o middleware roda no runtime Edge
 * e não pode carregar nada que importe "node:crypto".
 */
export const SESSION_COOKIE = "ci_session";
