"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Megaphone, Search, Upload } from "lucide-react";

import { addCustomerAction, importCustomersAction, sendCampaignAction } from "@/app/actions/sms";
import { FieldError, FieldLabel, fieldMessage, inputErrorClass } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/lib/notify";
import {
  CAMPAIGN_MAX_IMPORT,
  CAMPAIGN_MESSAGE_MAX,
  campaignTemplate,
  classifyImportedPhones,
  parseCustomerImportLines,
  smsSegmentCount,
  type CampaignTemplateId,
} from "@/lib/sms/campaign";
import { cn } from "@/lib/utils";

type Customer = {
  id: string;
  name: string;
  phone: string;
  total_orders: number;
};

export function SmsCampaignPanel({
  customers,
  restaurantName,
  orderUrl,
  smsEnabled,
}: {
  customers: Customer[];
  restaurantName: string;
  orderUrl: string;
  smsEnabled: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [template, setTemplate] = useState<CampaignTemplateId>("weekend");
  const [message, setMessage] = useState(campaignTemplate("weekend", restaurantName, orderUrl));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [sending, setSending] = useState(false);

  const existingPhones = useMemo(() => customers.map((customer) => customer.phone), [customers]);
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) || customer.phone.replace(/\s/g, "").includes(term.replace(/\s/g, "")),
    );
  }, [customers, query]);

  const classified = useMemo(
    () => classifyImportedPhones(parseCustomerImportLines(bulkText), existingPhones),
    [bulkText, existingPhones],
  );
  const newCount = classified.filter((row) => row.status === "new").length;
  const duplicateCount = classified.filter((row) => row.status === "duplicate").length;
  const invalidCount = classified.filter((row) => row.status === "invalid").length;
  const segments = smsSegmentCount(message);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleVisible() {
    const ids = visible.map((customer) => customer.id);
    const allOn = ids.length > 0 && ids.every((id) => selected.has(id));
    setSelected((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (allOn) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  function applyTemplate(id: CampaignTemplateId) {
    setTemplate(id);
    if (id !== "custom") setMessage(campaignTemplate(id, restaurantName, orderUrl));
  }

  async function onAddOne(event: React.FormEvent) {
    event.preventDefault();
    const preview = classifyImportedPhones([{ phone, name: name || "Customer" }], existingPhones)[0];
    if (preview?.status === "duplicate") {
      setFieldErrors({ phone: ["This number is already in the customer list."] });
      notify.error("That mobile number is already saved.");
      return;
    }
    setAdding(true);
    setFieldErrors({});
    const result = await addCustomerAction({ name, phone });
    setAdding(false);
    if (!result.success) {
      setFieldErrors(result.fieldErrors ?? {});
      notify.formError(result);
      return;
    }
    notify.success("Number saved", "It is now in the customer list.");
    setName("");
    setPhone("");
    setSelected((current) => new Set(current).add(result.data.id));
    router.refresh();
  }

  async function onImport() {
    if (!bulkText.trim()) {
      notify.error("Paste or upload at least one mobile number.");
      return;
    }
    if (newCount === 0) {
      notify.error(
        duplicateCount > 0
          ? "Those numbers are already saved. Enter only new mobile numbers."
          : "None of those lines look like a valid mobile number.",
      );
      return;
    }
    setImporting(true);
    const result = await importCustomersAction({ text: bulkText });
    setImporting(false);
    if (!result.success) {
      notify.formError(result);
      return;
    }
    notify.success(
      result.data.added === 1 ? "1 new number saved" : `${result.data.added} new numbers saved`,
      result.data.duplicates > 0
        ? `${result.data.duplicates} already in the list were skipped.`
        : undefined,
    );
    setBulkText("");
    router.refresh();
  }

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const text = await file.text();
    setBulkText((current) => (current.trim() ? `${current.trim()}\n${text}` : text));
  }

  async function onSend() {
    if (selected.size === 0) {
      notify.error("Select at least one customer.");
      return;
    }
    if (
      !window.confirm(
        `Send this SMS to ${selected.size} ${selected.size === 1 ? "number" : "numbers"}? Gateway charges apply.`,
      )
    ) {
      return;
    }
    setSending(true);
    const result = await sendCampaignAction({ message, customerIds: [...selected] });
    setSending(false);
    if (!result.success) {
      notify.formError(result);
      return;
    }
    notify.success(
      result.data.sent > 0 ? `Sent to ${result.data.sent}` : "No messages were accepted",
      result.data.failed + result.data.skipped > 0
        ? `${result.data.failed} failed · ${result.data.skipped} skipped`
        : "Check the SMS log for delivery status.",
    );
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <section className="admin-card space-y-6 p-5 sm:p-6">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Step 1</p>
          <h2 className="mt-1 text-base font-semibold tracking-tight">Recipients</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Choose saved customers, or add numbers that are not already in the database.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium">Saved numbers</h3>
            <p className="text-muted-foreground text-xs">
              {selected.size} selected · {customers.length} saved
            </p>
          </div>
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or number…"
              className="admin-search-input"
            />
          </div>
          {customers.length === 0 ? (
            <p className="text-muted-foreground rounded-lg bg-muted/50 px-3 py-4 text-sm">
              No numbers saved yet. Customers who order are added automatically. You can also paste new numbers below.
            </p>
          ) : (
            <>
              <button type="button" className="btn-admin-outline h-8 px-3 text-xs" onClick={toggleVisible}>
                {visible.length > 0 && visible.every((customer) => selected.has(customer.id))
                  ? "Clear visible"
                  : "Select visible"}
              </button>
              <ul className="max-h-72 divide-y divide-border/70 overflow-y-auto rounded-lg border border-border/80">
                {visible.map((customer) => {
                  const on = selected.has(customer.id);
                  return (
                    <li key={customer.id}>
                      <button
                        type="button"
                        onClick={() => toggle(customer.id)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition",
                          on ? "bg-primary/5" : "hover:bg-muted/40",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex size-5 shrink-0 items-center justify-center rounded-full border",
                            on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white",
                          )}
                        >
                          {on ? <Check className="size-3" /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{customer.name}</span>
                          <span className="text-muted-foreground block text-xs">{customer.phone}</span>
                        </span>
                        <span className="text-muted-foreground shrink-0 text-xs">
                          {customer.total_orders} {customer.total_orders === 1 ? "order" : "orders"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <div className="border-t border-border/70 pt-6">
          <h3 className="text-sm font-medium">Add a new number</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Rejected automatically if that mobile number is already saved.
          </p>
          <form onSubmit={(event) => void onAddOne(event)} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]" noValidate>
            <div className="admin-field">
              <FieldLabel htmlFor="customer-name">Name</FieldLabel>
              <Input
                id="customer-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Optional"
                className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "name")))}
              />
            </div>
            <div className="admin-field">
              <FieldLabel htmlFor="customer-phone" required>
                Mobile number
              </FieldLabel>
              <Input
                id="customer-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0771234567"
                inputMode="tel"
                className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "phone")))}
              />
              <FieldError message={fieldMessage(fieldErrors, "phone")} />
            </div>
            <button type="submit" className="btn-admin h-10 self-end px-4 text-sm" disabled={adding}>
              {adding ? "Saving…" : "Save"}
            </button>
          </form>
        </div>

        <div className="border-t border-border/70 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-medium">Upload or paste numbers</h3>
              <p className="text-muted-foreground mt-1 text-xs">
                One number per line, or <span className="font-medium">name, 077…</span>. CSV and text files work. Max{" "}
                {CAMPAIGN_MAX_IMPORT} at a time.
              </p>
            </div>
            <button type="button" className="btn-admin-outline h-9 px-3 text-xs" onClick={() => fileRef.current?.click()}>
              <Upload className="size-3.5" />
              Upload file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,text/plain,text/csv"
              className="sr-only"
              onChange={(event) => void onFile(event)}
            />
          </div>
          <Textarea
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            placeholder={"0771234567\nKasun, 0766650952"}
            className="admin-input mt-3 min-h-28 py-2"
          />
          {classified.length > 0 ? (
            <p className="mt-2 text-xs">
              <span className="font-medium text-emerald-700">{newCount} new</span>
              <span className="text-muted-foreground"> · </span>
              <span className="font-medium text-amber-800">{duplicateCount} already saved</span>
              <span className="text-muted-foreground"> · </span>
              <span className="font-medium text-rose-700">{invalidCount} invalid</span>
            </p>
          ) : null}
          <button
            type="button"
            className="btn-admin mt-3 h-10 px-4 text-sm"
            disabled={importing || newCount === 0}
            onClick={() => void onImport()}
          >
            {importing ? "Importing…" : "Import new numbers only"}
          </button>
        </div>
      </section>

      <section className="admin-card h-fit space-y-5 p-5 sm:p-6">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Step 2</p>
          <h2 className="mt-1 text-base font-semibold tracking-tight">Message</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Weekend specials and offers, instead of a WhatsApp status.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["weekend", "Weekend special"],
              ["offer", "New offer"],
              ["friday", "Friday pizza"],
              ["custom", "Custom"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => applyTemplate(id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition",
                template === id
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-white text-muted-foreground ring-border hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="admin-field">
          <FieldLabel htmlFor="campaign-message" required>
            SMS text
          </FieldLabel>
          <Textarea
            id="campaign-message"
            value={message}
            onChange={(event) => {
              setTemplate("custom");
              setMessage(event.target.value.slice(0, CAMPAIGN_MESSAGE_MAX));
            }}
            className="admin-input min-h-40 py-2"
          />
          <p className="text-muted-foreground text-xs">
            {message.length}/{CAMPAIGN_MESSAGE_MAX} · {segments} {segments === 1 ? "SMS segment" : "SMS segments"}
          </p>
        </div>

        {!smsEnabled ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
            SMS is off in this environment. Configure the gateway before sending to customers.
          </p>
        ) : null}

        <button
          type="button"
          className="btn-admin h-11 w-full"
          disabled={sending || selected.size === 0 || message.trim().length < 10}
          onClick={() => void onSend()}
        >
          <Megaphone className="size-4" />
          {sending ? "Sending…" : `Send to ${selected.size || 0} ${selected.size === 1 ? "number" : "numbers"}`}
        </button>
      </section>
    </div>
  );
}
