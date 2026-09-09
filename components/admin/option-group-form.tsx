"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";

import { saveOptionGroupWithChoicesAction } from "@/app/actions/catalog";
import { AdminSelect } from "@/components/admin/select-field";
import { FormSection, ToggleCard } from "@/components/admin/ui";
import { FieldError, FieldLabel, fieldMessage, inputErrorClass } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/lib/notify";
import type { OptionGroupWithOptions } from "@/lib/services/catalog.service";
import type { OptionSelectionType } from "@/types/database";

type DraftChoice = {
  key: string;
  id?: string;
  name: string;
  price_adjustment: string;
  is_available: boolean;
  is_default: boolean;
};

function toDraft(group?: OptionGroupWithOptions): DraftChoice[] {
  if (!group?.options.length) {
    return [
      { key: "new-1", name: "", price_adjustment: "0", is_available: true, is_default: true },
      { key: "new-2", name: "", price_adjustment: "", is_available: true, is_default: false },
    ];
  }
  return group.options.map((option) => ({
    key: option.id,
    id: option.id,
    name: option.name,
    price_adjustment: String(option.price_adjustment),
    is_available: option.is_available,
    is_default: option.is_default,
  }));
}

export function OptionGroupForm({ group }: { group?: OptionGroupWithOptions }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [selectionType, setSelectionType] = useState<OptionSelectionType>(group?.selection_type ?? "SINGLE");
  const [required, setRequired] = useState(group?.is_required ?? true);
  const [active, setActive] = useState(group?.is_active ?? true);
  const [maxSelect, setMaxSelect] = useState(
    group?.selection_type === "MULTIPLE" && group.max_select ? String(group.max_select) : "",
  );
  const [choices, setChoices] = useState<DraftChoice[]>(() => toDraft(group));

  function clearError(key: string) {
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateChoice(key: string, patch: Partial<DraftChoice>) {
    setChoices((current) =>
      current.map((choice) => {
        if (choice.key !== key) {
          if (patch.is_default && selectionType === "SINGLE") return { ...choice, is_default: false };
          return choice;
        }
        return { ...choice, ...patch };
      }),
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFieldErrors({});
    const result = await saveOptionGroupWithChoicesAction(group?.id ?? null, {
      name,
      description,
      selection_type: selectionType,
      is_required: required,
      min_select: required ? 1 : 0,
      max_select: selectionType === "SINGLE" ? 1 : maxSelect,
      display_order: group?.display_order ?? 0,
      is_active: active,
      options: choices.map((choice) => ({
        id: choice.id,
        name: choice.name,
        price_adjustment: choice.price_adjustment === "" ? 0 : Number(choice.price_adjustment),
        is_available: choice.is_available,
        is_default: choice.is_default,
      })),
    });
    setPending(false);
    if (!result.success) {
      setFieldErrors(result.fieldErrors ?? {});
      notify.formError(result);
      return;
    }
    notify.success("Option group saved", "Attach it to dishes from the Food items page.");
    router.push("/admin/options");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-5" noValidate>
      <FormSection
        title="Group details"
        description="This is the heading customers see, like Drink size or Extra toppings."
      >
        <div className="admin-field">
          <FieldLabel htmlFor="name" required>
            Name
          </FieldLabel>
          <Input
            id="name"
            className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "name")))}
            value={name}
            placeholder="e.g. Drink size"
            onChange={(event) => {
              setName(event.target.value);
              clearError("name");
            }}
          />
          <FieldError message={fieldMessage(fieldErrors, "name")} />
        </div>
        <div className="admin-field">
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            className="min-h-20 rounded-lg"
            value={description}
            placeholder="Optional helper text for staff"
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="admin-field">
            <FieldLabel htmlFor="selection_type" required>
              How customers choose
            </FieldLabel>
            <AdminSelect
              id="selection_type"
              value={selectionType}
              onValueChange={(value) => setSelectionType(value as OptionSelectionType)}
              options={[
                { value: "SINGLE", label: "One choice (size, spice)" },
                { value: "MULTIPLE", label: "Several choices (toppings)" },
              ]}
            />
          </div>
          {selectionType === "MULTIPLE" ? (
            <div className="admin-field">
              <FieldLabel htmlFor="max_select">Maximum choices</FieldLabel>
              <Input
                id="max_select"
                type="number"
                min={1}
                className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "max_select")))}
                value={maxSelect}
                placeholder="No limit"
                onChange={(event) => setMaxSelect(event.target.value)}
              />
              <p className="text-muted-foreground text-xs">Leave blank to allow any number.</p>
            </div>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleCard
            label="Required"
            description="Customer must pick before adding to cart"
            checked={required}
            onChange={setRequired}
          />
          <ToggleCard
            label="Active"
            description="Available to attach to dishes"
            checked={active}
            onChange={setActive}
          />
        </div>
      </FormSection>

      <FormSection
        title="Choices and prices"
        description="Set each choice and the extra amount added to the dish price. Use 0 for Included."
      >
        <FieldError message={fieldMessage(fieldErrors, "options")} />
        <div className="space-y-3">
          {choices.map((choice, index) => (
            <div key={choice.key} className="rounded-xl border border-border/80 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Choice {index + 1}</p>
                {choices.length > 1 ? (
                  <button
                    type="button"
                    className="btn-admin-danger h-8 px-2.5 text-xs"
                    onClick={() => setChoices((current) => current.filter((item) => item.key !== choice.key))}
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                <div className="admin-field">
                  <FieldLabel htmlFor={`choice-name-${choice.key}`} required>
                    Name
                  </FieldLabel>
                  <Input
                    id={`choice-name-${choice.key}`}
                    className="admin-input"
                    value={choice.name}
                    placeholder={index === 0 ? "e.g. Regular" : "e.g. Large"}
                    onChange={(event) => updateChoice(choice.key, { name: event.target.value })}
                  />
                </div>
                <div className="admin-field">
                  <FieldLabel htmlFor={`choice-price-${choice.key}`}>Extra price</FieldLabel>
                  <Input
                    id={`choice-price-${choice.key}`}
                    type="number"
                    step="0.01"
                    className="admin-input"
                    value={choice.price_adjustment}
                    placeholder="0"
                    onChange={(event) => updateChoice(choice.key, { price_adjustment: event.target.value })}
                  />
                  <p className="text-muted-foreground text-xs">0 = Included</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--primary)]"
                    checked={choice.is_default}
                    onChange={(event) => updateChoice(choice.key, { is_default: event.target.checked })}
                  />
                  Default selection
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--primary)]"
                    checked={choice.is_available}
                    onChange={(event) => updateChoice(choice.key, { is_available: event.target.checked })}
                  />
                  Available
                </label>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn-admin-outline"
          onClick={() =>
            setChoices((current) => [
              ...current,
              {
                key: `new-${Date.now()}`,
                name: "",
                price_adjustment: "",
                is_available: true,
                is_default: false,
              },
            ])
          }
        >
          <Plus className="size-4" />
          Add choice
        </button>
      </FormSection>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button type="button" className="btn-admin-outline" onClick={() => router.push("/admin/options")}>
          Cancel
        </button>
        <button type="submit" className="btn-admin min-w-40" disabled={pending}>
          <Save className="size-4" />
          {pending ? "Saving…" : "Save option group"}
        </button>
      </div>
    </form>
  );
}
