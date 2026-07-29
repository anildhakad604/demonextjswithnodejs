import Image from "next/image";
import type { ContentBlock } from "@/lib/api";
import { resolveImage } from "@/lib/api";

export default function ProductContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  if (blocks.length === 0) return null;

  return (
    <div className="content-blocks">
      {blocks.map((block) => {
        switch (block.type) {
          case "HEADING_TEXT":
            return (
              <div className="content-block content-block-heading" key={block.id}>
                <h2>{block.data.title}</h2>
                <div className="rich-text" dangerouslySetInnerHTML={{ __html: block.data.body }} />
              </div>
            );
          case "IMAGE_TEXT":
            return (
              <div
                className={`content-block content-block-image-text ${
                  block.data.layout === "image-right" ? "content-block-image-right" : ""
                }`}
                key={block.id}
              >
                <div className="content-block-image">
                  <Image src={resolveImage(block.data.image)} alt={block.data.title} width={600} height={450} />
                </div>
                <div className="content-block-text">
                  <h2>{block.data.title}</h2>
                  <div className="rich-text" dangerouslySetInnerHTML={{ __html: block.data.body }} />
                </div>
              </div>
            );
          case "FEATURE_GRID":
            return (
              <div className="content-block content-block-feature-grid" key={block.id}>
                {block.data.title && <h2>{block.data.title}</h2>}
                <div className="feature-grid">
                  {block.data.items.map((item, i) => (
                    <div className="feature-item" key={i}>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          case "FULL_IMAGE":
            return (
              <figure className="content-block content-block-full-image" key={block.id}>
                <Image
                  src={resolveImage(block.data.image)}
                  alt={block.data.caption || ""}
                  width={1200}
                  height={675}
                />
                {block.data.caption && <figcaption>{block.data.caption}</figcaption>}
              </figure>
            );
        }
      })}
    </div>
  );
}
