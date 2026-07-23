import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/lib/api";

export default async function Home() {
  const { items: products } = await getProducts({ limit: 8 });
  return (
    <main>
      <section className="hero">
        <div className="container">
          <h1>Modern essentials for everyday living.</h1>
          <p>Discover curated products with a fast, clean shopping experience powered by Next.js and Node.js.</p>
          <a className="button" href="#products">Shop Now</a>
        </div>
      </section>
      <section id="products" className="section">
        <div className="container">
          <h2>Featured Products</h2>
          {products.length === 0 ? (
            <p className="muted">No products available yet.</p>
          ) : (
            <>
              <div className="grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: 32 }}>
                <Link className="button button-secondary" href="/products">View All Products</Link>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
