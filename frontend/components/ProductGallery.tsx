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
    <div>
      <div className="gallery-main">
        <WishlistButton productId={productId} className="wishlist-btn-card" />
        <Image src={resolveImage(allImages[active])} alt={alt} width={900} height={900} />
      </div>
      {allImages.length > 1 && (
        <div className="gallery-thumbs">
          {allImages.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <button
              key={i}
              type="button"
              className={`gallery-thumb ${i === active ? "active" : ""}`}
              onClick={() => setActive(i)}
            >
              <img src={resolveImage(url)} alt={`${alt} ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
