import { notFound } from "next/navigation";
import ContactForm from "@/components/ContactForm";
import FaqList from "@/components/FaqList";

const STATIC_PAGES: Record<string, { title: string; body: string }> = {
  "terms-conditions": {
    title: "Terms & Conditions",
    body: `
      <p>By using SweetyNX, you agree to the following terms.</p>
      <h6>Orders</h6>
      <p>All orders are subject to product availability. We reserve the right to cancel any order due to stock or pricing errors, in which case you'll receive a full refund.</p>
      <h6>Pricing</h6>
      <p>Prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise.</p>
      <h6>Account</h6>
      <p>You're responsible for keeping your account and OTP verification secure. Notify us immediately of any unauthorized use.</p>
    `,
  },
  "returns-policy": {
    title: "Returns Policy",
    body: `
      <p>We want you to love what you ordered. If you don't, here's how returns work.</p>
      <h6>Return Window</h6>
      <p>Items can be returned within <strong>5 days</strong> of delivery, unused, unwashed, and in their original packaging with tags attached.</p>
      <h6>How to Return</h6>
      <p>Go to My Account &gt; My Orders, select the item, and choose Return. Our team will arrange a pickup where available.</p>
      <h6>Refunds</h6>
      <p>Once we receive and inspect the returned item, refunds are issued to your original payment method within 5-7 business days.</p>
    `,
  },
  "shipping-information": {
    title: "Shipping Information",
    body: `
      <p>Free shipping on prepaid orders above ₹999 — a flat ₹49 delivery fee applies below that.</p>
      <h6>Delivery Timelines</h6>
      <p>Most orders are delivered within 5-7 business days, depending on your location.</p>
      <h6>Order Tracking</h6>
      <p>Track your order any time from My Account &gt; My Orders.</p>
    `,
  },
  "privacy-policy": {
    title: "Privacy Policy",
    body: `
      <p>We collect only the information needed to process your orders and improve your shopping experience: name, contact details, shipping address, and order history.</p>
      <h6>How We Use Your Data</h6>
      <p>Your information is used to fulfill orders, provide customer support, and send order updates. We never sell your personal data to third parties.</p>
      <h6>Payments</h6>
      <p>Payments are processed securely by Razorpay — we do not store your card or bank details.</p>
    `,
  },
};

export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug === "contact-us") {
    return (
      <main className="container section info-page">
        <h1>Contact Us</h1>
        <p className="muted">Have a question about an order or product? Send us a message and we'll get back to you shortly.</p>
        <ContactForm />
      </main>
    );
  }

  if (slug === "faq") {
    return (
      <main className="container section info-page">
        <h1>Frequently Asked Questions</h1>
        <FaqList />
      </main>
    );
  }

  const page = STATIC_PAGES[slug];
  if (!page) notFound();

  return (
    <main className="container section info-page">
      <h1>{page.title}</h1>
      <div className="rich-text" dangerouslySetInnerHTML={{ __html: page.body }} />
    </main>
  );
}
