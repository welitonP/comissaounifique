"use client";

import { useActionState } from "react";
import { KeyRound, UserPlus } from "lucide-react";
import {
  createUserAction,
  setUserPasswordAction,
  toggleUserAction,
  type ActionState,
} from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";

type Member = {
  id: string;
  username: string;
  name: string;
  role: string;
  active: boolean;
};

export function MemberForms({
  users,
  currentUserId,
}: {
  users: Member[];
  currentUserId: string;
}) {
  const [createState, createAction, creating] = useActionState<ActionState, FormData>(
    createUserAction,
    {},
  );
  const [passwordState, passwordAction, savingPassword] = useActionState<ActionState, FormData>(
    setUserPasswordAction,
    {},
  );

  return (
    <div className="work-grid">
      <section className="table-wrap">
        <table className="data-table">
          <caption>Membros cadastrados</caption>
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Usuário</th>
              <th scope="col">Papel</th>
              <th scope="col">Situação</th>
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.username}</td>
                <td>{user.role === "admin" ? "Administrador" : "Membro"}</td>
                <td>
                  {user.active ? (
                    <span className="pill active">Ativo</span>
                  ) : (
                    <span className="pill ok">Bloqueado</span>
                  )}
                </td>
                <td>
                  {user.id === currentUserId ? (
                    <span className="micro">você</span>
                  ) : (
                    <form action={toggleUserAction}>
                      <input type="hidden" name="id" value={user.id} />
                      <Button type="submit" size="sm">
                        {user.active ? "Bloquear" : "Liberar"}
                      </Button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <aside className="flex flex-col gap-4">
        <section className="side-panel">
          <div className="side-title">
            <h2>Novo membro</h2>
          </div>
          <form action={createAction} className="edit-form">
            <Field label="Nome">
              <Input name="name" required maxLength={80} />
            </Field>
            <Field label="Usuário" hint="Sem espaços. É o que a pessoa digita no login.">
              <Input name="username" required maxLength={60} autoCapitalize="none" />
            </Field>
            <Field label="Senha" hint="Mínimo de 8 caracteres.">
              <Input name="password" type="password" required minLength={8} />
            </Field>
            <Field label="Papel">
              <Select name="role" defaultValue="member">
                <option value="member">Membro</option>
                <option value="admin">Administrador</option>
              </Select>
            </Field>

            <Result state={createState} />

            <Button type="submit" variant="primary" size="md" disabled={creating}>
              <UserPlus size={15} /> {creating ? "Criando…" : "Criar membro"}
            </Button>
          </form>
        </section>

        <section className="side-panel">
          <div className="side-title">
            <h2>Trocar senha</h2>
          </div>
          <form action={passwordAction} className="edit-form">
            <Field label="Membro">
              <Select name="id" defaultValue={currentUserId}>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.username})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nova senha">
              <Input name="password" type="password" required minLength={8} />
            </Field>

            <Result state={passwordState} />

            <Button type="submit" variant="primary" size="md" disabled={savingPassword}>
              <KeyRound size={15} /> {savingPassword ? "Salvando…" : "Trocar senha"}
            </Button>
          </form>
        </section>
      </aside>
    </div>
  );
}

function Result({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <p className="text-sm text-[var(--color-destructive)]" role="alert">
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p className="text-sm text-[var(--color-active)]" role="status">
        {state.ok}
      </p>
    );
  }
  return null;
}
