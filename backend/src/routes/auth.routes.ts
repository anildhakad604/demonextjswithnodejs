import crypto from "node:crypto";
import { Router } from "express";
import type { CookieOptions } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { sendEmail } from "../lib/email.js";
import { passwordResetEmail } from "../lib/emailTemplates.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshTokenExpiryDate,
} from "../lib/jwt.js";

export const authRouter = Router();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const isProd = process.env.NODE_ENV === "production";
const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/",
};

async function issueTokens(res: import("express").Response, userId: string, role: string) {
  const accessToken = signAccessToken({ sub: userId, role });
  const refreshToken = signRefreshToken({ sub: userId });

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId, expiresAt: refreshTokenExpiryDate() },
  });

  res.cookie("accessToken", accessToken, { ...baseCookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...baseCookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
}

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

authRouter.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { name, email, password } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError(409, "An account with this email already exists");

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    await issueTokens(res, user.id, user.role);
    return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  })
);

const guestCheckoutSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
});

authRouter.post(
  "/guest",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { name, email } = guestCheckoutSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError(409, "An account already exists with this email. Please log in to continue.");
    }

    // Guest accounts get an unusable random password — the shopper never
    // sees it. They can claim the account later via "forgot password" if
    // they want to log back in on a future visit.
    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
    const user = await prisma.user.create({ data: { name, email, passwordHash } });

    await issueTokens(res, user.id, user.role);
    return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  })
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ApiError(401, "Invalid email or password");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new ApiError(401, "Invalid email or password");

    await issueTokens(res, user.id, user.role);
    return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  })
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) throw new ApiError(401, "No refresh token");

    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new ApiError(401, "Invalid refresh token");
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new ApiError(401, "Refresh token expired or revoked");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new ApiError(401, "User not found");

    await prisma.refreshToken.delete({ where: { token } });
    await issueTokens(res, user.id, user.role);
    return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } }).catch(() => undefined);
    }
    res.clearCookie("accessToken", baseCookieOptions);
    res.clearCookie("refreshToken", baseCookieOptions);
    return res.status(204).send();
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new ApiError(404, "User not found");
    return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  })
);

const forgotPasswordSchema = z.object({ email: z.string().email() });

authRouter.post(
  "/forgot-password",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond the same way whether or not the account exists,
    // so this endpoint can't be used to enumerate registered emails.
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      });
      const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
      const { subject, html } = passwordResetEmail(resetUrl);
      await sendEmail({ to: user.email, subject, html });
    }

    return res.json({ message: "If that email is registered, a reset link has been sent." });
  })
);

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(100),
});

authRouter.post(
  "/reset-password",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { token, password } = resetPasswordSchema.parse(req.body);

    const stored = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new ApiError(400, "This reset link is invalid or has expired");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: stored.userId } }),
      // Reset all sessions so a stolen password can't keep an old one alive.
      prisma.refreshToken.deleteMany({ where: { userId: stored.userId } }),
    ]);

    return res.json({ message: "Password updated. Please log in with your new password." });
  })
);
