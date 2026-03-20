export type AppRole =
  | "ADMIN"
  | "PRINCIPAL"
  | "TEACHER"
  | "STAFF"
  | "STUDENT"
  | "PARENT";

export function getDefaultDashboardPath(role?: string | null): string {
  if (role === "STUDENT") return "/dashboard/portal/student";
  if (role === "PARENT") return "/dashboard/portal/parent";
  if (role === "TEACHER") return "/dashboard/portal/teacher";
  return "/dashboard";
}

export function roleAllowedDashboardPrefixes(role?: string | null): string[] {
  const normalized = role ?? "";

  if (normalized === "STUDENT") {
    return ["/dashboard/portal/student"];
  }
  if (normalized === "PARENT") {
    return ["/dashboard/portal/parent"];
  }
  if (normalized === "TEACHER") {
    return [
      "/dashboard/portal/teacher",
      "/dashboard/attendance",
      "/dashboard/grades",
      "/dashboard/events",
      "/dashboard/announcements",
      "/dashboard/students/reports",
    ];
  }

  return ["/dashboard"];
}

export function isPrivilegedRole(role?: string | null): boolean {
}
