"use client";

import { useState } from "react";
import { notify } from "@/lib/notify";
import { Save } from "lucide-react";

import { updateSettingsAction } from "@/app/actions/admin";
import { ToggleCard } from "@/components/admin/ui";
import { FieldError, FieldLabel, fieldMessage, inputErrorClass } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { dayName } from "@/lib/opening";
import { cn } from "@/lib/utils";
import type { RestaurantSettingsRow } from "@/types/database";

export function SettingsForm({ settings }: { settings: RestaurantSettingsRow }) {
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [accepting, setAccepting] = useState(settings.is_accepting_orders);
  const [allowClosed, setAllowClosed] = useState(settings.allow_orders_when_closed);

  function clearError(key: string) {
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }
  const hours = settings.business_hours?.length
    ? settings.business_hours
    : Array.from({ length: 7 }, (_, day) => ({
        day,
        is_open: true,
        opens_at: "08:00",
        closes_at: "22:00",
      }));

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const business_hours = hours.map((entry) => ({
      day: entry.day,
      is_open: form.get(`open-${entry.day}`) === "on",
      opens_at: String(form.get(`opens-${entry.day}`) || "08:00"),
      closes_at: String(form.get(`closes-${entry.day}`) || "22:00"),
    }));

    setPending(true);
    setFieldErrors({});
    const result = await updateSettingsAction({
      restaurant_name: form.get("restaurant_name"),
      tagline: form.get("tagline"),
      description: form.get("description"),
      phone: form.get("phone"),
      email: form.get("email"),
      address: form.get("address"),
      currency: form.get("currency"),
      currency_symbol: form.get("currency_symbol"),
      locale: form.get("locale"),
      timezone: form.get("timezone"),
      default_delivery_fee: Number(form.get("default_delivery_fee")),
      minimum_delivery_order: Number(form.get("minimum_delivery_order")),
      order_prefix: form.get("order_prefix"),
      is_accepting_orders: accepting,
      allow_orders_when_closed: allowClosed,
      default_preparation_time: Number(form.get("default_preparation_time")),
      business_hours,
      facebook_url: form.get("facebook_url"),
      instagram_url: form.get("instagram_url"),
      whatsapp_number: form.get("whatsapp_number"),
      seo_title: form.get("seo_title"),
      seo_description: form.get("seo_description"),
    });
    setPending(false);
    if (!result.success) {
      setFieldErrors(result.fieldErrors ?? {});
      notify.formError(result);
    } else {
      notify.success("Settings saved", "Restaurant details are updated.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-5" noValidate>
      <section className="admin-card space-y-5 p-6">
        <SectionTitle title="Restaurant" body="Public name and contact details." />
        <Field
          id="restaurant_name"
          label="Restaurant name"
          defaultValue={settings.restaurant_name}
          required
          error={fieldMessage(fieldErrors, "restaurant_name")}
          onChange={() => clearError("restaurant_name")}
        />
        <Field
          id="tagline"
          label="Tagline"
          defaultValue={settings.tagline ?? ""}
          error={fieldMessage(fieldErrors, "tagline")}
          onChange={() => clearError("tagline")}
        />
        <div className="admin-field">
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            className={cn("min-h-24 rounded-xl", fieldMessage(fieldErrors, "description") && "border-destructive/60")}
            defaultValue={settings.description ?? ""}
            onChange={() => clearError("description")}
          />
          <FieldError message={fieldMessage(fieldErrors, "description")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="phone"
            label="Phone"
            defaultValue={settings.phone ?? ""}
            error={fieldMessage(fieldErrors, "phone")}
            onChange={() => clearError("phone")}
          />
          <Field
            id="email"
            label="Email"
            defaultValue={settings.email ?? ""}
            error={fieldMessage(fieldErrors, "email")}
            onChange={() => clearError("email")}
          />
        </div>
        <div className="admin-field">
          <FieldLabel htmlFor="address">Address</FieldLabel>
          <Textarea
            id="address"
            name="address"
            className={cn("min-h-20 rounded-xl", fieldMessage(fieldErrors, "address") && "border-destructive/60")}
            defaultValue={settings.address ?? ""}
            onChange={() => clearError("address")}
          />
          <FieldError message={fieldMessage(fieldErrors, "address")} />
        </div>
      </section>

      <section className="admin-card space-y-5 p-6">
        <SectionTitle title="Ordering" body="Fees, currency, and whether orders are accepted." />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            id="currency"
            label="Currency"
            defaultValue={settings.currency}
            required
            error={fieldMessage(fieldErrors, "currency")}
            onChange={() => clearError("currency")}
          />
          <Field
            id="currency_symbol"
            label="Symbol"
            defaultValue={settings.currency_symbol}
            required
            error={fieldMessage(fieldErrors, "currency_symbol")}
            onChange={() => clearError("currency_symbol")}
          />
          <Field
            id="locale"
            label="Locale"
            defaultValue={settings.locale}
            required
            error={fieldMessage(fieldErrors, "locale")}
            onChange={() => clearError("locale")}
          />
        </div>
        <Field
          id="timezone"
          label="Timezone"
          defaultValue={settings.timezone}
          required
          error={fieldMessage(fieldErrors, "timezone")}
          onChange={() => clearError("timezone")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="default_delivery_fee"
            label="Delivery fee"
            defaultValue={String(settings.default_delivery_fee)}
            type="number"
            required
            error={fieldMessage(fieldErrors, "default_delivery_fee")}
            onChange={() => clearError("default_delivery_fee")}
          />
          <Field
            id="minimum_delivery_order"
            label="Minimum delivery"
            defaultValue={String(settings.minimum_delivery_order)}
            type="number"
            required
            error={fieldMessage(fieldErrors, "minimum_delivery_order")}
            onChange={() => clearError("minimum_delivery_order")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="order_prefix"
            label="Order prefix"
            defaultValue={settings.order_prefix}
            required
            error={fieldMessage(fieldErrors, "order_prefix")}
            onChange={() => clearError("order_prefix")}
          />
          <Field
            id="default_preparation_time"
            label="Default prep time"
            defaultValue={String(settings.default_preparation_time)}
            type="number"
            required
            error={fieldMessage(fieldErrors, "default_preparation_time")}
            onChange={() => clearError("default_preparation_time")}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleCard
            label="Accepting orders"
            description="Turn online ordering on or off"
            checked={accepting}
            onChange={setAccepting}
          />
          <ToggleCard
            label="Allow when closed"
            description="Take orders outside opening hours"
            checked={allowClosed}
            onChange={setAllowClosed}
          />
        </div>
      </section>

      <section className="admin-card space-y-4 p-6">
        <SectionTitle title="Opening hours" body="Weekly schedule shown on the public site." />
        <div className="space-y-2">
          {hours.map((entry) => (
            <div
              key={entry.day}
              className="grid grid-cols-1 items-center gap-2 rounded-xl bg-black/[0.02] p-3 text-sm sm:grid-cols-[7rem_auto_6rem_6rem]"
            >
              <span className="font-medium">{dayName(entry.day)}</span>
              <label className="flex items-center gap-2">
                <input type="checkbox" name={`open-${entry.day}`} defaultChecked={entry.is_open} className="size-4 accent-[var(--primary)]" />
                Open
              </label>
              <Input name={`opens-${entry.day}`} className="admin-input h-10" defaultValue={entry.opens_at} />
              <Input name={`closes-${entry.day}`} className="admin-input h-10" defaultValue={entry.closes_at} />
            </div>
          ))}
        </div>
      </section>

      <section className="admin-card space-y-5 p-6">
        <SectionTitle title="Social & SEO" body="Links and search text for the website." />
        <Field
          id="facebook_url"
          label="Facebook URL"
          defaultValue={settings.facebook_url ?? ""}
          error={fieldMessage(fieldErrors, "facebook_url")}
          onChange={() => clearError("facebook_url")}
        />
        <Field
          id="instagram_url"
          label="Instagram URL"
          defaultValue={settings.instagram_url ?? ""}
          error={fieldMessage(fieldErrors, "instagram_url")}
          onChange={() => clearError("instagram_url")}
        />
        <Field
          id="whatsapp_number"
          label="WhatsApp"
          defaultValue={settings.whatsapp_number ?? ""}
          error={fieldMessage(fieldErrors, "whatsapp_number")}
          onChange={() => clearError("whatsapp_number")}
        />
        <Field
          id="seo_title"
          label="SEO title"
          defaultValue={settings.seo_title ?? ""}
          error={fieldMessage(fieldErrors, "seo_title")}
          onChange={() => clearError("seo_title")}
        />
        <div className="admin-field">
          <FieldLabel htmlFor="seo_description">SEO description</FieldLabel>
          <Textarea
            id="seo_description"
            name="seo_description"
            className={cn("min-h-24 rounded-xl", fieldMessage(fieldErrors, "seo_description") && "border-destructive/60")}
            defaultValue={settings.seo_description ?? ""}
            onChange={() => clearError("seo_description")}
          />
          <FieldError message={fieldMessage(fieldErrors, "seo_description")} />
        </div>
      </section>

      <div className="flex justify-end">
        <button type="submit" className="btn-admin min-w-44" disabled={pending}>
          <Save className="size-4" />
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}

function SectionTitle({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{body}</p>
    </div>
  );
}

function Field({
  id,
  label,
  defaultValue,
  type = "text",
  required = false,
  error,
  onChange,
}: {
  id: string;
  label: string;
  defaultValue: string;
  type?: string;
  required?: boolean;
  error?: string;
  onChange?: () => void;
}) {
  return (
    <div className="admin-field">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <Input
        id={id}
        name={id}
        type={type}
        className={inputErrorClass(Boolean(error))}
        defaultValue={defaultValue}
        step={type === "number" ? "0.01" : undefined}
        onChange={onChange}
      />
      <FieldError message={error} />
    </div>
  );
}
