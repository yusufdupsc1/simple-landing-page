import { PrismaClient } from "@prisma/client";

function createMockModel() {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "count") return async () => 0;
        if (prop === "aggregate") return async () => ({ _sum: { amount: 0 }, _count: 0 });
        if (prop === "groupBy") return async () => [];
        if (prop === "findMany") return async () => [];
        if (prop === "findFirst" || prop === "findUnique") return async () => null;
        if (prop === "create" || prop === "update" || prop === "upsert") {
          return async (args?: { data?: Record<string, unknown> }) => args?.data ?? {};
        }
        if (prop === "delete" || prop === "deleteMany" || prop === "updateMany") {
          return async () => ({ count: 0 });
        }
        return async () => null;
      },
    }
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
    }
  );
}

const globalForPrisma = globalThis as { prisma?: unknown };

function createDbClient() {
  try {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
    console.log("[db] Real database client initialized.");
    return client;
  } catch (error) {
    console.warn("[db] Falling back to mock database client.", error);
    return createMockDb();
  }
}

export const db: any = globalForPrisma.prisma ?? createDbClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
