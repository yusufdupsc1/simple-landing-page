# scholaOps 🏫

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.4-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/PostgreSQL-15+-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Prisma-5.6-2D3748?style=for-the-badge" alt="Prisma">
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwind-css" alt="Tailwind">
  <img src="https://img.shields.io/badge/Stripe-5.17-635BFF?style=for-the-badge&logo=stripe" alt="Stripe">
</p>

<p align="center">
  Production-grade school management SaaS for modern educational institutions
</p>

---

## ✨ Features

### Core Management

- **Multi-tenant Architecture** - Multiple institutions can run on the same instance with complete data isolation
- **Role-based Access Control** - Granular permissions for Admin, Teacher, Student, and Parent roles
- **Real-time Attendance** - Track student attendance with instant updates
- **Grade Management** - Comprehensive grade book with GPA calculations
- **Fee Management** - Automated fee collection with Stripe integration

### Academic Features

- **Class Management** - Organize students into classes and subjects
- **Teacher Portal** - Dedicated interface for teachers to manage their classes
- **Student Portal** - Students can view their grades, attendance, and fees
- **Parent Portal** - Parents can monitor their children's progress
- **Timetable** - Interactive class scheduling system

### Administrative Features

- **Analytics Dashboard** - Real-time insights with interactive charts
- **Announcements** - System-wide and class-specific announcements
- **Event Calendar** - School events and important dates
- **Finance Tracking** - Complete financial overview with audit logs

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Web App   │  │  Mobile PWA │  │   Admin Dashboard       │ │
│  │  (Next.js)  │  │   (Next)   │  │   (Next.js)             │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
└─────────┼────────────────┼──────────────────────┼───────────────┘
          │                │                      │
          └────────────────┴──────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Next.js    │
                    │  Middleware │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐   ┌──────▼──────┐  ┌─────▼─────┐
    │  Auth     │   │  Server     │  │   API      │
    │  (NextAuth│   │  Actions    │  │   Routes   │
    │   v5)     │   │  (Zod)      │  │            │
    └─────┬─────┘   └──────┬──────┘  └─────┬─────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Business   │
                    │   Logic     │
                    └──────┬──────┘
                           │
    ┌───────────────────────┼───────────────────────┐
    │                       │                       │
┌───▼───┐           ┌──────▼──────┐        ┌─────▼─────┐
│  DB   │           │   Redis     │        │  External  │
│(Prisma)│           │  (Upstash) │        │  Services  │
│ Postgres│           │  Rate Limit │        │  Stripe    │
└────────┘           └─────────────┘        │  Upload    │
                                             │  Thing     │
                                             └───────────┘
```

### Tech Stack

| Layer            | Technology                     | Version |
| ---------------- | ------------------------------ | ------- |
| Framework        | Next.js                        | 16.x    |
| Language         | TypeScript                     | 5.4.x   |
| Database         | PostgreSQL                     | 15+     |
| ORM              | Prisma                         | 5.x     |
| Authentication   | NextAuth.js                    | v5 Beta |
| Styling          | Tailwind CSS                   | 3.4.x   |
| State Management | React Server Components + Nuqs |
| Payments         | Stripe                         | SDK v17 |
| File Storage     | UploadThing                    | v7      |
| Testing          | Vitest + Playwright            | Latest  |
| Containerization | Docker                         | Latest  |

---

## 📁 Project Structure

```
scholaOps/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts             # Database seeding
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/            # API routes
│   │   │   ├── auth/       # NextAuth endpoints
│   │   │   ├── csrf/      # CSRF protection
│   │   │   ├── uploadthing/ # File uploads
│   │   │   └── webhooks/   # Stripe webhooks
│   │   ├── auth/           # Authentication pages
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   └── dashboard/      # Protected dashboard
│   │       ├── analytics/
│   │       ├── announcements/
│   │       ├── attendance/
│   │       ├── classes/
│   │       ├── events/
│   │       ├── finance/
│   │       ├── grades/
│   │       ├── portal/     # Student/Parent portals
│   │       ├── settings/
│   │       ├── students/
│   │       ├── teachers/
│   │       └── timetable/
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   └── */             # Feature components
│   ├── lib/               # Core utilities
│   │   ├── auth.ts        # NextAuth configuration
│   │   ├── db.ts          # Prisma client
│   │   ├── env.ts         # Environment validation
│   │   ├── email.ts       # Email service
│   │   └── utils.ts       # Utility functions
│   ├── server/            # Server-side code
│   │   └── actions/       # Server Actions
│   └── styles/            # Global styles
├── tests/                 # Test suites
│   ├── unit/             # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/              # E2E tests
├── docker-compose.yml     # Local development
├── vitest.config.ts       # Test configuration
└── playwright.config.ts   # E2E configuration
```

---

## 🔐 Security Architecture

### Authentication Flow

```
User Login → Credentials → NextAuth (JWT) → Session Token → Protected Routes
                                                              ↓
                                              Middleware (Token Verification)
                                                              ↓
                                              Role-based Access Control
```

### Security Measures

- **CSRF Protection**: Custom CSRF middleware with token validation
- **Rate Limiting**: Redis-based rate limiting (100 req/15min per IP)
- **Input Validation**: Zod schemas on all server actions
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Prevention**: Content Security Policy headers
- **Data Isolation**: Row-level security via institution ID

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22.x or later
- PostgreSQL 15+
- Redis (optional, for rate limiting)
- Stripe Account (for payments)
- UploadThing Account (for file storage)

### Installation

```bash
# Clone the repository
git clone https://github.com/yusufdupsc1/scholaOps.git
cd scholaOps

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Configure your .env file (see Environment Variables section)

# Initialize database
pnpm db:push

# Seed the database (optional - creates demo data)
pnpm db:seed

# Start development server
pnpm dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/scholaOps"

# NextAuth
AUTH_SECRET="your-secret-key-min-32-chars"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

# Stripe
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""

# UploadThing
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Run all tests with coverage
pnpm test:coverage
```

---

## 📊 API Reference

### Server Actions

| Action                | Description                 | Auth Required |
| --------------------- | --------------------------- | ------------- |
| `login`               | Authenticate user           | No            |
| `registerInstitution` | Create new institution      | No            |
| `createStudent`       | Add new student             | Admin         |
| `createTeacher`       | Add new teacher             | Admin         |
| `markAttendance`      | Record attendance           | Teacher       |
| `createGrade`         | Add student grade           | Teacher       |
| `createFee`           | Create fee invoice          | Admin         |
| `createCheckout`      | Initialize Stripe payment   | Auth          |
| `updateSettings`      | Update institution settings | Admin         |

---

## 🔧 Development Challenges & Solutions

### Challenge 1: Next.js 16 Build Errors

**Problem**: Initial build failed due to deprecated config options and missing types.

**Solution**:

- Removed `ppr` and invalid `eslint` config from `next.config.ts`
- Fixed TypeScript strict mode issues in server actions
- Added proper type definitions for `ActionResult` discriminated unions

### Challenge 2: UploadThing v7 API Changes

**Problem**: `createNextRouteHandler` no longer exists in v7.

**Solution**:

```typescript
// Old (v6)
import { createNextRouteHandler } from "uploadthing/next";

// New (v7)
import { createRouteHandler } from "uploadthing/next";
export const { GET, POST } = createRouteHandler({ router: ourFileRouter });
```

### Challenge 3: Stripe API Version Mismatch

**Problem**: Stripe SDK required specific API version that didn't match installed version.

**Solution**: Updated API version to `"2025-02-24.acacia"` (latest at time of development)

### Challenge 4: React Hydration Errors

**Problem**: CSS animations caused hydration mismatches.

**Solution**: Removed client-side animation classes that differ between server/client renders, or use `suppressHydrationWarning`.

### Challenge 5: Auth.js CSRF in Development

**Problem**: CSRF token errors during local development.

**Solution**: NextAuth v5 handles CSRF automatically for Server Actions. Simplified CSRF middleware to avoid unnecessary complexity in development.

---

## 📈 Performance Optimizations

### Implemented

- **Static Generation**: Static pages for auth, terms, privacy
- **Server Components**: Default RSC for reduced client bundle
- **Image Optimization**: Next.js Image component with AVIF/WebP
- **Database Indexing**: Indexes on frequently queried fields
- **Query Optimization**: Prisma `include` and `select` for minimal data transfer

### Recommended for Production

- Edge caching with Vercel ISR
- Database connection pooling with PgBouncer
- CDN for static assets
- Redis caching for frequently accessed data

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - The React Framework
- [Prisma](https://prisma.io) - Next-generation ORM
- [Tailwind CSS](https://tailwindcss.com) - A utility-first CSS framework
- [NextAuth.js](https://next-auth.js.org) - Authentication for Next.js
- [Stripe](https://stripe.com) - Payment infrastructure
- [UploadThing](https://uploadthing.com) - File uploads made easy

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/yusufdupsc1">yusufdupsc1</a>
</p>
