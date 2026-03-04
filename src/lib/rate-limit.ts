// src/lib/rate-limit.ts
// Simple in-memory rate limiter (use Redis for production/clustered deployments)

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    if (typeof process !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  check(key: string, limit: number, windowSeconds: number): boolean {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const entry = this.store.get(key);

    if (!entry || entry.resetAt < now) {
      // First request or window expired - create new entry
      this.store.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return true;
    }

    if (entry.count >= limit) {
      // Rate limit exceeded
      return false;
    }

    // Increment counter
    entry.count++;
    return true;
  }

  getRemaining(key: string): number {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt < now) {
      return 0;
    }

    return Math.max(0, 100 - entry.count); // Assuming default limit of 100
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Helper for checking rate limits in API routes
export function checkRateLimit(
  identifier: string,
  limit = 100,
  windowSeconds = 60,
): { success: boolean; remaining: number; resetAt: number } {
  const success = rateLimiter.check(identifier, limit, windowSeconds);
  const remaining = rateLimiter.getRemaining(identifier);

  // Get reset time (approximate)
  const now = Date.now();
  const resetAt = now + windowSeconds * 1000;

  return { success, remaining, resetAt };
}

// Middleware helper for rate limiting
export async function withRateLimit(
  req: Request,
  options: {
    limit?: number;
    windowSeconds?: number;
    identifier?: string;
  } = {},
): Promise<{ success: boolean; status: number }> {
  const { limit = 100, windowSeconds = 60 } = options;

  // Use IP address as identifier (or custom identifier)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const identifier = options.identifier || ip;

  const result = checkRateLimit(identifier, limit, windowSeconds);

  return {
    success: result.success,
    status: result.success ? 200 : 429,
  };
}
