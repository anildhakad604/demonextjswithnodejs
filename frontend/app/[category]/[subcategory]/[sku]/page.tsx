import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import ColorChips from "@/components/ColorChips";
import ListingProductCard from "@/components/listing/ListingProductCard";
import OfferCard from "@/components/OfferCard";
import PriceTag from "@/components/PriceTag";
import ProductAccordion from "@/components/ProductAccordion";
import ProductContentBlocks from "@/components/ProductContentBlocks";
import ProductGallery from "@/components/ProductGallery";
import ProductReviews from "@/components/ProductReviews";
import { ApiRequestError, getProduct, getProductUrl, getProducts } from "@/lib/api";

type Params = { category: string; subcategory: string; sku: string };

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { category, sku } = await params;

  const product = await getProduct(sku).catch((err) => {
    if (err instanceof ApiRequestError && err.status === 404) return null;
    throw err;
  });
  if (!product || product.category.slug !== category) notFound();

  const canonical = getProductUrl(product);
  const { subcategory } = await params;
  if (`/${category}/${subcategory}/${sku}` !== canonical) redirect(canonical);

  const discount = product.actualPrice
    ? Math.round(100 - (Number(product.price) * 100) / Number(product.actualPrice))
    : 0;

  const related = await getProducts({ category: product.category.slug, limit: 8 }).catch(() => ({ items: [] }));
  const relatedProducts = related.items.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <>
      <div className="breadcrumb-section pdp-breadcrumb">
        <div className="main-container">
          <ul className="breadcrumbs">
            <li><Link href="/">Home</Link></li>
            <li><Link href={`/listing/${product.category.slug}`}>{product.category.name}</Link></li>
            {product.subCategory && (
              <li><Link href={`/listing/${product.category.slug}/${product.subCategory.slug}`}>{product.subCategory.name}</Link></li>
            )}
            <li><strong>{product.name}</strong></li>
          </ul>
        </div>
      </div>

      <main className="main-container product-main">
        <div className="product-single-left">
          <ProductGallery productId={product.id} cover={product.image} images={product.images} alt={product.name} />
        </div>

        <div className="product-single-right">
          <h1 className="product-title">{product.name}</h1>

          <div className="price-row">
            <span className="current-price"><PriceTag value={product.price} /></span>
            {product.actualPrice && (
              <>
                <span className="old-price"><PriceTag value={product.actualPrice} /></span>
                {discount > 0 && <span className="discount">(-{discount}% Off)</span>}
              </>
            )}
          </div>
          <p className="tax-note">Inclusive of all taxes</p>

          {product.colorVariants && product.colorVariants.length > 1 && (
            <ColorChips product={product} variants={product.colorVariants} />
          )}

          <AddToCartButton product={product} />

          <OfferCard />

          <ProductAccordion description={product.description} />
        </div>
      </main>

      <ProductContentBlocks blocks={product.contentBlocks ?? []} />

      {relatedProducts.length > 0 && (
        <section className="main-container py-section you-may-also-like">
          <h3 className="product-section-heading text-center">You May Also Like</h3>
          <div className="products-grid grid-4">
            {relatedProducts.map((p) => (
              <ListingProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <div className="main-container">
        <ProductReviews productId={product.id} />
      </div>
    </>
  );
}
