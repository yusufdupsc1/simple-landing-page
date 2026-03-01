import type { Role } from "@prisma/client";

export type PermissionAction = "read" | "create" | "update" | "delete" | "manage";

export type PermissionResource =
  | "students"
  | "teachers"
  | "classes"
  | "attendance"
  | "grades"
  | "finance"
  | "events"
  | "announcements"
  | "settings"
  | "security"
  | "realtime"
  | "push";

type PermissionMap = Record<PermissionResource, PermissionAction[]>;

const ADMIN_FULL: PermissionMap = {
  students: ["read", "create", "update", "delete", "manage"],
  teachers: ["read", "create", "update", "delete", "manage"],
  classes: ["read", "create", "update", "delete", "manage"],
  attendance: ["read", "create", "update", "manage"],
  grades: ["read", "create", "update", "delete", "manage"],
  finance: ["read", "create", "update", "delete", "manage"],
  events: ["read", "create", "update", "delete", "manage"],
  announcements: ["read", "create", "update", "delete", "manage"],
  settings: ["read", "update", "manage"],
  security: ["read", "update", "manage"],
  realtime: ["read"],
  push: ["create", "read"],
};

const TEACHER_PERMISSIONS: PermissionMap = {
  students: ["read"],
  teachers: ["read"],
  classes: ["read"],
  attendance: ["read", "create", "update"],
  grades: ["read", "create", "update", "delete"],
  finance: ["read"],
  events: ["read", "create", "update"],
  announcements: ["read", "create"],
  settings: ["read"],
  security: ["read"],
  realtime: ["read"],
  push: ["create", "read"],
};

const STAFF_PERMISSIONS: PermissionMap = {
  students: ["read"],
  teachers: ["read"],
  classes: ["read"],
  attendance: ["read"],
  grades: ["read"],
  finance: ["read"],
  events: ["read"],
  announcements: ["read"],
  settings: ["read"],
  security: ["read"],
  realtime: ["read"],
  push: ["create", "read"],
};

const STUDENT_PARENT_PERMISSIONS: PermissionMap = {
  students: [],
  teachers: [],
  classes: [],
  attendance: [],
  grades: [],
  finance: [],
  events: [],
  announcements: [],
  settings: [],
  security: [],
  realtime: [],
  push: [],
};

const POLICIES: Record<Role, PermissionMap> = {
  SUPER_ADMIN: ADMIN_FULL,
  ADMIN: ADMIN_FULL,
  PRINCIPAL: ADMIN_FULL,
  TEACHER: TEACHER_PERMISSIONS,
  STAFF: STAFF_PERMISSIONS,
  STUDENT: STUDENT_PARENT_PERMISSIONS,
  PARENT: STUDENT_PARENT_PERMISSIONS,
};

export function can(
  role: Role | string | undefined,
  resource: PermissionResource,
  action: PermissionAction,
): boolean {
  if (!role) return false;
  const policy = POLICIES[role as Role];
  if (!policy) return false;
  return policy[resource]?.includes(action) ?? false;
}

export function isPrivilegedRole(role: Role | string | undefined): boolean {
  return ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(role ?? "");
}
