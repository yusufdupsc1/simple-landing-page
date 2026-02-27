// src/server/actions/auth.ts
// Server Actions — Registration, Forgot Password, Reset Password
"use server";

import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail, passwordResetEmail, welcomeEmail } from "@/lib/email";

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

  const { institutionName, adminName, email, password } = parsed.data;

  try {
    // Check if email already registered
    const existing = await db.user.findUnique({ where: { email } });
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

    // Parse name parts
    const nameParts = adminName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || firstName;

    // Create institution + admin user in a transaction
    const result = await db.$transaction(async (tx) => {
      const institution = await tx.institution.create({
        data: {
          name: institutionName,
          slug,
          plan: "STARTER",
          email,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          name: adminName,
          firstName,
          lastName,
          passwordHash,
          role: "SUPER_ADMIN",
          institutionId: institution.id,
          emailVerified: new Date(),
        },
      });

      return { institution, user };
    });

    // Send welcome email (non-blocking)
    void sendEmail({
      to: email,
      subject: `Welcome to scholaOps — ${institutionName}`,
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

  const { email } = parsed.data;

  try {
    const user = await db.user.findUnique({ where: { email } });

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
      subject: "Reset your scholaOps password",
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

  try {
    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    const record = await db.verificationToken.findFirst({
      where: { identifier: email, token: hashed },
    });

    if (!record) {
      return { success: false, error: "Invalid or expired reset link." };
    }

    if (record.expires < new Date()) {
      await db.verificationToken.delete({
        where: { identifier_token: { identifier: email, token: hashed } },
      });
      return {
        success: false,
        error: "This reset link has expired. Please request a new one.",
      };
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return { success: false, error: "Account not found." };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      db.verificationToken.delete({
        where: { identifier_token: { identifier: email, token: hashed } },
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
