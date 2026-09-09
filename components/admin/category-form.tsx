"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

import { upsertCategoryAction } from "@/app/actions/catalog";
import { FieldError, FieldLabel, fieldMessage, inputErrorClass } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SeoPreview } from "@/components/admin/seo-preview";
import { FormSection, ToggleCard } from "@/components/admin/ui";
import { BRAND_FALLBACK_NAME } from "@/lib/brand";
import { slugify } from "@/lib/format";
import { notify } from "@/lib/notify";
import { categorySeoDescription, categorySeoTitle, seoPlaceName } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/types/database";

export function CategoryForm({
  category,
  restaurantName = BRAND_FALLBACK_NAME,
  restaurantAddress = null,
}: {
  category?: CategoryRow;
  restaurantName?: string;
  restaurantAddress?: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [active, setActive] = useState(category?.is_active ?? true);
  const [featured, setFeatured] = useState(category?.is_featured ?? false);
  const [description, setDescription] = useState(category?.description ?? "");
  const location = seoPlaceName(restaurantName, restaurantAddress);
  const seoTitle = name.trim() ? categorySeoTitle(name, restaurantName) : "";
  const seoDescription = name.trim()
    ? categorySeoDescription({
        name,
        restaurantName,
        description,
        location,
      })
    : "";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setFieldErrors({});
    const result = await upsertCategoryAction(category?.id ?? null, {
      name,
      slug: slug || slugify(name),
      description,
      display_order: Number(form.get("display_order") || 0),
      is_active: active,
      is_featured: featured,
      image_url: category?.image_url ?? "",
    });
    setPending(false);
    if (!result.success) {
      setFieldErrors(result.fieldErrors ?? {});
      notify.formError(result);
      return;
    }
    notify.success("Category saved", "Menu sections are updated.");
    router.push("/admin/categories");
    router.refresh();
  }

  function clearError(key: string) {
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-5" noValidate>
      <FormSection title="Basics" description="Name and public URL for this menu section.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="admin-field sm:col-span-2">
            <FieldLabel htmlFor="name" required>
              Name
            </FieldLabel>
            <Input
              id="name"
              className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "name")))}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                clearError("name");
                if (!category) setSlug(slugify(event.target.value));
              }}
              placeholder="e.g. Burgers"
            />
            <FieldError message={fieldMessage(fieldErrors, "name")} />
          </div>
          <div className="admin-field">
            <FieldLabel htmlFor="slug" required>
              Slug
            </FieldLabel>
            <Input
              id="slug"
              className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "slug")))}
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value);
                clearError("slug");
              }}
              placeholder="burgers"
            />
            <FieldError message={fieldMessage(fieldErrors, "slug")} />
          </div>
          <div className="admin-field">
            <FieldLabel htmlFor="display_order">
              Display order
            </FieldLabel>
            <Input
              id="display_order"
              name="display_order"
              type="number"
              className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "display_order")))}
              defaultValue={category?.display_order ?? 0}
              onChange={() => clearError("display_order")}
            />
            <FieldError message={fieldMessage(fieldErrors, "display_order")} />
          </div>
          <div className="admin-field sm:col-span-2">
            <FieldLabel htmlFor="description">
              Description
            </FieldLabel>
            <Textarea
              id="description"
              name="description"
              className={cn(
                "min-h-24 rounded-lg",
                fieldMessage(fieldErrors, "description") && "border-destructive/60",
              )}
              value={description}
              placeholder="Short line shown with this category"
              onChange={(event) => {
                setDescription(event.target.value);
                clearError("description");
              }}
            />
            <FieldError message={fieldMessage(fieldErrors, "description")} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Visibility" description="Control whether customers can see this category.">
        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleCard
            label="Active"
            description="Show this category on the public menu"
            checked={active}
            onChange={setActive}
          />
          <ToggleCard
            label="Featured"
            description="Highlight it on the home page menu"
            checked={featured}
            onChange={setFeatured}
          />
        </div>
      </FormSection>

      <SeoPreview title={seoTitle} description={seoDescription} />

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button type="button" className="btn-admin-outline" onClick={() => router.push("/admin/categories")}>
          Cancel
        </button>
        <button type="submit" className="btn-admin min-w-40" disabled={pending}>
          <Save className="size-4" />
          {pending ? "Saving…" : "Save category"}
        </button>
      </div>
    </form>
  );
}
