import { createSupabaseServerClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";
import { isUuid } from "@/lib/validations/common";
import type {
  CategoryRow,
  FoodItemRow,
  OptionGroupRow,
  OptionRow,
} from "@/types/database";

/**
 * Catalogue reads.
 *
 * Every query here runs through the session-scoped client, so Row Level
 * Security decides what is visible: anonymous visitors receive only active
 * categories and available dishes, while staff see everything.
 */

export interface OptionGroupWithOptions extends OptionGroupRow {
  options: OptionRow[];
}

export interface FoodItemWithCategory extends FoodItemRow {
  category: Pick<CategoryRow, "id" | "name" | "slug"> | null;
  /** True when the dish has at least one option group (size, spice, extras). */
  hasOptions: boolean;
}

export interface FoodItemDetail extends FoodItemWithCategory {
  option_groups: OptionGroupWithOptions[];
}

export async function listPublicCategories(): Promise<CategoryRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCategoryForAdmin(slugOrId: string): Promise<CategoryRow | null> {
  const supabase = await createSupabaseServerClient();
  const column = isUuid(slugOrId) ? "id" : "slug";
  const { data, error } = await supabase.from("categories").select("*").eq(column, slugOrId).maybeSingle();
  if (error) throw error;
  return data;
}

export interface MenuQuery {
  categorySlug?: string;
  search?: string;
  sort?: "popular" | "price-asc" | "price-desc" | "name";
  featuredOnly?: boolean;
  limit?: number;
}

/**
 * The menu listing. Filtering and sorting happen in Postgres rather than in the
 * browser so large menus stay fast and the payload stays small.
 */
export async function listMenuItems(query: MenuQuery = {}): Promise<FoodItemWithCategory[]> {
  const supabase = await createSupabaseServerClient();

  let builder = supabase
    .from("food_items")
    .select("*, category:categories!inner(id, name, slug, is_active), food_item_option_groups(id)")
    .eq("is_active", true)
    .eq("category.is_active", true);

  if (query.categorySlug) {
    builder = builder.eq("categories.slug", query.categorySlug);
  }

  if (query.featuredOnly) {
    builder = builder.eq("is_featured", true);
  }

  if (query.search) {
    // Escape PostgREST's `or` delimiters before interpolating user input.
    const term = query.search.replace(/[(),*]/g, " ").trim();
    if (term) {
      builder = builder.or(
        `name.ilike.%${term}%,short_description.ilike.%${term}%,description.ilike.%${term}%`,
      );
    }
  }

  switch (query.sort) {
    case "price-asc":
      builder = builder.order("price", { ascending: true });
      break;
    case "price-desc":
      builder = builder.order("price", { ascending: false });
      break;
    case "name":
      builder = builder.order("name", { ascending: true });
      break;
    default:
      builder = builder
        .order("is_featured", { ascending: false })
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });
  }

  if (query.limit) builder = builder.limit(query.limit);

  const { data, error } = await builder;
  if (error) throw error;

  return (data ?? []).map((row) => {
    const { food_item_option_groups, ...item } = row as unknown as FoodItemRow & {
      category: Pick<CategoryRow, "id" | "name" | "slug"> | null;
      food_item_option_groups?: { id: string }[] | null;
    };
    return {
      ...item,
      hasOptions: (food_item_option_groups?.length ?? 0) > 0,
    };
  });
}

export async function getFoodItemBySlug(slug: string): Promise<FoodItemDetail | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("food_items")
    .select(
      `*,
       category:categories(id, name, slug),
       food_item_option_groups(
         display_order,
         option_group:option_groups(
           *,
           options(*)
         )
       )`,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const raw = data as unknown as FoodItemRow & {
    category: Pick<CategoryRow, "id" | "name" | "slug"> | null;
    food_item_option_groups: {
      display_order: number;
      option_group: (OptionGroupRow & { options: OptionRow[] }) | null;
    }[];
  };

  const optionGroups = (raw.food_item_option_groups ?? [])
    .filter((link) => link.option_group?.is_active)
    .sort((a, b) => a.display_order - b.display_order)
    .map((link) => {
      const group = link.option_group!;
      return {
        ...group,
        options: [...(group.options ?? [])]
          .filter((option) => option.is_available)
          .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name)),
      };
    })
    .filter((group) => group.options.length > 0);

  return {
    ...raw,
    category: raw.category,
    option_groups: optionGroups,
    hasOptions: optionGroups.length > 0,
  };
}

/** Slugs for `generateStaticParams` and the sitemap. */
export async function listPublicSlugs(): Promise<{
  categories: { slug: string; updated_at: string }[];
  foodItems: { slug: string; updated_at: string }[];
}> {
  const supabase = await createSupabaseServerClient();

  const [categories, foodItems] = await Promise.all([
    supabase.from("categories").select("slug, updated_at").eq("is_active", true),
    supabase.from("food_items").select("slug, updated_at").eq("is_active", true),
  ]);

  return {
    categories: categories.data ?? [],
    foodItems: foodItems.data ?? [],
  };
}

// ---------------------------------------------------------------------------
// Admin reads (RLS still applies; these simply do not filter to active rows)
// ---------------------------------------------------------------------------

export interface AdminCategory extends CategoryRow {
  food_count: number;
}

export async function listCategoriesForAdmin(): Promise<AdminCategory[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*, food_items(count)")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const { food_items, ...category } = row as CategoryRow & {
      food_items: { count: number }[] | null;
    };
    return { ...category, food_count: food_items?.[0]?.count ?? 0 };
  });
}

export interface AdminFoodItemQuery {
  search?: string;
  categoryId?: string;
  availability?: "available" | "unavailable";
  featured?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listFoodItemsForAdmin(query: AdminFoodItemQuery = {}): Promise<{
  items: FoodItemWithCategory[];
  total: number;
}> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? 20;
  const from = (page - 1) * pageSize;

  let builder = supabase
    .from("food_items")
    .select("*, category:categories(id, name, slug)", { count: "exact" });

  if (query.search) {
    const term = query.search.replace(/[(),*]/g, " ").trim();
    if (term) builder = builder.ilike("name", `%${term}%`);
  }
  if (query.categoryId) builder = builder.eq("category_id", query.categoryId);
  if (query.availability) builder = builder.eq("is_available", query.availability === "available");
  if (query.featured !== undefined) builder = builder.eq("is_featured", query.featured);

  const { data, error, count } = await builder
    .order("display_order", { ascending: true })
    .order("name", { ascending: true })
    .range(from, from + pageSize - 1);

  if (error) throw error;

  return {
    items: (data ?? []).map((row) => ({
      ...(row as FoodItemWithCategory),
      hasOptions: false,
    })),
    total: count ?? 0,
  };
}

export async function getFoodItemForAdmin(slugOrId: string): Promise<
  (FoodItemRow & { option_group_ids: string[] }) | null
> {
  const supabase = await createSupabaseServerClient();
  const column = isUuid(slugOrId) ? "id" : "slug";

  const { data, error } = await supabase
    .from("food_items")
    .select("*, food_item_option_groups(option_group_id)")
    .eq(column, slugOrId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { food_item_option_groups, ...item } = data as FoodItemRow & {
    food_item_option_groups: { option_group_id: string }[] | null;
  };

  return {
    ...item,
    option_group_ids: (food_item_option_groups ?? []).map((link) => link.option_group_id),
  };
}

export async function listOptionGroups(): Promise<OptionGroupWithOptions[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("option_groups")
    .select("*, options(*)")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((group) => ({
    ...(group as OptionGroupRow & { options: OptionRow[] }),
    options: [...((group as { options: OptionRow[] }).options ?? [])].sort(
      (a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name),
    ),
  }));
}

export async function getOptionGroupForAdmin(slugOrId: string): Promise<OptionGroupWithOptions | null> {
  const groups = await listOptionGroups();
  if (isUuid(slugOrId)) {
    return groups.find((group) => group.id === slugOrId) ?? null;
  }
  return groups.find((group) => slugify(group.name) === slugOrId) ?? null;
}
