import AddToCartButton from "@/components/AddToCartButton";
import { getProduct, resolveImage } from "@/lib/api";
import { formatINR } from "@/lib/format";
import Image from "next/image";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  return (
    <main className="container product-page">
      <Image src={resolveImage(product.image)} alt={product.name} width={900} height={900} />
      <div>
        <small>{product.category?.name}</small>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <div className="price">{formatINR(product.price)}</div>
        {product.sizes.length === 0 && (
          <p>{product.stock > 0 ? `${product.stock} items in stock` : "Out of stock"}</p>
        )}
        <AddToCartButton product={product} />
      </div>
    </main>
  );
}
