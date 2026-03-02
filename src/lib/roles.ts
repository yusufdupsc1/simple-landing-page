export function normalizeRole(role?: string | null): string {
  return (role ?? "").trim().toUpperCase();
}

export function toLegacyRole(role?: string | null): string {
  const normalized = normalizeRole(role);
  if (normalized === "HEAD_TEACHER") return "PRINCIPAL";
  if (normalized === "CLASS_TEACHER") return "TEACHER";
  if (normalized === "OFFICE_STAFF") return "STAFF";
  return normalized;
}

export function isPrivilegedRoleAlias(role?: string | null): boolean {
  const legacy = toLegacyRole(role);
  return ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(legacy);
}

export function isClassTeacherAlias(role?: string | null): boolean {
  return toLegacyRole(role) === "TEACHER";
}

export function isOfficeStaffAlias(role?: string | null): boolean {
  return toLegacyRole(role) === "STAFF";
}
