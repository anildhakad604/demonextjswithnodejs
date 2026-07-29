"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ContentBlockEditor from "@/components/admin/ContentBlockEditor";
import ProductForm from "@/components/admin/ProductForm";
import { getProduct, type Product } from "@/lib/api";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    getProduct(params.id).then(setProduct);
  }, [params.id]);

  if (!product) return <p>Loading...</p>;

  return (
    <>
      <h1>Edit Product</h1>
      <ProductForm product={product} />
      <ContentBlockEditor productId={product.id} initialBlocks={product.contentBlocks ?? []} />
    </>
  );
}
