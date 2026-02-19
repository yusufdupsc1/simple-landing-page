type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitRecord>();

function now() {
  return Date.now();
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const current = now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= current) {
    buckets.set(key, { count: 1, resetAt: current + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: current + windowMs };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  buckets.set(key, existing);

  return { allowed: true, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
}
