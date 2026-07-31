"use client";

import { useState } from "react";
import Image from "next/image";
import { resolveImage, type ProductImage } from "@/lib/api";
import WishlistButton from "@/components/WishlistButton";

export default function ProductGallery({
  productId,
  cover,
  images,
  alt,
}: {
  productId: string;
  cover: string;
  images: ProductImage[];
  alt: string;
}) {
  const allImages = [cover, ...images.map((i) => i.url)];
  const [active, setActive] = useState(0);

  return (
    <div className={`gallery-wrapper ${allImages.length <= 1 ? "no-thumbs" : ""}`}>
      {allImages.length > 1 && (
        <div className="thumb-rail">
          {allImages.map((url, i) => (
            <button
              key={i}
              type="button"
              className={`thumb ${i === active ? "active" : ""}`}
              onClick={() => setActive(i)}
            >
              <Image src={resolveImage(url)} alt={`${alt} ${i + 1}`} width={80} height={100} />
            </button>
          ))}
        </div>
      )}
      <div className="main-image">
        <WishlistButton productId={productId} className="wish gallery-wish" />
        <Image src={resolveImage(allImages[active])} alt={alt} width={700} height={875} priority />
      </div>
    </div>
  );
}
