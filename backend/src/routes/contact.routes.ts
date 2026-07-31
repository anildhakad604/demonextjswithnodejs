import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { sendEmail } from "../lib/email.js";
import { contactMessageEmail } from "../lib/emailTemplates.js";

export const contactRouter = Router();

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  message: z.string().min(1).max(2000),
});

contactRouter.post(
  "/",
  authLimiter,
  asyncHandler(async (req, res) => {
    const input = contactSchema.parse(req.body);
    const { subject, html } = contactMessageEmail(input);
    await sendEmail({ to: process.env.CONTACT_EMAIL || "admin@example.com", subject, html });
    return res.json({ message: "Thanks — we'll get back to you shortly." });
  })
);
