export function normalizeEmail(value?: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

export function normalizePhone(value?: string | null): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";

  const plusPrefixed = raw.startsWith("+");
  const digitsOnly = raw.replace(/[^0-9]/g, "");
  if (!digitsOnly) return "";

  if (plusPrefixed) {
    return `+${digitsOnly}`;
  }

  // Bangladesh-friendly normalization defaults.
  if (digitsOnly.startsWith("880") && digitsOnly.length >= 12) {
    return `+${digitsOnly}`;
  }

  if (digitsOnly.startsWith("0") && digitsOnly.length === 11) {
    return `+88${digitsOnly}`;
  }

  if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    return `+${digitsOnly}`;
  }

  return "";
}

export function normalizeIdentifier(input: {
  email?: string | null;
  phone?: string | null;
}) {
  return {
    email: normalizeEmail(input.email),
    phone: normalizePhone(input.phone),
  };
}

export function obfuscatePhone(phone?: string | null) {
  if (!phone) return "";
  const normalized = normalizePhone(phone);
  if (!normalized) return "";
  const tail = normalized.slice(-4);
  return `${"*".repeat(Math.max(0, normalized.length - 4))}${tail}`;
}
