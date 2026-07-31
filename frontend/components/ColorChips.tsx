import Link from "next/link";
import type { ColorVariant, Product } from "@/lib/api";

export default function ColorChips({ product, variants }: { product: Product; variants: ColorVariant[] }) {
  if (variants.length === 0) return null;
  const subSlug = product.subCategory?.slug ?? "all";

  return (
    <div className="product-options-color">
      <span className="section-label">Colour</span>
      <div className="color-chip-row">
        {variants.map((v) => (
          <Link
            key={v.id}
            href={`/${product.category.slug}/${subSlug}/${v.skuCode}`}
            className={`color-chip ${v.id === product.id ? "active" : ""}`}
            style={{ background: v.colorSwatchHex || "#ccc" }}
            title={v.colorName || ""}
          />
        ))}
      </div>
    </div>
  );
}
