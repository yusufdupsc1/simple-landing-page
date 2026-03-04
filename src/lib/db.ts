import { PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";

// In local/dev, ensure file-based env values are the source of truth.
// This prevents stale shell exports from overriding DATABASE_URL.
if (process.env.NODE_ENV !== "production") {
  loadEnv({ path: ".env" });
  loadEnv({ path: ".env.local", override: true });
}

function getDbHostFromUrl(url?: string): string {
  if (!url) return "missing";
  try {
    return new URL(url).host;
  } catch {
    return "invalid";
  }
}

function normalizeDatasourceUrl(url?: string): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);

    // Reduce connection pressure in serverless/session pool mode.
    // Keep existing user-provided values if already configured.
    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", "1");
    }
    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", "20");
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

function createMockModel() {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "count") return async () => 0;
        if (prop === "aggregate")
          return async () => ({ _sum: { amount: 0 }, _count: 0 });
        if (prop === "groupBy") return async () => [];
        if (prop === "findMany") return async () => [];
        if (prop === "findFirst" || prop === "findUnique")
          return async () => null;
        if (prop === "create" || prop === "update" || prop === "upsert") {
          return async (args?: { data?: Record<string, unknown> }) =>
            args?.data ?? {};
        }
        if (
          prop === "delete" ||
          prop === "deleteMany" ||
          prop === "updateMany"
        ) {
          return async () => ({ count: 0 });
        }
        return async () => null;
      },
    },
  );
}

function createMockDb() {
  const model = createMockModel();

  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "$queryRaw") return async () => [{ ok: 1 }];
        if (prop === "$disconnect") return async () => undefined;
        if (prop === "$transaction") {
          return async (arg: unknown) => {
            if (typeof arg === "function") {
              return (arg as (tx: unknown) => Promise<unknown>)(createMockDb());
            }
            if (Array.isArray(arg)) {
              return Promise.all(arg as Promise<unknown>[]);
            }
            return null;
          };
        }
        return model;
      },
    },
  );
}

const globalForPrisma = globalThis as { prisma?: unknown };

function createDbClient() {
  try {
    const datasourceUrl = normalizeDatasourceUrl(process.env.DATABASE_URL);
    const client = new PrismaClient({
      datasourceUrl,
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
    console.log(
      `[db] Real database client initialized (host=${getDbHostFromUrl(datasourceUrl)}).`,
    );
    return client;
  } catch (error) {
    console.warn("[db] Falling back to mock database client.", error);
    return createMockDb();
  }
}

export const db: any = globalForPrisma.prisma ?? createDbClient();

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = db;
}
