import AddToCartButton from "@/components/AddToCartButton";
import PriceTag from "@/components/PriceTag";
import ProductGallery from "@/components/ProductGallery";
import ProductReviews from "@/components/ProductReviews";
import { getProduct } from "@/lib/api";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  return (
    <>
      <main className="container product-page">
        <ProductGallery productId={product.id} cover={product.image} images={product.images} alt={product.name} />
        <div>
          <small>{product.category?.name}</small>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="price"><PriceTag value={product.price} /></div>
          {product.sizes.length === 0 && (
            <p>{product.stock > 0 ? `${product.stock} items in stock` : "Out of stock"}</p>
          )}
          <AddToCartButton product={product} />
        </div>
      </main>
      <div className="container">
        <ProductReviews productId={product.id} />
      </div>
    </>
  );
}
