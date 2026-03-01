export const LOGIN_SCOPES = ["ADMIN", "TEACHER", "STUDENT", "PARENT"] as const;

export type LoginScope = (typeof LOGIN_SCOPES)[number];

export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "STAFF"] as const;
export const REVIEWER_ROLES = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"] as const;

export function normalizeScope(value?: string | null): LoginScope {
  const normalized = (value ?? "").trim().toUpperCase();
  if (LOGIN_SCOPES.includes(normalized as LoginScope)) {
    return normalized as LoginScope;
  }
  return "ADMIN";
}

export function roleWhereForScope(scope: LoginScope) {
  if (scope === "ADMIN") {
    return { in: [...ADMIN_ROLES] } as const;
  }
  return { equals: scope } as const;
}

export function isReviewerRole(role?: string | null): boolean {
  return REVIEWER_ROLES.includes((role ?? "") as (typeof REVIEWER_ROLES)[number]);
}

export function roleForScope(scope: Exclude<LoginScope, "ADMIN">) {
  return scope;
}
