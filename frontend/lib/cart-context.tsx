"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "./api";
import * as api from "./api";
import { useAuth } from "./auth-context";

export type CartItem = {
  id?: string; // present once backed by the server cart; absent for guest/localStorage lines
  productId: string;
  size: string | null;
  name: string;
  price: string;
  actualPrice?: string | null;
  image: string;
  stock: number;
  quantity: number;
  availableSizes?: string[];
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  loading: boolean;
  addItem: (product: Product, quantity?: number, size?: string) => void;
  removeItem: (productId: string, size?: string | null) => void;
  setQuantity: (productId: string, quantity: number, size?: string | null) => void;
  setSize: (productId: string, currentSize: string | null, nextSize: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "cart";

function sameLine(item: CartItem, productId: string, size: string | null) {
  return item.productId === productId && (item.size || null) === (size || null);
}

function readLocalCart(): CartItem[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored)
      ? stored.filter(
          (item): item is CartItem => item && typeof item.productId === "string" && item.productId.length > 0
        )
      : [];
  } catch {
    return [];
  }
}

function fromServerCart(cart: api.ServerCart): CartItem[] {
  return cart.items.map((i) => ({
    id: i.id,
    productId: i.productId,
    size: i.size,
    name: i.name,
    price: i.price,
    actualPrice: i.actualPrice,
    image: i.image,
    stock: i.stock,
    quantity: i.quantity,
    availableSizes: i.availableSizes,
  }));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const mergedForUser = useRef<string | null>(null);

  // Guest state: load/persist to localStorage.
  useEffect(() => {
    if (user) return;
    setItems(readLocalCart());
    setHydrated(true);
  }, [user]);

  useEffect(() => {
    if (!hydrated || user) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated, user]);

  // Logged-in state: merge any guest cart into the server cart once, then
  // treat the server cart as the source of truth from then on.
  useEffect(() => {
    if (authLoading || !user) return;
    if (mergedForUser.current === user.id) return;
    mergedForUser.current = user.id;

    setLoading(true);
    (async () => {
      const guestItems = readLocalCart();
      for (const item of guestItems) {
        await api
          .addCartItem({ productId: item.productId, size: item.size || undefined, quantity: item.quantity })
          .catch(() => undefined);
      }
      if (guestItems.length > 0) localStorage.removeItem(STORAGE_KEY);
      const cart = await api.getCart().catch(() => null);
      if (cart) setItems(fromServerCart(cart));
      setLoading(false);
    })();
  }, [user, authLoading]);

  function findServerItemId(productId: string, size: string | null): string | undefined {
    return items.find((i) => sameLine(i, productId, size))?.id;
  }

  const addItem = useCallback(
    (product: Product, quantity = 1, size?: string) => {
      const effectiveSize = size || null;

      if (!user) {
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
        return;
      }

      setLoading(true);
      api
        .addCartItem({ productId: product.id, size: effectiveSize || undefined, quantity })
        .then((cart) => setItems(fromServerCart(cart)))
        .finally(() => setLoading(false));
    },
    [user]
  );

  const removeItem = useCallback(
    (productId: string, size?: string | null) => {
      const effectiveSize = size || null;
      if (!user) {
        setItems((prev) => prev.filter((item) => !sameLine(item, productId, effectiveSize)));
        return;
      }
      const itemId = findServerItemId(productId, effectiveSize);
      if (!itemId) return;
      setLoading(true);
      api
        .removeCartItem(itemId)
        .then((cart) => setItems(fromServerCart(cart)))
        .finally(() => setLoading(false));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, items]
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number, size?: string | null) => {
      const effectiveSize = size || null;
      if (!user) {
        setItems((prev) =>
          prev.map((item) =>
            sameLine(item, productId, effectiveSize) ? { ...item, quantity: Math.max(1, quantity) } : item
          )
        );
        return;
      }
      const itemId = findServerItemId(productId, effectiveSize);
      if (!itemId) return;
      setLoading(true);
      api
        .updateCartItem(itemId, { quantity: Math.max(1, quantity) })
        .then((cart) => setItems(fromServerCart(cart)))
        .finally(() => setLoading(false));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, items]
  );

  const setSize = useCallback(
    (productId: string, currentSize: string | null, nextSize: string) => {
      if (!user) {
        setItems((prev) =>
          prev.map((item) => (sameLine(item, productId, currentSize) ? { ...item, size: nextSize } : item))
        );
        return;
      }
      const itemId = findServerItemId(productId, currentSize);
      if (!itemId) return;
      setLoading(true);
      api
        .updateCartItem(itemId, { size: nextSize })
        .then((cart) => setItems(fromServerCart(cart)))
        .finally(() => setLoading(false));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, items]
  );

  const clear = useCallback(() => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    api
      .clearCart()
      .then((cart) => setItems(fromServerCart(cart)))
      .finally(() => setLoading(false));
  }, [user]);

  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, count, subtotal, loading, addItem, removeItem, setQuantity, setSize, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
