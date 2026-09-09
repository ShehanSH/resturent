"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { CART_STORAGE_KEY } from "@/lib/constants";
import { cartSubtotal } from "@/lib/orders/pricing";
import type { CartItem, CartState } from "@/lib/cart/types";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "lineId">) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  updateNotes: (lineId: string, notes: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function createLineId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `line-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sameLine(a: CartItem, b: Omit<CartItem, "lineId" | "quantity">): boolean {
  const aOpts = [...a.optionIds].sort().join(",");
  const bOpts = [...b.optionIds].sort().join(",");
  return a.foodItemId === b.foodItemId && aOpts === bOpts && (a.notes ?? "") === (b.notes ?? "");
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartState;
        if (Array.isArray(parsed.items)) setItems(parsed.items);
      }
    } catch {
      // Corrupt storage is ignored; the customer starts with an empty cart.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items } satisfies CartState));
  }, [items, hydrated]);

  const addItem = useCallback((incoming: Omit<CartItem, "lineId">) => {
    setItems((current) => {
      const existing = current.find((item) => sameLine(item, incoming));
      if (existing) {
        return current.map((item) =>
          item.lineId === existing.lineId
            ? { ...item, quantity: Math.min(99, item.quantity + incoming.quantity) }
            : item,
        );
      }
      return [...current, { ...incoming, lineId: createLineId(), quantity: Math.max(1, incoming.quantity) }];
    });
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((current) => {
      if (quantity < 1) return current.filter((item) => item.lineId !== lineId);
      return current.map((item) =>
        item.lineId === lineId ? { ...item, quantity: Math.min(99, Math.floor(quantity)) } : item,
      );
    });
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((current) => current.filter((item) => item.lineId !== lineId));
  }, []);

  const updateNotes = useCallback((lineId: string, notes: string) => {
    setItems((current) =>
      current.map((item) => (item.lineId === lineId ? { ...item, notes: notes.trim() || null } : item)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const priced = items.map((item) => ({
      unit_price: item.unitPrice,
      quantity: item.quantity,
      options: [{ price_adjustment: item.optionsTotal }],
    }));
    return {
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: cartSubtotal(priced),
      addItem,
      updateQuantity,
      removeItem,
      updateNotes,
      clear,
    };
  }, [items, addItem, updateQuantity, removeItem, updateNotes, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
