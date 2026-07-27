"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./auth-context";
import * as api from "./api";
import type { WishlistItem } from "./api";

type WishlistContextValue = {
  items: WishlistItem[];
  loading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    api
      .getWishlist()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user]);

  const productIds = useMemo(() => new Set(items.map((i) => i.productId)), [items]);
  const isWishlisted = useCallback((productId: string) => productIds.has(productId), [productIds]);

  const toggle = useCallback(
    async (productId: string) => {
      if (!user) return;
      if (productIds.has(productId)) {
        setItems((prev) => prev.filter((i) => i.productId !== productId));
        await api.removeFromWishlist(productId).catch(() => undefined);
      } else {
        const optimistic = { id: `temp-${productId}`, productId, createdAt: new Date().toISOString() } as WishlistItem;
        setItems((prev) => [...prev, optimistic]);
        try {
          const saved = await api.addToWishlist(productId);
          setItems((prev) => prev.map((i) => (i.id === optimistic.id ? saved : i)));
        } catch {
          setItems((prev) => prev.filter((i) => i.id !== optimistic.id));
        }
      }
    },
    [user, productIds]
  );

  return (
    <WishlistContext.Provider value={{ items, loading, isWishlisted, toggle }}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
