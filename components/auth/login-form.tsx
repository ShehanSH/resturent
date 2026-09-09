"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { notify } from "@/lib/notify";

import { loginAction } from "@/app/actions/auth";
import { FieldError, FieldLabel, fieldMessage, inputErrorClass } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { safeStaffReturnPath } from "@/lib/auth/paths";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function clearError(key: string) {
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setFieldErrors({});
    const result = await loginAction({
      email: form.get("email"),
      password: form.get("password"),
    });
    setPending(false);
    if (!result.success) {
      setFieldErrors(result.fieldErrors ?? {});
      notify.formError(result);
      return;
    }
    const redirectTo = searchParams.get("redirectTo");
    router.push(safeStaffReturnPath(redirectTo, result.data.redirectTo));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <FieldLabel htmlFor="email" required>
          Email
        </FieldLabel>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "email")))}
          onChange={() => clearError("email")}
        />
        <FieldError message={fieldMessage(fieldErrors, "email")} />
      </div>
      <div className="space-y-2">
        <FieldLabel htmlFor="password" required>
          Password
        </FieldLabel>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "password")))}
          onChange={() => clearError("password")}
        />
        <FieldError message={fieldMessage(fieldErrors, "password")} />
      </div>
      <button type="submit" className="btn-admin w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
