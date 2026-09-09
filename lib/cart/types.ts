export interface CartItem {
  /** Stable id for this cart line, independent of the food item. */
  lineId: string;
  foodItemId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  optionIds: string[];
  optionLabels: string[];
  optionsTotal: number;
  notes: string | null;
}

export interface CartState {
  items: CartItem[];
}
