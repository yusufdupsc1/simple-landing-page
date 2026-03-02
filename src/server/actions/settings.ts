// src/server/actions/settings.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GOVT_PRIMARY_FEE_PRESETS } from "@/lib/finance/fee-presets";

const InstitutionSettingsSchema = z.object({
  academicYear: z.string().min(1, "Academic year is required"),
  termsPerYear: z.coerce.number().min(1).max(4).default(3),
  workingDays: z.array(z.number()).default([1, 2, 3, 4, 5]),
  emailNotifs: z.boolean().default(true),
  smsNotifs: z.boolean().default(false),
  lateFeePercent: z.coerce.number().min(0).max(100).default(0),
  gracePeriodDays: z.coerce.number().min(0).max(365).default(7),
  signatoryName: z.string().optional(),
  signatoryTitle: z.string().optional(),
  coSignatoryName: z.string().optional(),
  coSignatoryTitle: z.string().optional(),
  certificateFooter: z.string().optional(),
  certificateLogoUrl: z.string().url().optional().or(z.literal("")),
  publicReportsEnabled: z.boolean().default(false),
  publicReportsDescription: z.string().max(240).optional().or(z.literal("")),
});

const InstitutionProfileSchema = z.object({
  name: z.string().min(1, "Institution name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional().default("Bangladesh"),
  timezone: z.string().default("Asia/Dhaka"),
  currency: z.string().default("BDT"),
});

const FeeCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(80),
  feeType: z
    .enum([
      "TUITION",
      "TRANSPORT",
      "LIBRARY",
      "LABORATORY",
      "SPORTS",
      "EXAMINATION",
      "UNIFORM",
      "MISC",
    ])
    .default("MISC"),
});

export type InstitutionSettingsData = z.infer<typeof InstitutionSettingsSchema>;
export type InstitutionProfileData = z.infer<typeof InstitutionProfileSchema>;
export type FeeCategoryData = z.infer<typeof FeeCategorySchema>;

type ActionResult<T = void> =
  | { success: true; data?: T; error?: never }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
      data?: never;
    };

async function ensureBangladeshFeeCategoryPresets(institutionId: string) {
  const existing = await db.feeCategory.count({ where: { institutionId } });
  if (existing > 0) return;

  await db.feeCategory.createMany({
    data: GOVT_PRIMARY_FEE_PRESETS.map((preset) => ({
      name: preset.titleEn,
      feeType: preset.feeType,
      isPreset: true,
      institutionId,
    })),
    skipDuplicates: true,
  });
}

async function getAuthContext() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; institutionId?: string; role?: string }
    | undefined;

  if (!user?.id || !user.institutionId || !user.role) {
    throw new Error("Unauthorized");
  }

  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    throw new Error("Insufficient permissions");
  }

  return {
    userId: user.id,
    institutionId: user.institutionId,
    role: user.role,
  };
}

export async function getInstitutionSettings() {
  const session = await auth();
  const user = session?.user as { institutionId?: string } | undefined;

  if (!user?.institutionId) throw new Error("Unauthorized");

  await ensureBangladeshFeeCategoryPresets(user.institutionId);

  const [institution, settings, feeCategories] = await Promise.all([
    db.institution.findUnique({
      where: { id: user.institutionId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        website: true,
        address: true,
        city: true,
        country: true,
        timezone: true,
        currency: true,
        plan: true,
        planExpiry: true,
        logo: true,
      },
    }),
    db.institutionSettings.findUnique({
      where: { institutionId: user.institutionId },
    }),
    db.feeCategory.findMany({
      where: { institutionId: user.institutionId },
      select: {
        id: true,
        name: true,
        feeType: true,
        isPreset: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return { institution, settings, feeCategories };
}

export async function updateInstitutionProfile(
  formData: InstitutionProfileData,
): Promise<ActionResult> {
  try {
    const { institutionId, userId } = await getAuthContext();
    const parsed = InstitutionProfileSchema.safeParse(formData);

    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const data = parsed.data;

    await db.$transaction(async (tx) => {
      await tx.institution.update({
        where: { id: institutionId },
        data: {
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          website: data.website || null,
          address: data.address || null,
          city: data.city || null,
          country: data.country || null,
          timezone: data.timezone,
          currency: data.currency,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "Institution",
          entityId: institutionId,
          newValues: { name: data.name },
          userId,
        },
      });
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE_INSTITUTION_PROFILE]", error);
    return { success: false, error: "Failed to update institution profile." };
  }
}

export async function updateInstitutionSettings(
  formData: InstitutionSettingsData,
): Promise<ActionResult> {
  try {
    const { institutionId, userId } = await getAuthContext();
    const parsed = InstitutionSettingsSchema.safeParse(formData);

    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const data = parsed.data;

    await db.$transaction(async (tx) => {
      await tx.institutionSettings.upsert({
        where: { institutionId },
        create: {
          institutionId,
          academicYear: data.academicYear,
          termsPerYear: data.termsPerYear,
          workingDays: data.workingDays,
          emailNotifs: data.emailNotifs,
          smsNotifs: data.smsNotifs,
          lateFeePercent: data.lateFeePercent,
          gracePeriodDays: data.gracePeriodDays,
          signatoryName: data.signatoryName || null,
          signatoryTitle: data.signatoryTitle || null,
          coSignatoryName: data.coSignatoryName || null,
          coSignatoryTitle: data.coSignatoryTitle || null,
          certificateFooter: data.certificateFooter || null,
          certificateLogoUrl: data.certificateLogoUrl || null,
          publicReportsEnabled: data.publicReportsEnabled,
          publicReportsDescription: data.publicReportsDescription || null,
        },
        update: {
          academicYear: data.academicYear,
          termsPerYear: data.termsPerYear,
          workingDays: data.workingDays,
          emailNotifs: data.emailNotifs,
          smsNotifs: data.smsNotifs,
          lateFeePercent: data.lateFeePercent,
          gracePeriodDays: data.gracePeriodDays,
          signatoryName: data.signatoryName || null,
          signatoryTitle: data.signatoryTitle || null,
          coSignatoryName: data.coSignatoryName || null,
          coSignatoryTitle: data.coSignatoryTitle || null,
          certificateFooter: data.certificateFooter || null,
          certificateLogoUrl: data.certificateLogoUrl || null,
          publicReportsEnabled: data.publicReportsEnabled,
          publicReportsDescription: data.publicReportsDescription || null,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "InstitutionSettings",
          entityId: institutionId,
          newValues: data as Record<string, unknown>,
          userId,
        },
      });
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE_INSTITUTION_SETTINGS]", error);
    return { success: false, error: "Failed to update settings." };
  }
}

export async function createFeeCategory(
  formData: FeeCategoryData,
): Promise<ActionResult<{ id: string; name: string; feeType: string }>> {
  try {
    const { institutionId } = await getAuthContext();
    const parsed = FeeCategorySchema.safeParse(formData);

    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const category = await db.feeCategory.create({
      data: {
        institutionId,
        name: parsed.data.name.trim(),
        feeType: parsed.data.feeType,
      },
      select: {
        id: true,
        name: true,
        feeType: true,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true, data: category };
  } catch (error) {
    console.error("[CREATE_FEE_CATEGORY]", error);
    return { success: false, error: "Failed to create fee category." };
  }
}

export async function updateFeeCategory(
  categoryId: string,
  formData: FeeCategoryData,
): Promise<ActionResult<{ id: string; name: string; feeType: string }>> {
  try {
    const { institutionId } = await getAuthContext();
    const parsed = FeeCategorySchema.safeParse(formData);

    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const existing = await db.feeCategory.findFirst({
      where: { id: categoryId, institutionId },
      select: { id: true },
    });
    if (!existing) {
      return { success: false, error: "Fee category not found." };
    }

    const category = await db.feeCategory.update({
      where: { id: categoryId },
      data: {
        name: parsed.data.name.trim(),
        feeType: parsed.data.feeType,
      },
      select: {
        id: true,
        name: true,
        feeType: true,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true, data: category };
  } catch (error) {
    console.error("[UPDATE_FEE_CATEGORY]", error);
    return { success: false, error: "Failed to update fee category." };
  }
}
