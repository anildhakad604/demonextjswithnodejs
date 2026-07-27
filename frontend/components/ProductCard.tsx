import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/api";
import { resolveImage } from "@/lib/api";
import { formatINR } from "@/lib/format";
import WishlistButton from "@/components/WishlistButton";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="card" style={{ position: "relative" }}>
      <WishlistButton productId={product.id} className="wishlist-btn-card" />
      <Image src={resolveImage(product.image)} alt={product.name} width={600} height={600} />
      <div className="card-body">
        <small>{product.category?.name}</small>
        <h3>{product.name}</h3>
        <div className="price">{formatINR(product.price)}</div>
        <Link className="button" href={`/products/${product.slug}`}>View Product</Link>
      </div>
    </article>
  );
}