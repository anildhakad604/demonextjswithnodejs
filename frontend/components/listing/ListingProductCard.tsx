import Image from "next/image";
import Link from "next/link";
import { getProductUrl, resolveImage, type Product } from "@/lib/api";

export default function ListingProductCard({ product }: { product: Product }) {
  const discount = product.actualPrice
    ? Math.round(100 - (Number(product.price) * 100) / Number(product.actualPrice))
    : 0;

  return (
    <Link href={getProductUrl(product)} className="listing-card">
      <div className="card-media">
        {discount > 0 && <span className="off-badge">-{discount}%</span>}
        <Image src={resolveImage(product.image)} alt={product.name} width={300} height={375} />
      </div>
      <div className="card-body">
        <p className="card-title">{product.name}</p>
        <div className="price-row">
          <span className="current-price">₹{Number(product.price).toFixed(0)}</span>
          {product.actualPrice && <span className="old-price">₹{Number(product.actualPrice).toFixed(0)}</span>}
        </div>
        {product.isFastDelivery && (
          <span className="fast-delivery-badge">
            <i className="bi bi-truck" /> Fast Delivery
          </span>
        )}
      </div>
    </Link>
  );
}
