import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import * as bcrypt from "bcryptjs";

export const runtime = "nodejs";

// Simple demo users
const DEMO_USERS = [
  { email: "admin@school.edu", password: "admin123", name: "Admin", role: "ADMIN" },
  { email: "principal@school.edu", password: "principal123", name: "Principal", role: "PRINCIPAL" },
  { email: "teacher@school.edu", password: "teacher123", name: "Teacher", role: "TEACHER" },
  { email: "student@school.edu", password: "student123", name: "Student", role: "STUDENT" },
  { email: "parent@school.edu", password: "parent123", name: "Parent", role: "PARENT" },
];

async function setupDemoUser(email: string, password: string, name: string, role: string) {
  // Ensure institution exists
  const institution = await db.institution.upsert({
    where: { slug: "bd-gps" },
    update: { isActive: true },
    create: {
      slug: "bd-gps",
      name: "BD-GPS Demo School",
      email: "admin@school.edu",
      city: "Dhaka",
      country: "BD",
      timezone: "Asia/Dhaka",
      currency: "BDT",
      isActive: true,
    },
  });

  // Hash password and create/update user
  const hashed = await bcrypt.hash(password, 12);
  const user = await db.user.upsert({
    where: { email },
    update: { password: hashed, role, name, isActive: true, approvalStatus: "APPROVED", institutionId: institution.id },
    create: { email, password: hashed, role, name, isActive: true, approvalStatus: "APPROVED", institutionId: institution.id, emailVerified: new Date() },
  });

  return { ...user, institution: { name: institution.name, slug: institution.slug } };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  providers: [
    Credentials({
      name: "Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.trim().toLowerCase();
        const password = credentials?.password as string;

        if (!email || !password) return null;

        const demo = DEMO_USERS.find(u => u.email === email && u.password === password);
        if (!demo) return null;

        try {
          const user = await setupDemoUser(demo.email, demo.password, demo.name, demo.role);
          return { id: user.id, email: user.email, name: user.name, role: user.role, institutionId: user.institutionId, institutionName: "BD-GPS Demo School", institutionSlug: "bd-gps" };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).role = (user as any).role;
        (token as any).institutionId = (user as any).institutionId;
        (token as any).institutionName = (user as any).institutionName;
        (token as any).institutionSlug = (user as any).institutionSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = (token as any).role;
        (session.user as any).institutionId = (token as any).institutionId;
        (session.user as any).institutionName = (token as any).institutionName;
        (session.user as any).institutionSlug = (token as any).institutionSlug;
      }
      return session;
    },
  },
});
