"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { getCategories, getProducts, type Category, type Product } from "@/lib/api";

function ProductsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const page = Number(searchParams.get("page") || "1");

  const [searchInput, setSearchInput] = useState(search);

  // Always holds the latest URL params so the debounced search callback
  // below reads fresh state at fire-time instead of a stale render-time
  // snapshot (otherwise a delayed search-clear can clobber a category
  // filter picked in the meantime).
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  useEffect(() => {
    getCategories().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    getProducts({ search: search || undefined, category: category || undefined, page, limit: 12 })
      .then((res) => {
        setProducts(res.items);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [search, category, page]);

  function updateParams(next: { search?: string; category?: string; page?: number }) {
    const params = new URLSearchParams(searchParamsRef.current.toString());
    if (next.search !== undefined) {
      if (next.search) params.set("search", next.search);
      else params.delete("search");
    }
    if (next.category !== undefined) {
      if (next.category) params.set("category", next.category);
      else params.delete("category");
    }
    params.set("page", String(next.page ?? 1));
    router.push(`/products?${params.toString()}`);
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      const currentSearch = searchParamsRef.current.get("search") || "";
      if (searchInput !== currentSearch) updateParams({ search: searchInput, page: 1 });
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <main className="container section">
      <h1>All Products</h1>

      <div className="form-row" style={{ maxWidth: 640, marginBottom: 28 }}>
        <div className="field">
          <label>Search</label>
          <input
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={category} onChange={(e) => updateParams({ category: e.target.value, page: 1 })}>
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="skeleton-card" key={i}>
              <div className="skeleton skeleton-img" />
              <div className="skeleton skeleton-line short" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line price" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="muted">No products match your search.</p>
      ) : (
        <>
          <div className="grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 28 }}>
              <button
                className="button button-secondary button-sm"
                disabled={page <= 1}
                onClick={() => updateParams({ page: page - 1 })}
              >
                Previous
              </button>
              <span className="muted">Page {page} of {totalPages}</span>
              <button
                className="button button-secondary button-sm"
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: page + 1 })}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<main className="container section">Loading...</main>}>
      <ProductsPageInner />
    </Suspense>
  );
}
