"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ListingProductCard from "@/components/listing/ListingProductCard";
import {
  getCategories,
  getProductFilters,
  getProducts,
  type Category,
  type Product,
  type ProductFilters,
  type ProductSort,
} from "@/lib/api";

const SORT_LABELS: Record<ProductSort, string> = {
  popular: "POPULAR",
  new: "WHAT'S NEW",
  discount: "DISCOUNT",
  priceLow: "PRICE: LOW TO HIGH",
  priceHigh: "PRICE: HIGH TO LOW",
};

function ListingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ slug?: string[] }>();

  const slug = params.slug ?? [];
  const category = slug[0] || "";
  const subCategory = slug[1] || "";

  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page") || "1");
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<ProductFilters | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceBracket, setPriceBracket] = useState<number | null>(null);
  const [sort, setSort] = useState<ProductSort>("popular");

  const [gridCols, setGridCols] = useState(2);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    const stored = Number(localStorage.getItem("gridView") || "2");
    if (stored >= 1 && stored <= 4) setGridCols(stored);
  }, []);

  function setGrid(cols: number) {
    setGridCols(cols);
    localStorage.setItem("gridView", String(cols));
  }

  // Reset filter selections when navigating to a different category.
  useEffect(() => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceBracket(null);
  }, [category, subCategory]);

  useEffect(() => {
    getProductFilters(category || undefined)
      .then(setFilters)
      .catch(() => setFilters(null));
  }, [category]);

  const priceBrackets = useMemo(() => {
    if (!filters) return [];
    const min = Number(filters.priceRange.min) || 0;
    const max = Number(filters.priceRange.max) || 0;
    if (max <= min) return [];
    const step = (max - min) / 4;
    const q1 = Math.round(min + step);
    const q2 = Math.round(min + step * 2);
    const q3 = Math.round(min + step * 3);
    return [
      { label: `Under ₹${q1}`, min: undefined as number | undefined, max: q1 },
      { label: `₹${q1} - ₹${q2}`, min: q1, max: q2 },
      { label: `₹${q2} - ₹${q3}`, min: q2, max: q3 },
      { label: `Above ₹${q3}`, min: q3, max: undefined as number | undefined },
    ];
  }, [filters]);

  useEffect(() => {
    setLoading(true);
    const bracket = priceBracket !== null ? priceBrackets[priceBracket] : undefined;
    getProducts({
      category: category || undefined,
      subCategory: subCategory || undefined,
      search: search || undefined,
      size: selectedSizes[0] || undefined,
      color: selectedColors[0] || undefined,
      minPrice: bracket?.min,
      maxPrice: bracket?.max,
      sort,
      page,
      limit: 12,
    })
      .then((res) => {
        setProducts(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, subCategory, search, selectedSizes, selectedColors, priceBracket, sort, page]);

  function basePath() {
    return `/listing${category ? `/${category}${subCategory ? `/${subCategory}` : ""}` : ""}`;
  }

  function goToPage(nextPage: number) {
    const qs = new URLSearchParams(searchParamsRef.current.toString());
    qs.set("page", String(nextPage));
    router.push(`${basePath()}?${qs.toString()}`);
  }

  function toggleSize(size: string) {
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  }

  function toggleColor(color: string) {
    setSelectedColors((prev) => (prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]));
  }

  function goToSubCategory(nextSlug: string | null) {
    setFilterOpen(false);
    const qs = searchParamsRef.current.toString();
    const path = nextSlug ? `/listing/${category}/${nextSlug}` : `/listing/${category}`;
    router.push(qs ? `${path}?${qs}` : path);
  }

  const activeCategory = categories.find((c) => c.slug === category);
  const activeSubCategory = filters?.subCategories.find((s) => s.slug === subCategory);

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...selectedSizes.map((s) => ({ key: `size-${s}`, label: `Size: ${s}`, onRemove: () => toggleSize(s) })),
    ...selectedColors.map((c) => ({ key: `color-${c}`, label: `Color: ${c}`, onRemove: () => toggleColor(c) })),
    ...(priceBracket !== null
      ? [{ key: "price", label: priceBrackets[priceBracket]?.label ?? "Price", onRemove: () => setPriceBracket(null) }]
      : []),
  ];

  return (
    <main className="listing-page">
      <div className="breadcrumb-section">
        <div className="main-container">
          <ul className="breadcrumbs">
            <li><a href="/">Home</a></li>
            {activeCategory && <li>{activeSubCategory ? <a href={`/listing/${category}`}>{activeCategory.name}</a> : <strong>{activeCategory.name}</strong>}</li>}
            {activeSubCategory && <li><strong>{activeSubCategory.name}</strong></li>}
          </ul>
          <ul className="grid-switcher">
            {[2, 3, 4].map((n) => (
              <li key={n} className={gridCols === n ? "active" : ""} onClick={() => setGrid(n)}>
                <i className="bi bi-grid-fill" /> {n}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="listing-shell main-container">
        <button className="filter-btn mobile-bottom-tab" onClick={() => setFilterOpen(true)}>
          <i className="bi bi-sliders" /> FILTER
        </button>

        <aside className={`filter-panel ${filterOpen ? "active" : ""}`}>
          <div className="filter-title">
            Filters
            <button className="close-filter" onClick={() => setFilterOpen(false)}>&times;</button>
          </div>
          <hr className="hr" />

          {category && filters && filters.subCategories.length > 0 && (
            <div className="filter-section">
              <h6 className="filter-heading">Category</h6>
              <div className="filter-list">
                <label className="filter-item">
                  <input type="radio" checked={!subCategory} onChange={() => goToSubCategory(null)} />
                  <span className="custom-checkbox" />
                  <span className="label-text">All</span>
                </label>
                {filters.subCategories.map((sub) => (
                  <label className="filter-item" key={sub.id}>
                    <input
                      type="radio"
                      checked={subCategory === sub.slug}
                      onChange={() => goToSubCategory(sub.slug)}
                    />
                    <span className="custom-checkbox" />
                    <span className="label-text">{sub.name}</span>
                  </label>
                ))}
              </div>
              <hr className="hr" />
            </div>
          )}

          {filters && filters.colors.length > 0 && (
            <div className="filter-section">
              <h6 className="filter-heading">Colour</h6>
              <div className="color-swatches">
                {filters.colors.map((c) => (
                  <button
                    key={c.name}
                    className={`color-swatch ${selectedColors.includes(c.name || "") ? "active" : ""}`}
                    style={{ background: c.hex || "#ccc" }}
                    title={c.name || ""}
                    onClick={() => c.name && toggleColor(c.name)}
                  />
                ))}
              </div>
              <hr className="hr" />
            </div>
          )}

          {filters && filters.sizes.length > 0 && (
            <div className="filter-section">
              <h6 className="filter-heading">Size</h6>
              <div className="filter-grid">
                {filters.sizes.map((size) => (
                  <label className={`size-item ${selectedSizes.includes(size) ? "active" : ""}`} key={size}>
                    <input type="checkbox" checked={selectedSizes.includes(size)} onChange={() => toggleSize(size)} />
                    {size}
                  </label>
                ))}
              </div>
              <hr className="hr" />
            </div>
          )}

          {priceBrackets.length > 0 && (
            <div className="filter-section">
              <h6 className="filter-heading">Price</h6>
              <div className="filter-list">
                {priceBrackets.map((b, i) => (
                  <label className="filter-item" key={b.label}>
                    <input
                      type="radio"
                      checked={priceBracket === i}
                      onChange={() => setPriceBracket(priceBracket === i ? null : i)}
                    />
                    <span className="custom-checkbox" />
                    <span className="label-text">{b.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </aside>

        <section className="products-area">
          <div className="product-toolbar">
            <span className="product-count">{total} Products Found</span>
            <div className={`sort-dropdown ${sortOpen ? "open" : ""}`}>
              <button className="sort-toggle" onClick={() => setSortOpen((v) => !v)}>
                {SORT_LABELS[sort]} <span className="sort-caret">▾</span>
              </button>
              {sortOpen && (
                <ul className="sort-menu">
                  {(Object.keys(SORT_LABELS) as ProductSort[]).map((key) => (
                    <li key={key}>
                      <button
                        className={`sort-option ${sort === key ? "active" : ""}`}
                        onClick={() => {
                          setSort(key);
                          setSortOpen(false);
                        }}
                      >
                        {SORT_LABELS[key]}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="active-filter-chips">
              {activeChips.map((chip) => (
                <button key={chip.key} className="filter-chip" onClick={chip.onRemove}>
                  {chip.label} <span className="filter-chip-remove">&times;</span>
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className={`products-grid grid-${gridCols}`}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div className="skeleton-card" key={i}>
                  <div className="skeleton skeleton-img" />
                  <div className="skeleton skeleton-line short" />
                  <div className="skeleton skeleton-line price" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="muted">No products match your filters.</p>
          ) : (
            <>
              <div className={`products-grid grid-${gridCols}`}>
                {products.map((product) => (
                  <ListingProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="listing-pagination">
                  <button className="button button-secondary button-sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                    Previous
                  </button>
                  <span className="muted">Page {page} of {totalPages}</span>
                  <button className="button button-secondary button-sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {filterOpen && <div className="filter-overlay active" onClick={() => setFilterOpen(false)} />}
    </main>
  );
}

export default function ListingPage() {
  return (
    <Suspense fallback={<main className="container section">Loading...</main>}>
      <ListingPageInner />
    </Suspense>
  );
}
