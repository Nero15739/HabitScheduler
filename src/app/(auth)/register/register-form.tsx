"use client";

import { useActionState } from "react";
import { registerAction } from "../actions";
import { Button, Field, Input } from "@/components/ui";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);
  const action = (fd: FormData) => {
    try {
      fd.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    } catch {
      fd.set("timezone", "UTC");
    }
    return formAction(fd);
  };
  return (
    <form action={action} className="space-y-4">
      <Field label="Name">
        <Input name="name" autoComplete="name" required placeholder="Andrew" />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </Field>
      <Field label="Password" hint="At least 8 characters.">
        <Input name="password" type="password" autoComplete="new-password" minLength={8} required placeholder="••••••••" />
      </Field>
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create account"}
      </Button>
      <p className="text-xs text-text-3">Your timezone is detected from the browser. You can change it later in Settings.</p>
    </form>
  );
}
