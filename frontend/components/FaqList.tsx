"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

type Faq = { category: string; question: string; answer: string };

const FAQS: Faq[] = [
  { category: "orders", question: "How do I track my order?", answer: "Go to My Account > My Orders and click Details on any order to see its current status." },
  { category: "orders", question: "Can I change my order after placing it?", answer: "Orders can be cancelled from My Orders only while payment is still pending. Once paid, contact support to make changes." },
  { category: "returns", question: "What is your returns policy?", answer: "Items can be returned within 5 days of delivery, unused and in original packaging. See our Returns Policy page for details." },
  { category: "returns", question: "How long do refunds take?", answer: "Refunds are processed within 5-7 business days of us receiving the returned item." },
  { category: "payments", question: "What payment methods do you accept?", answer: "We accept all major cards, UPI, net banking, and wallets via Razorpay." },
  { category: "payments", question: "Is it safe to pay on SweetyNX?", answer: "Yes — all payments are processed securely through Razorpay and we never store your card details." },
  { category: "coupons", question: "How do I use a coupon code?", answer: "Enter your coupon code at checkout or in the cart summary and click Apply to see the discount." },
  { category: "coupons", question: "Why isn't my coupon working?", answer: "Check that your order meets the coupon's minimum order value and that it hasn't expired." },
];

function FaqListInner() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") || "all";
  const [active, setActive] = useState(initial);

  const categories = ["all", "orders", "returns", "payments", "coupons"];
  const visible = active === "all" ? FAQS : FAQS.filter((f) => f.category === active);

  return (
    <div>
      <div className="faq-tabs">
        {categories.map((c) => (
          <button key={c} className={active === c ? "active" : ""} onClick={() => setActive(c)}>
            {c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>
      <div className="faq-list">
        {visible.map((f, i) => (
          <div className="faq-item" key={i}>
            <strong>{f.question}</strong>
            <p>{f.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FaqList() {
  return (
    <Suspense fallback={null}>
      <FaqListInner />
    </Suspense>
  );
}
