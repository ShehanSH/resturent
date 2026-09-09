"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Save } from "lucide-react";
import Link from "next/link";

import { upsertFoodItemAction } from "@/app/actions/catalog";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { SeoPreview } from "@/components/admin/seo-preview";
import { AdminSelect } from "@/components/admin/select-field";
import { FormSection, ToggleCard } from "@/components/admin/ui";
import { FieldError, FieldLabel, fieldMessage, inputErrorClass } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BRAND_FALLBACK_NAME } from "@/lib/brand";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { formatPriceAdjustment, slugify } from "@/lib/format";
import { notify } from "@/lib/notify";
import { foodItemSeoDescription, foodItemSeoTitle, seoPlaceName } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { OptionGroupWithOptions } from "@/lib/services/catalog.service";
import type { CategoryRow, FoodItemRow, RestaurantSettingsRow } from "@/types/database";

export function FoodItemForm({
  item,
  categories,
  optionGroupIds,
  optionGroups,
  restaurantName = BRAND_FALLBACK_NAME,
  restaurantAddress = null,
  returnTo = "/admin/products",
  settings,
}: {
  item?: FoodItemRow & { option_group_ids?: string[] };
  categories: CategoryRow[];
  optionGroupIds?: string[];
  optionGroups: OptionGroupWithOptions[];
  restaurantName?: string;
  restaurantAddress?: string | null;
  returnTo?: string;
  settings?: Pick<RestaurantSettingsRow, "currency" | "currency_symbol" | "locale">;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [name, setName] = useState(item?.name ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [available, setAvailable] = useState(item?.is_available ?? true);
  const [active, setActive] = useState(item?.is_active ?? true);
  const [featured, setFeatured] = useState(item?.is_featured ?? false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>(
    optionGroupIds ?? item?.option_group_ids ?? [],
  );
  const [imageUrl, setImageUrl] = useState<string | null>(item?.image_url ?? null);
  const [categoryId, setCategoryId] = useState(item?.category_id ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const categoryName = categories.find((category) => category.id === categoryId)?.name ?? null;
  const location = seoPlaceName(restaurantName, restaurantAddress);
  const seoTitle = name.trim() ? foodItemSeoTitle(name, restaurantName, categoryName) : "";
  const seoDescription = name.trim()
    ? foodItemSeoDescription({
        name,
        restaurantName,
        description,
        categoryName,
        location,
      })
    : "";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setFieldErrors({});
    const result = await upsertFoodItemAction(item?.id ?? null, {
      category_id: categoryId,
      name,
      slug: slug || slugify(name),
      description,
      price: form.get("price"),
      discount_price: form.get("discount_price") || "",
      preparation_time: form.get("preparation_time") || "",
      display_order: Number(form.get("display_order") || 0),
      is_available: available,
      is_active: active,
      is_featured: featured,
      image_url: imageUrl || "",
      option_group_ids: selectedGroups,
    });
    setPending(false);
    if (!result.success) {
      setFieldErrors(result.fieldErrors ?? {});
      notify.formError(result);
      return;
    }
    notify.success("Dish saved", "Your changes are live on the menu.");
    router.push(returnTo);
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

  function toggleGroup(id: string) {
    setSelectedGroups((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-5" noValidate>
      <FormSection title="Dish details" description="Name, category, and pricing customers will see.">
        <ImageUploadField
          label="Dish photo"
          description="JPEG, PNG, WebP or AVIF · max 5 MB"
          bucket={STORAGE_BUCKETS.foodImages}
          value={imageUrl}
          onChange={(url) => {
            setImageUrl(url);
            clearError("image_url");
          }}
        />
        <FieldError message={fieldMessage(fieldErrors, "image_url")} />
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
                if (!item) setSlug(slugify(event.target.value));
              }}
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
            />
            <FieldError message={fieldMessage(fieldErrors, "slug")} />
          </div>
          <div className="admin-field">
            <FieldLabel htmlFor="category_id" required>
              Category
            </FieldLabel>
            <AdminSelect
              id="category_id"
              value={categoryId || undefined}
              placeholder="Choose a category"
              className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "category_id")))}
              onValueChange={(value) => {
                setCategoryId(value);
                clearError("category_id");
              }}
              options={categories.map((category) => ({ value: category.id, label: category.name }))}
            />
            <FieldError message={fieldMessage(fieldErrors, "category_id")} />
          </div>
          <div className="admin-field">
            <FieldLabel htmlFor="price" required>
              Price
            </FieldLabel>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "price")))}
              defaultValue={item?.price ?? ""}
              onChange={() => clearError("price")}
            />
            <FieldError message={fieldMessage(fieldErrors, "price")} />
          </div>
          <div className="admin-field">
            <FieldLabel htmlFor="discount_price">
              Discount price
            </FieldLabel>
            <Input
              id="discount_price"
              name="discount_price"
              type="number"
              step="0.01"
              className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "discount_price")))}
              defaultValue={item?.discount_price ?? ""}
              onChange={() => clearError("discount_price")}
            />
            <FieldError message={fieldMessage(fieldErrors, "discount_price")} />
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
              onChange={(event) => {
                setDescription(event.target.value);
                clearError("description");
              }}
            />
            <FieldError message={fieldMessage(fieldErrors, "description")} />
          </div>
          <div className="admin-field">
            <FieldLabel htmlFor="preparation_time">
              Prep time (minutes)
            </FieldLabel>
            <Input
              id="preparation_time"
              name="preparation_time"
              type="number"
              className={inputErrorClass(Boolean(fieldMessage(fieldErrors, "preparation_time")))}
              defaultValue={item?.preparation_time ?? ""}
              onChange={() => clearError("preparation_time")}
            />
            <FieldError message={fieldMessage(fieldErrors, "preparation_time")} />
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
              defaultValue={item?.display_order ?? 0}
              onChange={() => clearError("display_order")}
            />
            <FieldError message={fieldMessage(fieldErrors, "display_order")} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Status" description="Availability and featured placement.">
        <div className="grid gap-3 sm:grid-cols-3">
          <ToggleCard label="Available" description="Ready to order" checked={available} onChange={setAvailable} />
          <ToggleCard label="Active" description="Visible on menu" checked={active} onChange={setActive} />
          <ToggleCard label="Featured" description="Show as highlight" checked={featured} onChange={setFeatured} />
        </div>
      </FormSection>

      <FormSection
        title="Customer choices"
        description="Turn on the groups this dish should offer. Create sizes and toppings under Item options."
      >
        {optionGroups.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No option groups yet.{" "}
            <Link href="/admin/options/new" className="text-primary font-medium hover:underline">
              Add drink size, toppings, or spice level
            </Link>
            .
          </p>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              {optionGroups.filter((group) => group.is_active || selectedGroups.includes(group.id)).map((group) => {
                const checked = selectedGroups.includes(group.id);
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition",
                      checked ? "border-primary bg-primary/5" : "border-transparent bg-black/[0.02] hover:border-primary/15",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-md",
                        checked ? "bg-primary text-primary-foreground" : "bg-black/[0.06]",
                      )}
                    >
                      {checked ? <Check className="size-3" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">{group.name}</span>
                      <span className="text-muted-foreground mt-0.5 block text-xs">
                        {group.selection_type === "SINGLE" ? "One choice" : "Several choices"}
                        {group.is_required ? " · Required" : ""}
                      </span>
                      {group.options.length > 0 ? (
                        <span className="text-muted-foreground mt-1 block text-xs">
                          {group.options
                            .map((option) =>
                              settings
                                ? `${option.name} (${formatPriceAdjustment(option.price_adjustment, settings)})`
                                : option.name,
                            )
                            .join(" · ")}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-muted-foreground text-xs">
              Need a new size or topping?{" "}
              <Link href="/admin/options" className="text-primary font-medium hover:underline">
                Manage item options
              </Link>
            </p>
          </>
        )}
      </FormSection>

      <SeoPreview title={seoTitle} description={seoDescription} />

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button type="button" className="btn-admin-outline" onClick={() => router.push(returnTo)}>
          Cancel
        </button>
        <button type="submit" className="btn-admin min-w-40" disabled={pending}>
          <Save className="size-4" />
          {pending ? "Saving…" : "Save dish"}
        </button>
      </div>
    </form>
  );
}
