/**
 * Pure pricing helpers used by the cart (estimates) and by unit tests.
 *
 * The checkout endpoint never trusts these figures. `public.create_order`
 * recomputes every amount from the live catalogue.
 */

export interface PricedOption {
  price_adjustment: number;
}

export interface PricedItem {
  unit_price: number;
  quantity: number;
  options: PricedOption[];
}

export interface DeliveryPolicy {
  default_delivery_fee: number;
  minimum_delivery_order: number;
}

export function lineTotal(item: PricedItem): number {
  const optionsTotal = item.options.reduce((sum, option) => sum + Number(option.price_adjustment), 0);
  const quantity = Math.max(0, Math.floor(item.quantity));
  return roundMoney((Number(item.unit_price) + optionsTotal) * quantity);
}

export function cartSubtotal(items: PricedItem[]): number {
  return roundMoney(items.reduce((sum, item) => sum + lineTotal(item), 0));
}

export function deliveryFee(
  orderType: "PICKUP" | "DELIVERY",
  subtotal: number,
  policy: DeliveryPolicy,
): number {
  if (orderType !== "DELIVERY") return 0;
  return roundMoney(Number(policy.default_delivery_fee) || 0);
}

export function meetsDeliveryMinimum(subtotal: number, policy: DeliveryPolicy): boolean {
  return subtotal >= Number(policy.minimum_delivery_order || 0);
}

export function orderTotal(
  items: PricedItem[],
  orderType: "PICKUP" | "DELIVERY",
  policy: DeliveryPolicy,
  discount = 0,
): { subtotal: number; discount: number; delivery_fee: number; total: number } {
  const subtotal = cartSubtotal(items);
  const safeDiscount = Math.min(Math.max(0, discount), subtotal);
  const fee = deliveryFee(orderType, subtotal, policy);
  return {
    subtotal,
    discount: roundMoney(safeDiscount),
    delivery_fee: fee,
    total: roundMoney(subtotal - safeDiscount + fee),
  };
}

export function effectiveUnitPrice(price: number, discountPrice: number | null | undefined): number {
  if (discountPrice != null && discountPrice > 0 && discountPrice < price) {
    return Number(discountPrice);
  }
  return Number(price);
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
