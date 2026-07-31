import HomeSections from "@/components/home/HomeSections";
import { getBanners, getCategories, getProducts } from "@/lib/api";

export default async function Home() {
  const [
    heroBanners,
    midBanners,
    bigCategoryBanners,
    categoryCardBanners,
    celebBanners,
    categories,
    flashSale,
    newArrivals,
    recommendations,
  ] = await Promise.all([
    getBanners("HERO"),
    getBanners("MID"),
    getBanners("BIG_CATEGORY"),
    getBanners("CATEGORY_CARD"),
    getBanners("CELEB"),
    getCategories(),
    getProducts({ isFlashSale: true, limit: 10 }),
    getProducts({ sort: "new", limit: 10 }),
    getProducts({ sort: "popular", limit: 8 }),
  ]);

  return (
    <main>
      <HomeSections
        heroBanners={heroBanners}
        flashSaleProducts={flashSale.items}
        midBanner={midBanners[0] ?? null}
        newArrivals={newArrivals.items}
        bigCategoryBanners={bigCategoryBanners}
        categoryCardBanners={categoryCardBanners}
        celebBanners={celebBanners}
        recommendations={recommendations.items}
        categories={categories}
      />
    </main>
  );
}
