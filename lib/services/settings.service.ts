import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RestaurantSettingsRow } from "@/types/database";

export { canAcceptOrders, dayName, getOpeningState, type OpeningState } from "@/lib/opening";

/**
 * Restaurant settings are read by nearly every page (currency, name, hours), so
 * the lookup is deduplicated per request with React `cache()`.
 */
export const getRestaurantSettings = cache(async (): Promise<RestaurantSettingsRow> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("restaurant_settings").select("*").limit(1).maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error(
      "No restaurant_settings row was found. Run the database migrations before starting the app.",
    );
  }

  return data;
});
