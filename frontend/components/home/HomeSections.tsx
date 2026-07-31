"use client";

import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import Carousel from "@/components/home/Carousel";
import { getProductUrl, resolveImage, type Banner, type Category, type Product } from "@/lib/api";

function matchCategorySlug(categories: Category[], title: string | null): string | null {
  if (!title) return null;
  const lower = title.toLowerCase();
  const match = categories.find((c) => lower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(lower));
  return match?.slug ?? null;
}

function FlashSaleCard({ product }: { product: Product }) {
  const discount = product.actualPrice
    ? Math.round(100 - (Number(product.price) * 100) / Number(product.actualPrice))
    : 0;
  return (
    <Link href={getProductUrl(product)} className="product-card flash-sale-card">
      <div className="product-img-wrap">
        {discount > 0 && <div className="flash-sale-discount-badge">-{discount}%</div>}
        <Image src={resolveImage(product.image)} alt={product.name} width={280} height={280} />
      </div>
      <div className="card-body">
        <h6 className="card-title">{product.name}</h6>
        <div className="current-price">₹{Number(product.price).toFixed(0)}</div>
      </div>
    </Link>
  );
}

function NewArrivalCard({ product }: { product: Product }) {
  const discount = product.actualPrice
    ? Math.round(100 - (Number(product.price) * 100) / Number(product.actualPrice))
    : 0;
  return (
    <Link href={getProductUrl(product)} className="product-card">
      <div className="product-img-wrap">
        <Image src={resolveImage(product.image)} alt={product.name} width={280} height={280} />
      </div>
      <div className="card-body">
        <h6 className="card-title">{product.name}</h6>
        <div className="price-container">
          <span className="current-price">₹{Number(product.price).toFixed(0)}</span>
          {product.actualPrice && (
            <span className="original-price">₹{Number(product.actualPrice).toFixed(0)}</span>
          )}
          {discount > 0 && <span className="off-percentage">{discount}% OFF</span>}
        </div>
      </div>
    </Link>
  );
}

export default function HomeSections({
  heroBanners,
  flashSaleProducts,
  midBanner,
  newArrivals,
  bigCategoryBanners,
  categoryCardBanners,
  celebBanners,
  recommendations,
  categories,
}: {
  heroBanners: Banner[];
  flashSaleProducts: Product[];
  midBanner: Banner | null;
  newArrivals: Product[];
  bigCategoryBanners: Banner[];
  categoryCardBanners: Banner[];
  celebBanners: Banner[];
  recommendations: Product[];
  categories: Category[];
}) {
  return (
    <>
      {heroBanners.length > 0 && (
        <section className="hero-carousel">
          <Carousel
            items={heroBanners}
            keyOf={(b) => b.id}
            slidesPerView={1}
            loop
            autoplay
            pagination
            renderItem={(banner) => (
              <div className="hero-slide">
                <Image
                  src={banner.imageUrl}
                  alt={banner.title || "SweetyNX"}
                  width={1600}
                  height={640}
                  priority
                  className="hero-slide-img"
                />
              </div>
            )}
          />
        </section>
      )}

      {flashSaleProducts.length > 0 && (
        <section className="main-container py-section">
          <div className="section-header-row">
            <h3 className="product-section-heading">Flash Sale</h3>
            <Link href="/listing" className="section-link">View All</Link>
          </div>
          <Carousel
            items={flashSaleProducts}
            keyOf={(p) => p.id}
            slidesPerView={2.3}
            spaceBetween={16}
            breakpoints={{
              576: { slidesPerView: 3, spaceBetween: 16 },
              768: { slidesPerView: 4, spaceBetween: 16 },
              1024: { slidesPerView: 5, spaceBetween: 16 },
              1200: { slidesPerView: 6, spaceBetween: 16 },
            }}
            navigation
            renderItem={(product) => <FlashSaleCard product={product} />}
          />
        </section>
      )}

      {midBanner && (
        <section className="mid-banner">
          <Image src={midBanner.imageUrl} alt={midBanner.title || ""} width={1600} height={400} className="w-100" />
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="main-container py-section">
          <div className="section-header-row">
            <h3 className="product-section-heading">New Arrivals</h3>
          </div>
          <Carousel
            items={newArrivals}
            keyOf={(p) => p.id}
            slidesPerView={2.3}
            spaceBetween={16}
            breakpoints={{
              576: { slidesPerView: 3, spaceBetween: 16 },
              768: { slidesPerView: 4, spaceBetween: 16 },
              1024: { slidesPerView: 5, spaceBetween: 16 },
              1200: { slidesPerView: 6, spaceBetween: 16 },
            }}
            navigation
            renderItem={(product) => <NewArrivalCard product={product} />}
          />
        </section>
      )}

      {bigCategoryBanners.length > 0 && (
        <section className="big-category-grid main-container">
          {bigCategoryBanners.slice(0, 4).map((banner) => {
            const slug = matchCategorySlug(categories, banner.title);
            return (
              <Link key={banner.id} href={slug ? `/listing/${slug}` : "/listing"} className="big-category-item">
                <Image src={banner.imageUrl} alt={banner.title || ""} width={600} height={600} />
              </Link>
            );
          })}
        </section>
      )}

      {categoryCardBanners.length > 0 && (
        <section className="main-container py-section">
          <h3 className="product-section-heading text-center">Shop By Category</h3>
          <Carousel
            items={categoryCardBanners}
            keyOf={(b) => b.id}
            slidesPerView={2.3}
            breakpoints={{ 576: { slidesPerView: 3 }, 992: { slidesPerView: 5 } }}
            navigation
            renderItem={(banner) => {
              const slug = matchCategorySlug(categories, banner.title);
              return (
                <Link href={slug ? `/listing/${slug}` : "/listing"} className="category-card-item">
                  <Image src={banner.imageUrl} alt={banner.title || ""} width={300} height={360} />
                  <span>{banner.title}</span>
                </Link>
              );
            }}
          />
        </section>
      )}

      {celebBanners.length > 0 && (
        <section className="main-container py-section">
          <h3 className="product-section-heading text-center">Celebs in SweetyNX</h3>
          <Carousel
            items={celebBanners}
            keyOf={(b) => b.id}
            slidesPerView={2}
            breakpoints={{ 576: { slidesPerView: 3 }, 992: { slidesPerView: 4 } }}
            navigation
            renderItem={(banner) => (
              <div className="celeb-card">
                <Image src={banner.imageUrl} alt={banner.title || ""} width={300} height={380} />
              </div>
            )}
          />
        </section>
      )}

      {recommendations.length > 0 && (
        <section className="main-container py-section">
          <h3 className="product-section-heading text-center">Recommendation</h3>
          <div className="grid">
            {recommendations.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
