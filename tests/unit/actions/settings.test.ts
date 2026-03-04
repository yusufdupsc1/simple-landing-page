import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getInstitutionSettings,
  updateInstitutionProfile,
  updateInstitutionSettings,
} from "@/server/actions/settings";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const mockSession = {
  user: {
    id: "user-123",
    institutionId: "inst-123",
    role: "ADMIN",
  },
};

vi.mock("@/lib/db", () => {
  const institutionFindUnique = vi.fn();
  const institutionUpdate = vi.fn();
  const institutionSettingsFindUnique = vi.fn();
  const institutionSettingsUpsert = vi.fn();
  const auditLogCreate = vi.fn();

  const tx = {
    institution: { update: institutionUpdate },
    institutionSettings: { upsert: institutionSettingsUpsert },
    auditLog: { create: auditLogCreate },
  };

  return {
    db: {
      institution: {
        findUnique: institutionFindUnique,
        update: institutionUpdate,
      },
      institutionSettings: {
        findUnique: institutionSettingsFindUnique,
        upsert: institutionSettingsUpsert,
      },
      auditLog: {
        create: auditLogCreate,
      },
      feeCategory: {
        count: vi.fn().mockResolvedValue(0),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
        findMany: vi.fn().mockResolvedValue([]),
      },
      $transaction: vi.fn(async (callback: (tx: unknown) => unknown) =>
        callback(tx),
      ),
    },
  };
});

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Settings Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
  });

  describe("getInstitutionSettings", () => {
    it("should return institution and settings", async () => {
      const institution = {
        id: "inst-123",
        name: "Test School",
        email: "admin@testschool.com",
      };
      const settings = {
        academicYear: "2024-2025",
        termsPerYear: 3,
      };

      (db.institution.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        institution,
      );
      (
        db.institutionSettings.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue(settings);

      const result = await getInstitutionSettings();

      expect(result.institution).toEqual(institution);
      expect(result.settings).toEqual(settings);
    });

    it("should throw when institutionId is missing", async () => {
      (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: "user-123", role: "ADMIN" },
      });

      await expect(getInstitutionSettings()).rejects.toThrow("Unauthorized");
    });
  });

  describe("updateInstitutionProfile", () => {
    const validFormData = {
      name: "Updated School Name",
      email: "newemail@testschool.com",
      phone: "+1234567890",
      website: "https://testschool.com",
      address: "123 New Street",
      city: "New City",
      country: "US",
      timezone: "America/Los_Angeles",
      currency: "USD",
    };

    it("should update institution profile", async () => {
      (db.institution.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "inst-123",
        ...validFormData,
      });

      const result = await updateInstitutionProfile(validFormData);

      expect(result.success).toBe(true);
      expect(db.institution.update).toHaveBeenCalled();
      expect(db.auditLog.create).toHaveBeenCalled();
    });

    it("should validate invalid input", async () => {
      const result = await updateInstitutionProfile({
        name: "",
        email: "invalid",
      } as any);

      expect(result.success).toBe(false);
      expect(result.fieldErrors).toBeDefined();
    });
  });

  describe("updateInstitutionSettings", () => {
    const validFormData = {
      academicYear: "2025-2026",
      termsPerYear: 4,
      workingDays: [1, 2, 3, 4, 5, 6],
      emailNotifs: true,
      smsNotifs: true,
      lateFeePercent: 10,
      gracePeriodDays: 14,
      signatoryName: "Principal",
      signatoryTitle: "Head of School",
      coSignatoryName: "Vice Principal",
      coSignatoryTitle: "Deputy",
      certificateFooter: "Verified",
      certificateLogoUrl: "https://example.com/logo.png",
    };

    it("should upsert institution settings", async () => {
      (
        db.institutionSettings.upsert as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: "settings-123",
        ...validFormData,
      });

      const result = await updateInstitutionSettings(validFormData);

      expect(result.success).toBe(true);
      expect(db.institutionSettings.upsert).toHaveBeenCalled();
      expect(db.auditLog.create).toHaveBeenCalled();
    });

    it("should validate terms per year max", async () => {
      const result = await updateInstitutionSettings({
        ...validFormData,
        termsPerYear: 5,
      });

      expect(result.success).toBe(false);
      expect(result.fieldErrors?.termsPerYear).toBeDefined();
    });

    it("should validate late fee percentage max", async () => {
      const result = await updateInstitutionSettings({
        ...validFormData,
        lateFeePercent: 150,
      });

      expect(result.success).toBe(false);
      expect(result.fieldErrors?.lateFeePercent).toBeDefined();
    });
  });
});
