"use client";

import { useState } from "react";

export default function ProductAccordion({ description }: { description: string }) {
  const [open, setOpen] = useState<"details" | "returns" | null>("details");

  function toggle(key: "details" | "returns") {
    setOpen((prev) => (prev === key ? null : key));
  }

  return (
    <div className="product-accordion">
      <div className="accordion-item">
        <button className="accordion-header" onClick={() => toggle("details")}>
          PRODUCT DETAILS
          <span className="accordion-caret">{open === "details" ? "−" : "+"}</span>
        </button>
        {open === "details" && (
          <div className="accordion-body rich-text" dangerouslySetInnerHTML={{ __html: description }} />
        )}
      </div>
      <div className="accordion-item">
        <button className="accordion-header" onClick={() => toggle("returns")}>
          RETURN POLICY
          <span className="accordion-caret">{open === "returns" ? "−" : "+"}</span>
        </button>
        {open === "returns" && (
          <div className="accordion-body">
            <p>Return within 5 days of delivery for a full refund, provided the item is unused and in its original packaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}
