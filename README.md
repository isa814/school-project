# Ansar Ruhul Islam School Portal

Public website and role-based school portal for Ansar Ruhul Islam Nursery, Primary & Secondary School, Lagos.
Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, PostgreSQL, Prisma, NextAuth (credentials, JWT), Zod, React Hook Form, Recharts, pdf-lib and Paystack (test mode).

Brand colours were extracted from the school crest: navy `#0235A4`, sky `#7EACEB`, gold accent `#D4A150`.

## Status

This is a working MVP demo. Build steps 1–8 of the build prompt are implemented. Steps 9–12 are partly done; see **Gaps** below.

Verified in this environment:

- `npm run build` passes (type-check, lint and static generation).
- Sign-in works for admin (super admin, principal, accountant), teacher and student accounts.
- Every admin, teacher and student page returns 200 for the right role. Cross-role access redirects (for example, a student opening `/admin`, or an accountant opening `/admin/results`).
- Student report card PDF and payment receipt PDF generate.
- Guardian View: the PIN gate unlocks with the demo PIN and shows the student's summary.
- Paystack: payment initialisation shows a readable error with placeholder keys. The webhook rejects requests with a bad or missing signature (401). A correctly signed `charge.success` confirms the payment once, and a replay returns `ALREADY_PROCESSED` (idempotent). The invoice then moves to PAID.

Not yet verified end to end: score approval across teacher and admin, student creation and admission approval, live Paystack transactions, CSV exports, and mobile layout.

## Quick start

Requirements: Node 20+, a PostgreSQL 14+ database (or the bundled embedded Postgres script below).

```bash
npm install --legacy-peer-deps        # the flag is required: next@14 peer ranges
cp .env.example .env.local            # then fill in the values below
npx prisma migrate dev                # creates the schema
npm run seed                          # wipes and reseeds demo data (never run in production)
npm run dev                           # http://localhost:3000
```

Local database without Docker: `node scripts/pg-local.mjs` starts an embedded PostgreSQL on `localhost:5432` (database `ansar_ruhul`).

### Environment variables

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | Public base URL of the site (used for callbacks and metadata) |
| `NEXTAUTH_SECRET` | Signs NextAuth JWTs and Guardian View tokens. Use a long random value in production |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (test `sk_test_…` for the demo, live `sk_live_…` for production) |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key |

## Demo logins

Password for every account: `Demo@1234` (users must change it after first sign-in in a real deployment).

| Role | Email |
| --- | --- |
| Super admin | `admin@ansarruhul.demo` |
| Principal | `principal@ansarruhul.demo` |
| Accountant | `accountant@ansarruhul.demo` |
| Teacher | `teacher1@ansarruhul.demo` … `teacher8@ansarruhul.demo` |
| Student | `student01@ansarruhul.demo` … `student60@ansarruhul.demo` |

Guardian View PIN for demo students: `1234`. Parents have no accounts. They use the student's Guardian PIN (or family access code for the forum).

## Structure

- `src/app/(public)/` public website: home, about, academics, teachers, admissions (apply and status), news, gallery, contact, policies, forum, privacy, terms.
- `src/app/(auth)/login` sign-in.
- `src/app/admin/` admin portal: dashboard, students, staff, academics, admissions, fees (invoices, outstanding balances), results approval, announcements, forum moderation, users and security, reports, settings.
- `src/app/teacher/` teacher portal: attendance, score entry and submission, materials, my students, timetable.
- `src/app/student/` student portal: home, timetable, attendance, assignments, results (with report card), fees and receipts (Paystack), Guardian View, profile and password change.
- `src/app/actions/` server actions. Every mutation checks permissions and validates input with Zod.
- `src/app/api/` webhooks/paystack (HMAC-SHA512 signature check), receipts, report-cards, exports.
- `src/lib/services/` business logic: fees, Paystack, grading, attendance, scores, PDFs, students, admissions, communications.
- `src/lib/permissions.ts` the permission matrix per admin sub-role.
- `prisma/schema.prisma` data model. Money is stored as integer kobo. Keys are UUIDs. Students and staff are soft-deleted. Payments are never hard-deleted; they are voided with a reversal.

## Deployment notes

1. Provision PostgreSQL and set `DATABASE_URL`. Run `npx prisma migrate deploy` (not `migrate dev`).
2. Do not run `npm run seed` in production. It wipes data.
3. Set `NEXTAUTH_URL` to the public HTTPS origin. Session and Guardian cookies are `secure` in production, so HTTPS is required.
4. Set `NEXTAUTH_SECRET`, and switch to live Paystack keys only after the test-mode flow has been signed off.
5. In the Paystack dashboard, set the webhook URL to `https://<domain>/api/webhooks/paystack`.
6. Replace the placeholder content listed below before publishing.
7. Build with `npm run build` and run with `npm start`, or deploy to any Node host that supports Next.js 14.

## Gaps and known limitations

Steps 9–12 are partial:

- **Notifications and email/SMS:** the mailer and SMS sender are console implementations. No provider is configured.
- **Reports and analytics:** the reports page and CSV exports exist, but have not been checked against real data volumes.
- **Hardening:** the rate limiter, login lockout and audit log need review for a multi-instance deployment. Security headers and a full CSP are not configured.
- **Accessibility and mobile:** the design has been reviewed visually at desktop width only. A full WCAG AA audit has not been done.
- **Automated tests:** none beyond type-check and build. Vitest is installed but no suites are written.

Known issues to fix before real use:

- Invoice and receipt numbers are timestamp-based and not collision-proof. Use a database sequence.
- The Paystack return page (`/student/fees/callback`) writes to the database while rendering. It is idempotent, but the webhook is the reliable path. Move the verification into a route handler.
- Abandoned card attempts leave `PENDING` payment rows. Expire them after a set time.
- Subject assignment (`assignSubjectAction`) checks for an existing row and then writes. There is no database unique constraint on subject, class and section, so a race could create duplicates. Add a unique index with a non-null section key.
- The student dashboard works out the weekday from server time with a fixed UTC+1 offset (Lagos has no DST). Revisit if the app is hosted elsewhere.
- Guardian View uses a stateless signed cookie for 30 minutes. There is no server-side revocation other than the Lock button.

Placeholder content to replace before publishing:

- Footer and contact details (`+234 800 000 0000`, `info@ansarruhul.demo`), and the map.
- Gallery images and policy PDFs.
- Home page "15+ years" stat and tagline, and the testimonials.
- About page history and principal's message.
- Admissions fee table and dates, and the facilities list.
- Seed news bodies and the demo announcements.
