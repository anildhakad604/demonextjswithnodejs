"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "./api";

export type CartItem = {
  productId: string;
  size: string | null;
  name: string;
  price: string;
  image: string;
  stock: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number, size?: string) => void;
  removeItem: (productId: string, size?: string | null) => void;
  setQuantity: (productId: string, quantity: number, size?: string | null) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "cart";

function sameLine(item: CartItem, productId: string, size: string | null) {
  return item.productId === productId && (item.size || null) === (size || null);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const valid = Array.isArray(stored)
        ? stored.filter(
            (item): item is CartItem =>
              item && typeof item.productId === "string" && item.productId.length > 0
          )
        : [];
      setItems(valid);
    } catch {
      setItems([]);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((product: Product, quantity = 1, size?: string) => {
    const effectiveSize = size || null;
    const stockCap =
      product.sizes.length > 0
        ? product.sizes.find((s) => s.size === effectiveSize)?.stock ?? 0
        : product.stock;

    setItems((prev) => {
      const existing = prev.find((item) => sameLine(item, product.id, effectiveSize));
      if (existing) {
        return prev.map((item) =>
          sameLine(item, product.id, effectiveSize)
            ? { ...item, quantity: Math.min(item.quantity + quantity, stockCap) }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          size: effectiveSize,
          name: product.name,
          price: product.price,
          image: product.image,
          stock: stockCap,
          quantity,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId: string, size?: string | null) => {
    setItems((prev) => prev.filter((item) => !sameLine(item, productId, size || null)));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number, size?: string | null) => {
    setItems((prev) =>
      prev.map((item) =>
        sameLine(item, productId, size || null) ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, count, subtotal, addItem, removeItem, setQuantity, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
