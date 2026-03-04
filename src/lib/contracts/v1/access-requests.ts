import { z } from "zod";

export const AccessRequestScopeSchema = z.enum([
  "TEACHER",
  "STUDENT",
  "PARENT",
]);
export const AccessRequestStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
]);
export const LoginModeSchema = z.enum(["PASSWORD", "PHONE_OTP"]);
export const LoginScopeSchema = z.enum([
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "PARENT",
]);
const DateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)");

export const CreateAccessRequestSchema = z
  .object({
    institutionSlug: z.string().trim().toLowerCase().min(2).max(80),
    requestedScope: AccessRequestScopeSchema,
    fullName: z.string().trim().min(2).max(120),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
  })
  .superRefine((value, ctx) => {
    if (!value.email?.trim() && !value.phone?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Email or phone is required",
      });
    }
  });

export const AccessRequestListQuerySchema = z
  .object({
    status: AccessRequestStatusSchema.optional(),
    scope: AccessRequestScopeSchema.optional(),
    q: z.string().default(""),
    from: DateOnlySchema.optional(),
    to: DateOnlySchema.optional(),
    limit: z.coerce.number().int().min(1).max(200).default(100),
  })
  .superRefine((value, ctx) => {
    if (value.from && value.to && value.from > value.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: "End date must be the same or after start date",
      });
    }
  });

export const ReviewAccessRequestSchema = z.object({
  rejectionReason: z.string().min(3).max(300).optional(),
});

export const OtpSendSchema = z.object({
  institutionSlug: z.string().trim().toLowerCase().min(2).max(80),
  scope: LoginScopeSchema,
  phone: z.string().min(5),
});

export const OtpVerifySchema = z.object({
  institutionSlug: z.string().trim().toLowerCase().min(2).max(80),
  scope: LoginScopeSchema,
  phone: z.string().min(5),
  challengeId: z.string().min(1),
  code: z.string().trim().min(4).max(10),
});

export type CreateAccessRequestInput = z.infer<
  typeof CreateAccessRequestSchema
>;
export type AccessRequestListQuery = z.infer<
  typeof AccessRequestListQuerySchema
>;
export type OtpSendInput = z.infer<typeof OtpSendSchema>;
export type OtpVerifyInput = z.infer<typeof OtpVerifySchema>;
