import * as bcrypt from "bcryptjs";

type ProvisionRole = "TEACHER" | "STUDENT" | "PARENT";

interface ProvisionInput {
  tx: any;
  institutionId: string;
  role: ProvisionRole;
  email: string;
  displayName: string;
  passwordSeed: string;
}

export interface ProvisionedCredential {
  email: string;
  password: string;
  role: ProvisionRole;
}

interface ProvisionResult {
  userId: string;
  credential: ProvisionedCredential | null;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function buildStarterPassword(seed: string) {
  const normalizedSeed = seed.trim().replace(/\s+/g, "").slice(0, 18) || "scholaops";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${normalizedSeed}@${suffix}`;
}

export async function provisionRoleUser(input: ProvisionInput): Promise<ProvisionResult> {
  const email = normalizeEmail(input.email);
  const existing = await input.tx.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: {
      id: true,
      role: true,
      institutionId: true,
      password: true,
    },
  });

  if (existing) {
    if (existing.institutionId !== input.institutionId) {
      throw new Error(`Email ${email} already belongs to another institution`);
    }

    if (existing.role !== input.role) {
      throw new Error(
        `Email ${email} is already linked to role ${existing.role}. Use a dedicated ${input.role.toLowerCase()} email.`,
      );
    }

    if (existing.password) {
      return { userId: existing.id, credential: null };
    }

    const generatedPassword = buildStarterPassword(input.passwordSeed);
    const hash = await bcrypt.hash(generatedPassword, 12);

      await input.tx.user.update({
        where: { id: existing.id },
        data: {
          password: hash,
          isActive: true,
          approvalStatus: "APPROVED",
          emailVerified: new Date(),
        },
      });

    return {
      userId: existing.id,
      credential: {
        email,
        password: generatedPassword,
        role: input.role,
      },
    };
  }

  const generatedPassword = buildStarterPassword(input.passwordSeed);
  const hash = await bcrypt.hash(generatedPassword, 12);
  const created = await input.tx.user.create({
    data: {
      name: input.displayName,
      email,
      password: hash,
      role: input.role,
      isActive: true,
      approvalStatus: "APPROVED",
      emailVerified: new Date(),
      institutionId: input.institutionId,
    },
    select: { id: true },
  });

  return {
    userId: created.id,
    credential: {
      email,
      password: generatedPassword,
      role: input.role,
    },
  };
}
