import { notFound, redirect } from "next/navigation";
import { ApiRequestError, getProduct, getProductUrl } from "@/lib/api";

// Legacy URL shape kept only as a redirect to the new
// /{category}/{subcategory}/{sku} route (see app/[category]/[subcategory]/[sku]/page.tsx).
export default async function LegacyProductRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id).catch((err) => {
    if (err instanceof ApiRequestError && err.status === 404) return null;
    throw err;
  });
  if (!product) notFound();
  redirect(getProductUrl(product));
}
