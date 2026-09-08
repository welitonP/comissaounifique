"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { loginAction, type ActionState } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(loginAction, {});

  return (
    <form action={action} className="edit-form rounded-lg border bg-[var(--color-card)]">
      <input type="hidden" name="next" value={next ?? ""} />

      <Field label="Usuário">
        <Input name="username" autoComplete="username" autoCapitalize="none" required />
      </Field>

      <Field label="Senha">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>

      {state.error ? (
        <p className="text-sm text-[var(--color-destructive)]" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" variant="primary" size="md" disabled={pending}>
        <LogIn size={16} />
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
