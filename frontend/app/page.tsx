import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { getProducts, resolveImage } from "@/lib/api";

export default async function Home() {
  const { items: products } = await getProducts({ limit: 8 });
  const heroProduct = products[0];

  return (
    <main>
      <section className="hero">
        <div className="container hero-inner">
          <Reveal>
            <span className="eyebrow">New Season</span>
            <h1>Modern essentials for everyday living.</h1>
            <p>Discover curated products with a fast, clean shopping experience powered by Next.js and Node.js.</p>
            <a className="button" href="#products">Shop Now</a>

            <div className="trust-row">
              <span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="6" width="14" height="11" rx="1.5" />
                  <path d="M15 10h4l3 3v4h-7z" />
                  <circle cx="6" cy="19" r="2" />
                  <circle cx="17.5" cy="19" r="2" />
                </svg>
                Free shipping over &#8377;1,999
              </span>
              <span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />
                </svg>
                Secure payments
              </span>
              <span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 3-6.7" />
                  <path d="M3 4v5h5" />
                </svg>
                Easy 7-day returns
              </span>
            </div>
          </Reveal>

          {heroProduct && (
            <div className="hero-visual">
              <div className="frame">
                <img src={resolveImage(heroProduct.image)} alt="" />
              </div>
            </div>
          )}
        </div>
      </section>
      <section id="products" className="section">
        <div className="container">
          <Reveal><h2>Featured Products</h2></Reveal>
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
