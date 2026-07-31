function layout(preheader: string, bodyHtml: string): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#171717">
    <h2 style="margin:0 0 4px;letter-spacing:-.02em">SweetyNX</h2>
    <p style="color:#777;margin:0 0 24px;font-size:13px">${preheader}</p>
    ${bodyHtml}
    <p style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;color:#999;font-size:12px">
      If you weren't expecting this email, you can safely ignore it.
    </p>
  </div>`;
}

function button(url: string, label: string): string {
  return `<p><a href="${url}" style="display:inline-block;background:#111;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700">${label}</a></p>`;
}

export function passwordResetEmail(resetUrl: string): { subject: string; html: string } {
  return {
    subject: "Reset your SweetyNX password",
    html: layout(
      "Reset your password",
      `<p>We received a request to reset your SweetyNX account password. This link expires in 1 hour.</p>
       ${button(resetUrl, "Reset Password")}
       <p style="font-size:12px;color:#999;word-break:break-all">Or paste this link into your browser: ${resetUrl}</p>`
    ),
  };
}

export type OrderEmailItem = { name: string; size?: string | null; quantity: number; price: string };

function itemsTable(items: OrderEmailItem[]): string {
  const rows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0">${item.name}${item.size ? ` (${item.size})` : ""} × ${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right">₹${(Number(item.price) * item.quantity).toLocaleString("en-IN")}</td>
        </tr>`
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">${rows}</table>`;
}

export function orderConfirmationEmail(order: {
  id: string;
  items: OrderEmailItem[];
  total: string;
}): { subject: string; html: string } {
  return {
    subject: `Order confirmed — #${order.id.slice(0, 8)}`,
    html: layout(
      "Your order is confirmed",
      `<p>Thanks for your order! We're getting it ready.</p>
       ${itemsTable(order.items)}
       <p style="font-weight:700">Total: ₹${Number(order.total).toLocaleString("en-IN")}</p>
       <p style="font-size:13px;color:#777">Order reference: #${order.id.slice(0, 8)}</p>`
    ),
  };
}

const STATUS_MESSAGES: Record<string, string> = {
  PROCESSING: "Your order is being processed and will ship soon.",
  SHIPPED: "Your order is on its way!",
  DELIVERED: "Your order has been delivered. We hope you love it.",
  CANCELLED: "Your order has been cancelled. If this wasn't expected, please contact us.",
};

export function orderStatusEmail(order: { id: string; total: string }, status: string): { subject: string; html: string } {
  const message = STATUS_MESSAGES[status] || `Your order status is now ${status}.`;
  return {
    subject: `Order update — #${order.id.slice(0, 8)} is ${status.toLowerCase()}`,
    html: layout(
      `Order status: ${status}`,
      `<p>${message}</p>
       <p style="font-size:13px;color:#777">Order reference: #${order.id.slice(0, 8)} — Total ₹${Number(order.total).toLocaleString("en-IN")}</p>`
    ),
  };
}

export function contactMessageEmail(input: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): { subject: string; html: string } {
  return {
    subject: `New contact form message from ${input.name}`,
    html: layout(
      "Contact Us submission",
      `<p><strong>Name:</strong> ${input.name}</p>
       <p><strong>Email:</strong> ${input.email}</p>
       ${input.phone ? `<p><strong>Phone:</strong> ${input.phone}</p>` : ""}
       <p><strong>Message:</strong></p>
       <p style="white-space:pre-wrap">${input.message}</p>`
    ),
  };
}
