import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import * as bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const AUTH_SECRETS = [
  process.env.AUTH_SECRET,
  process.env.NEXTAUTH_SECRET,
].filter((secret): secret is string => Boolean(secret));

const providers: any[] = [
  Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email;
      const password = credentials?.password;

      if (
        !email ||
        !password ||
        typeof email !== "string" ||
        typeof password !== "string"
      ) {
        return null;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await db.user.findUnique({
        where: { email: normalizedEmail },
        include: { institution: { select: { name: true, slug: true } } },
      });

      if (!user?.password || !user.isActive) {
        return null;
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return null;
      }

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
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

const authConfig: any = {
  secret: AUTH_SECRETS.length > 1 ? AUTH_SECRETS : AUTH_SECRETS[0],
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const typedUser = user as {
          role?: string;
          institutionId?: string;
          institutionName?: string;
          institutionSlug?: string;
        };

        (token as any).role = typedUser.role;
        (token as any).institutionId = typedUser.institutionId;
        (token as any).institutionName = typedUser.institutionName;
        (token as any).institutionSlug = typedUser.institutionSlug;
      }

      if (!(token as any).institutionId && token.email) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email },
          include: { institution: { select: { name: true, slug: true } } },
        });

        if (dbUser) {
          (token as any).role = dbUser.role;
          (token as any).institutionId = dbUser.institutionId;
          (token as any).institutionName = dbUser.institution.name;
          (token as any).institutionSlug = dbUser.institution.slug;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub;
        (session.user as { role?: string }).role = (token as any)
          .role as string;
        (session.user as { institutionId?: string }).institutionId = (
          token as any
        ).institutionId as string;
        (session.user as { institutionName?: string }).institutionName = (
          token as any
        ).institutionName as string;
        (session.user as { institutionSlug?: string }).institutionSlug = (
          token as any
        ).institutionSlug as string;
      }
      return session;
    },
  },
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);
