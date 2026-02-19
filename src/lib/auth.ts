// src/lib/auth.ts
// Auth.js v5 (next-auth@5) — Credentials + OAuth

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcryptjs from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = CredentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email },
          include: { institution: true },
        });

        if (!user || !user.password || !user.isActive) return null;

        const valid = await bcryptjs.compare(password, user.password);
        if (!valid) return null;

        // Update last login
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          institutionId: user.institutionId,
          institutionName: user.institution.name,
          institutionSlug: user.institution.slug,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.institutionId = (user as any).institutionId;
        token.institutionName = (user as any).institutionName;
        token.institutionSlug = (user as any).institutionSlug;
      }
      if (trigger === "update" && session) {
        return { ...token, ...session.user };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          institutionId: token.institutionId as string,
          institutionName: token.institutionName as string,
          institutionSlug: token.institutionSlug as string,
        },
      };
    },
  },
  events: {
    async signOut({ token }) {
      // Clean up any active sessions if needed
    },
  },
});
