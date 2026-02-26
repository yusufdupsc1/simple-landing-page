import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  sendEmail,
  passwordResetEmail,
  welcomeEmail,
  newStudentEmail,
} from "@/lib/email";

vi.mock("@/lib/env", () => ({
  env: {
    RESEND_API_KEY: "test-resend-key",
    EMAIL_FROM: "test@example.com",
  },
}));

global.fetch = vi.fn();

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("sendEmail", () => {
    it("should send email successfully when API key is configured", async () => {
      // Arrange
      const mockResponse = { id: "email-123" };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test Email",
        html: "<p>Test content</p>",
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.id).toBe("email-123");
    });

    it("should return error when API call fails", async () => {
      // Arrange
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Invalid API key" }),
      });

      // Act
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test Email",
        html: "<p>Test content</p>",
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle network errors", async () => {
      // Arrange
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Network error"),
      );

      // Act
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test Email",
        html: "<p>Test content</p>",
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    });

    it("should use custom from address when provided", async () => {
      // Arrange
      const mockResponse = { id: "email-123" };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      await sendEmail({
        to: "test@example.com",
        subject: "Test Email",
        html: "<p>Test content</p>",
        from: "custom@example.com",
      });

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.resend.com/emails",
        expect.objectContaining({
          body: expect.stringContaining("custom@example.com"),
        }),
      );
    });
  });

  describe("passwordResetEmail", () => {
    it("should generate password reset email HTML", () => {
      // Act
      const html = passwordResetEmail("https://example.com/reset", 60);

      // Assert
      expect(html).toContain("Reset your password");
      expect(html).toContain("https://example.com/reset");
      expect(html).toContain("60 minutes");
    });

    it("should include institution branding", () => {
      // Act
      const html = passwordResetEmail("https://example.com/reset");

      // Assert
      expect(html).toContain("ScholaOPS");
    });
  });

  describe("welcomeEmail", () => {
    it("should generate welcome email HTML", () => {
      // Act
      const html = welcomeEmail(
        "John Doe",
        "Test Academy",
        "https://example.com/login",
      );

      // Assert
      expect(html).toContain("Welcome to ScholaOPS");
      expect(html).toContain("John Doe");
      expect(html).toContain("Test Academy");
      expect(html).toContain("https://example.com/login");
    });
  });

  describe("newStudentEmail", () => {
    it("should generate new student enrollment email", () => {
      // Act
      const html = newStudentEmail("John Doe", "STU-2024-0001", "Test Academy");

      // Assert
      expect(html).toContain("New Student Enrolled");
      expect(html).toContain("John Doe");
      expect(html).toContain("STU-2024-0001");
      expect(html).toContain("Test Academy");
    });
  });
});
