import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  registerInstitution,
  forgotPassword,
  resetPassword,
} from "@/server/actions/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    institution: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    institutionSettings: {
      upsert: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    verificationToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    feeCategory: {
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: vi.fn((arg) => {
      if (typeof arg === "function") return arg(db);
      return Promise.all(arg);
    }),
  },
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, id: "test-id" }),
  welcomeEmail: vi.fn().mockReturnValue("<html>Welcome</html>"),
  passwordResetEmail: vi.fn().mockReturnValue("<html>Reset</html>"),
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed-password"),
}));

describe("Auth Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers institution and super admin", async () => {
    (db.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (db.institution.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (db.institution.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "inst-1",
    });
    (db.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
    });

    const result = await registerInstitution({
      institutionName: "Greenfield School",
      adminName: "Admin User",
      email: "admin@greenfield.edu",
      password: "Admin1234",
      confirmPassword: "Admin1234",
    });

    expect(result.success).toBe(true);
    expect(db.institution.create).toHaveBeenCalled();
    expect(db.user.create).toHaveBeenCalled();
    expect(db.institutionSettings.upsert).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalled();
  });

  it("rejects duplicate admin email during register", async () => {
    (db.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "existing",
    });

    const result = await registerInstitution({
      institutionName: "Greenfield School",
      adminName: "Admin User",
      email: "admin@greenfield.edu",
      password: "Admin1234",
      confirmPassword: "Admin1234",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("already exists");
  });

  it("sends reset email for known account", async () => {
    (db.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
    });

    const result = await forgotPassword({ email: "admin@greenfield.edu" });

    expect(result.success).toBe(true);
    expect(db.verificationToken.deleteMany).toHaveBeenCalled();
    expect(db.verificationToken.create).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalled();
  });

  it("validates forgot-password payload", async () => {
    const result = await forgotPassword({ email: "invalid-email" });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid email");
  });

  it("rejects reset with invalid token", async () => {
    (
      db.verificationToken.findFirst as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);

    const result = await resetPassword("admin@greenfield.edu", {
      token: "bad-token",
      password: "NewPass123",
      confirmPassword: "NewPass123",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid or expired");
  });

  it("resets password with valid token", async () => {
    (
      db.verificationToken.findFirst as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      identifier: "admin@greenfield.edu",
      token: "hashed",
      expires: new Date(Date.now() + 3600_000),
    });
    (db.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
    });
    (db.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
    });
    (db.verificationToken.delete as ReturnType<typeof vi.fn>).mockResolvedValue(
      {},
    );

    const result = await resetPassword("admin@greenfield.edu", {
      token: "valid-token",
      password: "NewPass123",
      confirmPassword: "NewPass123",
    });

    expect(result.success).toBe(true);
    expect(db.user.update).toHaveBeenCalled();
    expect(db.verificationToken.delete).toHaveBeenCalled();
  });
});
