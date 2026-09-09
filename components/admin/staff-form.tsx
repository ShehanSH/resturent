"use client";

import { useState } from "react";
import { notify } from "@/lib/notify";
import { UserPlus } from "lucide-react";

import { createStaffAction } from "@/app/actions/admin";
import { AdminSelect } from "@/components/admin/select-field";
import { FieldError, FieldLabel, fieldMessage, inputErrorClass } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export function StaffCreateForm() {
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [roleKey, setRoleKey] = useState(0);

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
    const result = await createStaffAction({
      full_name: form.get("full_name"),
      email: form.get("email"),
      password: form.get("password"),
      phone: form.get("phone"),
      role: form.get("role"),
    });
    setPending(false);
    if (!result.success) {
      setFieldErrors(result.fieldErrors ?? {});
      notify.formError(result);
      return;
    }
    notify.success("Staff member created", "They can sign in with the temporary password.");
    event.currentTarget.reset();
    setRoleKey((key) => key + 1);
  }

  return (
    <form onSubmit={onSubmit} className="admin-card h-fit space-y-4 p-5" noValidate>
      <div>
        <h2 className="text-base font-semibold tracking-tight">Add staff</h2>
        <p className="text-muted-foreground mt-1 text-sm">Create cashier, delivery, or admin access.</p>
      </div>
      <div className="admin-field">
        <FieldLabel htmlFor="full_name" required>
          Full name
        </FieldLabel>
        <Input
          id="full_name"
          name="full_name"
          className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "full_name")))}
          onChange={() => clearError("full_name")}
        />
        <FieldError message={fieldMessage(fieldErrors, "full_name")} />
      </div>
      <div className="admin-field">
        <FieldLabel htmlFor="email" required>
          Email
        </FieldLabel>
        <Input
          id="email"
          name="email"
          type="email"
          className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "email")))}
          onChange={() => clearError("email")}
        />
        <FieldError message={fieldMessage(fieldErrors, "email")} />
      </div>
      <div className="admin-field">
        <FieldLabel htmlFor="password" required>
          Temporary password
        </FieldLabel>
        <Input
          id="password"
          name="password"
          type="password"
          className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "password")))}
          onChange={() => clearError("password")}
        />
        <FieldError message={fieldMessage(fieldErrors, "password")} />
      </div>
      <div className="admin-field">
        <FieldLabel htmlFor="phone">Phone</FieldLabel>
        <Input
          id="phone"
          name="phone"
          className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "phone")))}
          onChange={() => clearError("phone")}
        />
        <FieldError message={fieldMessage(fieldErrors, "phone")} />
      </div>
      <div className="admin-field">
        <FieldLabel htmlFor="role" required>
          Role
        </FieldLabel>
        <AdminSelect
          key={roleKey}
          id="role"
          name="role"
          defaultValue="CASHIER"
          onValueChange={() => clearError("role")}
          className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "role")))}
          options={[
            { value: "ADMIN", label: "Administrator" },
            { value: "CASHIER", label: "Cashier" },
            { value: "DELIVERY", label: "Delivery rider" },
          ]}
        />
        <FieldError message={fieldMessage(fieldErrors, "role")} />
      </div>
      <button type="submit" className="btn-admin w-full" disabled={pending}>
        <UserPlus className="size-4" />
        {pending ? "Creating…" : "Create staff"}
      </button>
    </form>
  );
}
