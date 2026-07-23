import { Router } from "express";
import express from "express";
import { verifyWebhookSignature } from "../lib/razorpay.js";
import { fulfillPaidOrder } from "../lib/orderFulfillment.js";
import { prisma } from "../lib/prisma.js";

export const webhookRouter = Router();

type RazorpayWebhookEvent = {
  event: string;
  payload: {
    payment?: {
      entity: { id: string; order_id: string; status: string };
    };
  };
};

// Mounted with express.raw() in server.ts (before the global JSON parser)
// because signature verification needs the exact raw request bytes.
webhookRouter.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.body instanceof Buffer ? req.body.toString("utf8") : "";

    if (typeof signature !== "string" || !rawBody || !verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    let event: RazorpayWebhookEvent;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return res.status(400).json({ message: "Invalid payload" });
    }

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload.payment?.entity;
      if (payment?.order_id) {
        const order = await prisma.order.findFirst({ where: { razorpayOrderId: payment.order_id } });
        if (order) {
          try {
            await fulfillPaidOrder(order.id, { paymentId: payment.id });
          } catch (err) {
            console.error("Webhook fulfillment failed for order", order.id, err);
            return res.status(500).json({ message: "Fulfillment failed" });
          }
        }
      }
    }

    return res.status(200).json({ received: true });
  }
);
