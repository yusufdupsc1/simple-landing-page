export const PRIMARY_GRADES = ["PP", "1", "2", "3", "4", "5"] as const;
export const STANDARD_GRADES = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
] as const;

export function isGovtPrimaryModeEnabled(): boolean {
  const raw =
    process.env.GOVT_PRIMARY_MODE ??
    process.env.NEXT_PUBLIC_GOVT_PRIMARY_MODE ??
    "true";

  return raw === "true";
}

export function isPrimaryGrade(value?: string | null): boolean {
  const normalized = normalizeGradeValue(value);
  if (!normalized) return false;
  return PRIMARY_GRADES.includes(normalized as (typeof PRIMARY_GRADES)[number]);
}

export function assertPrimaryGrade(value?: string | null): void {
  if (!isPrimaryGrade(value)) {
    throw new Error("Only Pre-Primary to Class 5 is supported in Govt Primary mode.");
  }
}

export function normalizeGradeValue(value?: string | null): string {
  if (typeof value !== "string") return "";
  const normalized = value.trim().toUpperCase();
  if (!normalized) return "";
  if (["PRE-PRIMARY", "PRE PRIMARY", "PREPRIMARY", "PP", "KG"].includes(normalized)) {
    return "PP";
  }
  if (/^\d+$/.test(normalized)) {
    return String(Number(normalized));
  }
  return normalized;
}

export function getAllowedGradeValues(): readonly string[] {
  return isGovtPrimaryModeEnabled() ? PRIMARY_GRADES : STANDARD_GRADES;
}

export function getPrimaryGradeOptions() {
  return PRIMARY_GRADES.map((grade) => ({
    grade,
    labelBn: grade === "PP" ? "প্রাক-প্রাথমিক" : `শ্রেণি ${grade}`,
    labelEn: grade === "PP" ? "Pre-Primary" : `Class ${grade}`,
  }));
}

export function getGradeOptions() {
  const source = getAllowedGradeValues();
  return source.map((grade) => ({
    grade,
    labelBn: grade === "PP" ? "প্রাক-প্রাথমিক" : `শ্রেণি ${grade}`,
    labelEn: grade === "PP" ? "Pre-Primary" : `Class ${grade}`,
  }));
}
