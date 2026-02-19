import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createAuthToken } from '@/lib/session';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').transform((value) => value.toLowerCase()),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72),
});

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor?.split(',')[0]?.trim() || 'unknown-client';
    const rate = checkRateLimit(`login:${clientIp}`, Number(process.env.AUTH_RATE_LIMIT_MAX ?? 10), Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 60_000));

    if (!rate.allowed) {
      return NextResponse.json({ error: 'Too many login attempts. Please try again shortly.' }, { status: 429 });
    }

    const payload = await request.json();
    const parsedPayload = authSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return NextResponse.json(
        { error: parsedPayload.error.issues[0]?.message ?? 'Invalid login payload' },
        { status: 400 }
      );
    }

    const { email, password } = parsedPayload.data;

    let user = await prisma.user.findUnique({
      where: { email },
      include: { school: true },
    });

    if (!user) {
      const demoEmail = (process.env.DEMO_ADMIN_EMAIL ?? 'admin@eskooly.com').toLowerCase();
      const demoPassword = process.env.DEMO_ADMIN_PASSWORD ?? 'admin123';
      const allowBootstrap = process.env.NODE_ENV !== 'production';
      const canBootstrapDemoAdmin = email === demoEmail && password === demoPassword;

      if (!allowBootstrap || !canBootstrapDemoAdmin) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      let school = await prisma.school.findFirst();

      if (!school) {
        school = await prisma.school.create({
          data: {
            name: 'eSkooly International School',
            alias: `eskooly-${Date.now()}`,
          },
        });
      }

      const hashedPassword = await bcrypt.hash(demoPassword, 10);
      user = await prisma.user.upsert({
        where: { email: demoEmail },
        update: {
          password: hashedPassword,
          name: 'System Administrator',
          role: 'admin',
          schoolId: school.id,
        },
        create: {
          email: demoEmail,
          password: hashedPassword,
          name: 'System Administrator',
          role: 'admin',
          schoolId: school.id,
        },
        include: { school: true },
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = createAuthToken(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolName: user.school?.name,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Number(process.env.AUTH_SESSION_TTL_SECONDS ?? 60 * 60 * 12),
      path: '/',
    });

    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
