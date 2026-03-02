// src/server/actions/auth.ts
// Server Actions — Registration, Forgot Password, Reset Password
"use server";

import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail, passwordResetEmail, welcomeEmail } from "@/lib/email";
import { GOVT_PRIMARY_FEE_PRESETS } from "@/lib/finance/fee-presets";

// ─── Types ────────────────────────────────────────────────────────────────
type ActionResult<T = undefined> =
  | { success: true; data?: T; error?: never }
  | { success: false; error: string; data?: never };

// ─── Zod Schemas ──────────────────────────────────────────────────────────
const RegisterSchema = z
  .object({
    institutionName: z
      .string()
      .min(2, "Institution name must be at least 2 characters")
      .max(100),
    adminName: z.string().min(2, "Name must be at least 2 characters").max(80),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof RegisterSchema>;
export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;

// ─── Register (Institution + Super Admin) ─────────────────────────────────
export async function registerInstitution(
  data: RegisterFormData,
): Promise<ActionResult> {
  const parsed = RegisterSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Validation failed",
    };
  }

  const { institutionName, adminName, password } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();

  try {
    // Check if email already registered
    const existing = await db.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (existing) {
      return {
        success: false,
        error: "An account with this email already exists.",
      };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Generate slug from institution name
    const rawSlug = institutionName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Ensure slug uniqueness
    let slug = rawSlug;
    let suffix = 1;
    while (await db.institution.findUnique({ where: { slug } })) {
      slug = `${rawSlug}-${suffix++}`;
    }

    // Create institution + admin user in a transaction
    await db.$transaction(async (tx) => {
      const institution = await tx.institution.create({
        data: {
          name: institutionName,
          slug,
          plan: "STARTER",
          email,
          country: "BD",
          timezone: "Asia/Dhaka",
          currency: "BDT",
        },
      });

      await tx.user.create({
        data: {
          email,
          name: adminName,
          password: passwordHash,
          role: "SUPER_ADMIN",
          approvalStatus: "APPROVED",
          institutionId: institution.id,
          emailVerified: new Date(),
        },
      });

      await tx.institutionSettings.upsert({
        where: { institutionId: institution.id },
        update: {},
        create: {
          institutionId: institution.id,
          academicYear: "2026-2027",
          termsPerYear: 3,
          emailNotifs: true,
          smsNotifs: false,
        },
      });

      await tx.feeCategory.createMany({
        data: GOVT_PRIMARY_FEE_PRESETS.map((preset) => ({
          institutionId: institution.id,
          name: preset.titleEn,
          feeType: preset.feeType,
          isPreset: true,
        })),
        skipDuplicates: true,
      });

    });

    // Send welcome email (non-blocking)
    void sendEmail({
      to: email,
      subject: `Welcome to Dhadash — ${institutionName}`,
      html: welcomeEmail(
        adminName,
        institutionName,
        `${env.NEXT_PUBLIC_APP_URL}/auth/login`,
      ),
    });

    return { success: true };
  } catch (err) {
    console.error("[register] error:", err);
    return { success: false, error: "Registration failed. Please try again." };
  }
}

// ─── Forgot Password ──────────────────────────────────────────────────────
export async function forgotPassword(
  data: ForgotPasswordFormData,
): Promise<ActionResult> {
  const parsed = ForgotPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid email",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const user = await db.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });

    // Always return success to prevent email enumeration
    if (!user) return { success: true };

    // Delete any existing tokens for this user
    await db.verificationToken.deleteMany({ where: { identifier: email } });

    // Create a secure token (expires in 1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await db.verificationToken.create({
      data: { identifier: email, token: hashed, expires },
    });

    const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await sendEmail({
      to: email,
      subject: "Reset your Dhadash password",
      html: passwordResetEmail(resetUrl),
    });

    return { success: true };
  } catch (err) {
    console.error("[forgot-password] error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ─── Reset Password ───────────────────────────────────────────────────────
export async function resetPassword(
  email: string,
  data: ResetPasswordFormData,
): Promise<ActionResult> {
  const parsed = ResetPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Validation failed",
    };
  }

  const { token, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    const record = await db.verificationToken.findFirst({
      where: { identifier: normalizedEmail, token: hashed },
    });

    if (!record) {
      return { success: false, error: "Invalid or expired reset link." };
    }

    if (record.expires < new Date()) {
      await db.verificationToken.delete({
        where: {
          identifier_token: { identifier: normalizedEmail, token: hashed },
        },
      });
      return {
        success: false,
        error: "This reset link has expired. Please request a new one.",
      };
    }

    const user = await db.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      select: { id: true },
    });
    if (!user) {
      return { success: false, error: "Account not found." };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      db.verificationToken.delete({
        where: {
          identifier_token: { identifier: normalizedEmail, token: hashed },
        },
      }),
    ]);

    return { success: true };
  } catch (err) {
    console.error("[reset-password] error:", err);
    return {
      success: false,
      error: "Password reset failed. Please try again.",
    };
  }
}
