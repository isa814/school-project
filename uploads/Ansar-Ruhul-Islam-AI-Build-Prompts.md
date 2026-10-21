# Ansar-Ruhul Islam School Portal: Step-by-Step AI Build Prompts

Paste these into a coding AI (Claude Code, Cursor, Bolt, Lovable, Windsurf) **one at a time, in order**. Do not move to the next step until the current one runs without errors.

---

## Read this first (24-hour reality check)

In 24 hours an AI can realistically give you a **working, good-looking MVP demo**: public website, logins for Admin/Teacher/Student, core dashboards with seeded data, attendance, results, fee invoices, and Paystack in **test mode**. It cannot finish all 24 modules from the original PDF (library, hostel, transport, health, etc.). Show those as the "Phase 2 roadmap" to your boss. Bosses are far more impressed by 5 modules that work than 24 that are half-built.

**Before you start, have ready:**
- Your logo file (SVG or PNG with transparent background) and the exact hex codes of your sky blue and navy blue
- A Paystack **test** account (free, takes 5 minutes) for the test public/secret keys
- Node.js 20+ and PostgreSQL (or a free Neon / Supabase database URL)

**Suggested 24-hour plan**

| Hours | Steps | Result |
|---|---|---|
| 0 to 2 | Master prompt + Step 1 + Step 2 | Project, design system, database, demo data |
| 2 to 5 | Step 3 + Step 4 | Logins and public website |
| 5 to 10 | Step 5 + Step 6 + Step 7 | Admin, Teacher and Student portals |
| 10 to 15 | Step 8 | Fees and online payment (test mode) |
| 15 to 19 | Step 9 + Step 10 | Announcements, Parent Forum, analytics |
| 19 to 22 | Step 11 + Step 12 | Polish, deploy, demo data |
| 22 to 24 | Rehearse | Walk through the demo script at the bottom |

---

## MASTER CONTEXT PROMPT (paste this first, once)

```
You are a senior full-stack engineer. We are building "Ansar-Ruhul Islam School Portal", a production-quality school management website and portal for a high school in Lagos, Nigeria. I will give you the work in numbered steps. After each step, summarize what you built, list any commands I need to run, and wait for my next step. Never skip ahead.

PROJECT SUMMARY
A public school website (visible without login) plus secure portals for Admin staff, Teachers and Students. It handles student records, classes and subjects, attendance, exam results and report cards, school fees with online payment, announcements and a parent forum.

USER MODEL (important)
- There are exactly THREE login account types: ADMIN, TEACHER, STUDENT.
- ADMIN has sub-roles: SUPER_ADMIN, PRINCIPAL, VICE_PRINCIPAL, ACCOUNTANT, LIBRARIAN, NURSE, TRANSPORT_MANAGER. Permissions are enforced per sub-role.
- PARENTS DO NOT HAVE ACCOUNTS. Guardian details are stored on the Student record. Parents view their child's results, attendance and fees through a "Guardian View" inside the student's login, protected by a separate 4-digit Guardian PIN. Parents can also use a public Parent Forum with a family access code issued at admission.

TECH STACK (do not substitute)
- Next.js 14+ (App Router) with TypeScript, a single full-stack project
- Tailwind CSS + shadcn/ui components
- PostgreSQL with Prisma ORM
- Auth: NextAuth (Credentials provider) or Auth.js with JWT sessions, passwords hashed with bcrypt or argon2
- Payments: Paystack (test mode), verified server-side via webhook
- Validation: Zod. Forms: React Hook Form. Data fetching: server components and server actions where sensible
- PDF generation (report cards, receipts): @react-pdf/renderer or Puppeteer
- Charts: Recharts

BRAND AND DESIGN SYSTEM
- Primary colors: NAVY BLUE and SKY BLUE. Use these CSS variables and Tailwind theme colors:
  --navy: #0B1F4B (primary, headers, buttons, sidebar)
  --navy-deep: #07142F (dark surfaces, footer)
  --sky: #38BDF8 (accent, highlights, links, active states)
  --sky-soft: #E0F2FE (light backgrounds, cards, hover)
  --ink: #0F172A (body text)
  --surface: #FFFFFF and #F8FAFC (page backgrounds)
  If I provide a logo, extract the exact navy and sky blue from it and use those instead of the defaults above.
- Logo is at /public/logo.svg (or logo.png). Use it in the navbar, login pages, sidebar, favicon, and PDF letterheads.
- Style: clean, modern, trustworthy, generous whitespace, rounded-xl cards, subtle shadows, and a consistent 8px spacing scale. Headings in a refined serif or semi-bold display face (e.g. "Fraunces" or "Playfair Display"), body in a clean sans (e.g. "Inter" or "Plus Jakarta Sans"), loaded with next/font.
- Fully responsive, mobile-first (most parents and many staff use phones). Accessible: proper labels, focus states, WCAG AA contrast.
- Avoid generic template looks: no purple gradients, no stock emoji icons as the main visual language. Use lucide-react icons consistently.

CODE QUALITY RULES
- Strict TypeScript, no `any`. Zod validation on every server action and API route.
- Server-side authorization check (role + ownership) on EVERY data mutation and every protected page. Never trust the client.
- Use UUID primary keys. Soft-delete (deletedAt) students and staff. Never hard-delete payments; void them with a reversal record.
- Keep components small and reusable. Put business logic in /lib/services. Write a clear README.
- All money values stored as integers in kobo (Naira x 100). Display with Intl.NumberFormat("en-NG", {style:"currency", currency:"NGN"}).
- Seed realistic Nigerian demo data (names, classes like JSS1 to SS3, subjects like Mathematics, English, Basic Science, Arabic, Islamic Studies, Computer Studies).

Acknowledge you understand, then wait for Step 1.
```

---

## STEP 1: Project setup and design system

```
STEP 1: Project setup and design system.

1. Create the Next.js project (TypeScript, App Router, Tailwind, ESLint, src/ directory). Install shadcn/ui, lucide-react, zod, react-hook-form, @hookform/resolvers, recharts, prisma and @prisma/client, next-auth, bcryptjs.
2. Configure Tailwind theme with the navy and sky blue brand colors from the master prompt (extend colors: navy, navy-deep, sky, sky-soft, ink). Load the two fonts with next/font.
3. Create this folder structure:
   src/app/(public)/        public website pages
   src/app/(auth)/login/    login page
   src/app/admin/           admin portal
   src/app/teacher/         teacher portal
   src/app/student/         student portal
   src/app/api/             route handlers (webhooks, etc.)
   src/components/ui/       shadcn components
   src/components/shared/   Logo, Navbar, Footer, PageHeader, StatCard, DataTable, EmptyState
   src/lib/                 db.ts (prisma client), auth.ts, permissions.ts, utils.ts
   src/lib/services/        business logic per module
   prisma/                  schema.prisma and seed.ts
4. Build the shared components: Logo (uses /public/logo.svg), a responsive public Navbar, Footer (navy-deep background), StatCard, a reusable DataTable (search, sort, pagination), and a dashboard Sidebar layout that collapses to a drawer on mobile.
5. Create a .env.example listing: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, PAYSTACK_SECRET_KEY, NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, SMTP settings (placeholders).
6. Set up a temporary /design-preview page showing buttons, cards, inputs, a table and a stat card in the brand colors so I can approve the look.

Acceptance: `npm run dev` runs with no errors, and /design-preview looks polished on desktop and mobile. Summarize, then wait.
```

---

## STEP 2: Database schema and seed data

```
STEP 2: Database schema (Prisma) and seed data.

Create prisma/schema.prisma for PostgreSQL with these models (UUID ids, createdAt/updatedAt, soft-delete where noted):

AUTH AND PEOPLE
- User(id, email unique, passwordHash, role enum[ADMIN,TEACHER,STUDENT], adminRole enum? [SUPER_ADMIN,PRINCIPAL,VICE_PRINCIPAL,ACCOUNTANT,LIBRARIAN,NURSE,TRANSPORT_MANAGER], isActive, lastLoginAt)
- Student(id, userId unique, admissionNo unique, firstName, lastName, dob, gender, photoUrl, classId, sectionId, status enum[ACTIVE,GRADUATED,TRANSFERRED,SUSPENDED,WITHDRAWN], admissionDate, previousSchool, guardianPinHash, familyAccessCode unique, deletedAt)
- Guardian(id, studentId, name, relationship, phone, email, address, isPrimary)
- MedicalRecord(id, studentId, allergies, conditions, bloodGroup, emergencyContact)
- Staff(id, userId unique, staffNo unique, firstName, lastName, phone, qualification, departmentId, hireDate, status, deletedAt)

ACADEMICS
- AcademicSession(id, name, startDate, endDate, isCurrent)
- Term(id, sessionId, name, startDate, endDate, isCurrent)
- Class(id, name, level), Section(id, classId, name)
- Department(id, name), Subject(id, name, departmentId)
- SubjectAssignment(id, subjectId, classId, sectionId, teacherId(Staff))
- TimetableEntry(id, classId, sectionId, dayOfWeek, period, startTime, endTime, subjectId, teacherId)

ATTENDANCE AND RESULTS
- Attendance(id, studentId, date, status enum[PRESENT,ABSENT,LATE,EXCUSED], markedById, termId) unique(studentId, date)
- Score(id, studentId, subjectId, termId, caScore, examScore, total, grade, remark, status enum[DRAFT,SUBMITTED,APPROVED,LOCKED], enteredById, approvedById)
- GradeScale(id, minScore, maxScore, grade, remark)

FEES AND PAYMENTS
- FeeItem(id, classId, termId, name, type enum[TUITION,REGISTRATION,EXAM,UNIFORM,TRANSPORT,HOSTEL,OTHER], amountKobo)
- Invoice(id, studentId, termId, totalKobo, paidKobo, status enum[UNPAID,PARTIAL,PAID], dueDate)
- InvoiceLine(id, invoiceId, feeItemId, description, amountKobo)
- Payment(id, invoiceId, amountKobo, method enum[CARD,TRANSFER,USSD,CASH,POS], gatewayRef unique, status enum[PENDING,SUCCESS,FAILED,VOIDED], paidAt, recordedById, rawPayload Json?)
- Discount(id, studentId, termId, type, valueKobo or percent, reason)

COMMUNICATION AND PUBLIC SITE
- Announcement(id, title, body, audience enum[ALL,STAFF,STUDENTS,PARENTS,CLASS], classId?, createdById, publishedAt)
- ForumThread(id, title, body, familyAccessCode, authorName, status enum[PENDING,APPROVED,REJECTED]), ForumReply(id, threadId, body, authorName, status)
- NewsPost(id, title, slug, body, coverImage, publishedAt), Event(id, title, date, description, type)
- Admission application: AdmissionApplication(id, applicantName, dob, gender, classApplyingFor, guardianName, guardianPhone, guardianEmail, address, previousSchool, documents Json, status enum[SUBMITTED,UNDER_REVIEW,APPROVED,REJECTED], reference unique)
- ActivityLog(id, userId, action, entity, entityId, meta Json, ip, createdAt)

Then write prisma/seed.ts creating realistic demo data:
- 1 SUPER_ADMIN (admin@ansarruhul.demo), 1 PRINCIPAL, 1 ACCOUNTANT
- 8 teachers, 6 classes (JSS1 to SS3) each with arms A and B, 12 subjects, subject assignments and a timetable
- 60 students (Nigerian names, mix of genders) with guardians
- Current session "2026/2027", Term 1 current, a standard grade scale (A1 to F9 or A to F)
- 30 days of attendance, scores for the previous term, fee items per class, invoices (a mix of paid, partial, unpaid)
- 6 announcements, 4 news posts, 5 events
All demo accounts use the password `Demo@1234` (document this in the README). Add `npm run seed` and `npm run db:reset`.

Acceptance: `npx prisma migrate dev` and `npm run seed` succeed. Show me an ER summary and the demo logins. Then wait.
```

---

## STEP 3: Authentication and role-based access

```
STEP 3: Authentication and RBAC.

1. Implement Auth.js/NextAuth credentials login (email + password), JWT sessions, bcrypt verification. Rate-limit login attempts (5 failures per 15 minutes per email+IP) and record every login in ActivityLog.
2. Build ONE branded /login page (navy/sky split layout with the logo). After login, redirect by role: ADMIN to /admin, TEACHER to /teacher, STUDENT to /student.
3. Create src/lib/permissions.ts with a permission matrix per role and admin sub-role, for example:
   ACCOUNTANT: fees:*, payments:*, reports:finance
   PRINCIPAL / VICE_PRINCIPAL: read-all, results:approve, reports:*
   SUPER_ADMIN: everything
   TEACHER: attendance:own-classes, scores:own-subjects, assignments:own
   STUDENT: self-only read, fees:pay-own
   Export helpers: can(user, permission), requirePermission(permission) for server actions and pages.
4. Add Next.js middleware that blocks /admin, /teacher and /student for the wrong role and redirects unauthenticated users to /login.
5. Add "Forgot password" (token via email, stub the email sender with console logging for now) and a change-password page.
6. Add Student Guardian View gate: inside the student portal, a "Guardian View" button asks for the 4-digit Guardian PIN. On success, set a short-lived (30 min) guardian flag in the session. Guardian View is READ-ONLY and shows results, attendance, fee balance and announcements, and is the only place where "Pay fees" is offered to parents.
7. Write a few tests (Vitest) proving that a TEACHER cannot open an admin route, a STUDENT cannot read another student's data, and an ACCOUNTANT cannot edit scores.

Acceptance: I can log in as each demo role and land in the correct (still empty) dashboard, and wrong-role access is blocked. Then wait.
```

---

## STEP 4: Public website (the landing experience)

```
STEP 4: Public website. This is the first impression, so make it excellent.

Build these pages under src/app/(public)/ using the navy and sky blue brand, the logo, real-feeling copy for a Nigerian Islamic high school (clearly mark placeholder text with a TODO comment so I can replace it), and tasteful geometric patterns inspired by Islamic art (subtle, in sky-soft on navy).

1. Home: sticky navbar (logo, About, Academics, Admissions, News & Events, Contact, "Portal Login" button), hero with headline, two CTAs ("Apply for Admission", "Portal Login"), a stats strip (students, teachers, years of service, pass rate), a "Why choose us" section, subjects/resources preview, latest news and upcoming events (from the database), a testimonial section, a final admissions CTA, and a rich footer.
2. About Us: history, mission, vision, core values, leadership message, facilities and resources the school offers (library, laboratory, ICT lab, sports, mosque/prayer hall, hostel, transport).
3. Academics: levels (JSS and SS), subject list grouped by department (from the database), curriculum notes, assessment approach.
4. Our Teachers: public directory (name, subject, short bio, photo placeholder). No private data.
5. Admissions: requirements, process steps, fees overview, important dates, and the ONLINE APPLICATION FORM (multi-step: applicant details, guardian details, previous school, document upload, review and submit). Validate with Zod, add a honeypot field and basic rate limiting, generate an application reference like ARI-2026-00123, and show a success page. Add /admissions/status where an applicant enters their reference to see the status.
5. News & Events: listing and detail pages. Gallery: responsive grid with lightbox using placeholder images.
6. Contact Us: form that stores a message in the database, plus address, phone, email and an embedded map placeholder.
7. School Policies: list of downloadable documents (placeholders).
8. Parent Forum (public section): family access code entry, then view approved threads, post a thread or reply (goes to the moderation queue).

SEO: metadata and Open Graph per page, sitemap.xml, robots.txt, semantic HTML. Performance: next/image, lazy loading. 

Acceptance: all pages are responsive, look consistent, and the admission form saves to the database. Then wait.
```

---

## STEP 5: Admin portal (core management)

```
STEP 5: Admin portal.

Build /admin with the sidebar layout. Menu items are shown or hidden by role permissions.

1. Dashboard: stat cards (total students, teachers, classes, subjects), today's attendance summary (donut chart), fee collection summary for the current term (collected vs outstanding), upcoming events, recent activities (from ActivityLog), latest announcements, and Quick Actions buttons.
2. Students: searchable, filterable DataTable (class, status). Actions: add student (generates admission number, creates the STUDENT login with a temporary password, creates guardian record, generates family access code and Guardian PIN), edit, view full profile (tabs: Profile, Guardian, Medical, Attendance, Results, Fees, Documents), change status (active, graduated, transferred, suspended, withdrawn), promote class (bulk), CSV bulk import with a preview and validation errors, and photo upload.
3. Staff: add/edit/view teachers and staff, assign subjects and classes, create their login, staff status.
4. Academics: manage sessions, terms, classes, sections, departments, subjects, subject assignments, and a timetable editor (grid by class).
5. Admissions: review online applications, change status, and on APPROVE one-click convert the applicant into a Student record and generate an admission letter PDF with the school letterhead.
6. Users and Security: manage admin accounts and sub-roles, activate/deactivate accounts, reset passwords, view ActivityLog and login history.
7. Settings: school profile and logo, grading scale, fee structure link, notification placeholders.

Every list needs loading skeletons, empty states, and success/error toasts. Every mutation checks permissions server-side and writes to ActivityLog.

Acceptance: as SUPER_ADMIN I can add a student end-to-end and the student can then log in. Then wait.
```

---

## STEP 6: Teacher portal

```
STEP 6: Teacher portal at /teacher.

1. Dashboard: my classes and subjects, today's timetable, pending tasks (attendance not yet taken, scores not yet submitted), announcements.
2. Attendance: choose class + section + date, see a fast one-tap grid (Present, Absent, Late, Excused) with "Mark all present" and a Save button. Prevent editing outside allowed dates unless the user is an admin. Show the attendance percentage per student.
3. Scores: choose class + subject + term, a spreadsheet-style table to enter CA and Exam scores with live total, grade and remark calculated from GradeScale. Save as DRAFT, then "Submit for approval" (status SUBMITTED). Teachers cannot edit after APPROVED or LOCKED.
4. Assignments and materials: upload a file or link for a class and subject with a due date (add Assignment and Material models if missing).
5. My students: read-only performance view per class (averages, attendance, a trend chart).
6. Timetable: read-only weekly view.

Add to the Admin portal: a Results Approval screen for PRINCIPAL and VICE_PRINCIPAL (review submitted scores by class/subject, approve or send back with a comment, lock a term).

Acceptance: a teacher takes attendance and submits scores, and the Principal approves them. Then wait.
```

---

## STEP 7: Student portal and report card

```
STEP 7: Student portal at /student (mobile-first).

1. Dashboard: greeting, today's timetable, attendance rate, latest results snapshot, outstanding fees banner, latest announcements and assignments due.
2. My Profile (read-only plus change password and photo request), My Classes and Subjects, Timetable (weekly grid), Attendance (calendar heat-map plus monthly percentage), Assignments and Learning Materials (download).
3. Results: pick term, see the subject table (CA, Exam, Total, Grade, Remark), position in class, overall average, and a Recharts progress chart across terms. Only APPROVED or LOCKED results are visible.
4. Report Card: generate a PDF with the school letterhead and logo in navy/sky blue, student photo placeholder, subject scores, grade key, attendance summary, class position, teacher and principal remarks, and signature areas. Add a "Download PDF" button. Admins can also batch-generate report cards for a whole class.
5. Guardian View (from Step 3): PIN-gated read-only summary for parents (results, attendance, fee balance, payment history, announcements) with a "Pay Fees" button.
6. School Calendar and Announcements.

Acceptance: logged in as a demo student I see my own data only, and the report card PDF downloads and looks professional. Then wait.
```

---

## STEP 8: Fees and online payment (Paystack)

```
STEP 8: Fees and payments. Treat this as the most critical module.

ACCOUNTANT / ADMIN SIDE (/admin/fees)
1. Fee Structure: create fee items per class and term (tuition, registration, exam, uniform, transport, hostel, other).
2. Generate invoices: for a class or the whole school for the current term, each student gets an invoice with lines. Apply discounts and scholarships (percentage or fixed) with a reason.
3. Invoices list with filters (class, status, term). Outstanding Fees view with a "Send reminder" action (stub SMS/email by logging to console and storing a Notification record).
4. Record manual payments (CASH, POS, TRANSFER) with an automatic receipt number, and a clear audit trail of who recorded it. Payments can only be VOIDED with a reason, never deleted.
5. Financial Reports: revenue by term, by class, by fee type, outstanding balances, discount and scholarship totals. Export CSV and PDF.

PAYING ONLINE (student portal and Guardian View)
6. "Pay Now" on an invoice allows full or partial payment. Create a PENDING Payment with a unique reference, then call Paystack Initialize Transaction (amount in kobo, student email, metadata with invoiceId) and redirect to Paystack checkout. Use TEST keys from .env.
7. Callback page: verify the transaction with Paystack's Verify endpoint and show the result.
8. WEBHOOK at /api/webhooks/paystack: verify the x-paystack-signature header (HMAC SHA512 with the secret key), handle charge.success idempotently (never double-credit the same reference), update Payment, Invoice paidKobo and status, create a receipt, store the raw payload. This webhook is the source of truth, not the browser redirect.
9. Receipts: generate a branded PDF receipt (logo, student, term, items, amount, reference, date) available for download and listed in Payment History.
10. Write tests for: webhook signature rejection, idempotency (same event twice), and partial payments updating status to PARTIAL then PAID.

Acceptance: I can pay a demo invoice with a Paystack test card, see the invoice flip to PAID, and download the receipt. Document how to test with Paystack's test cards and how to expose the webhook locally (ngrok or similar). Then wait.
```

---

## STEP 9: Announcements, notifications and Parent Forum

```
STEP 9: Communication.

1. Announcements: admins and teachers (own class) create announcements with an audience (all, staff, students, a class). Show on the relevant dashboards, with unread indicators for students.
2. Notifications: in-app notification bell for all three roles (new announcement, result approved, payment received, assignment posted). Create a Notification model and a small service. Create email and SMS sender interfaces with console/mock implementations, so Termii and SendGrid can be plugged in later via env variables.
3. Parent Forum moderation (admin side): approve or reject pending threads and replies, lock threads, view by family code. Public side is already built in Step 4. Make sure only APPROVED content is publicly visible.
4. Teacher to guardian messaging: a teacher can send a message about a student, delivered into that student's Guardian View inbox and logged for audit.
5. Events and School Calendar management for admins, feeding both the public Events page and dashboards.

Acceptance: an announcement created by the Principal appears on the student dashboard and triggers a notification; a forum post appears only after approval. Then wait.
```

---

## STEP 10: Reports and analytics

```
STEP 10: Reports and analytics (admin).

Build /admin/reports with filterable pages and CSV/PDF export for: Student reports (enrollment by class, gender, status), Attendance reports (daily, monthly, per class, chronic absentees), Academic and Examination reports (class averages, subject performance, pass rates, top performers), Fee and Financial reports (from Step 8), Staff reports (attendance and workload), and a Performance Analytics dashboard with Recharts: enrollment trend, revenue vs outstanding, attendance trend, subject performance heat-map.

Also add a global search (students, staff, admission numbers) in the admin top bar.

Acceptance: every report loads quickly with the demo data and exports correctly. Then wait.
```

---

## STEP 11: Security, quality and polish

```
STEP 11: Hardening and polish.

1. Security review: confirm server-side authorization on every action, add security headers (CSP, HSTS, X-Frame-Options), CSRF protection on forms, input sanitization, file upload validation (type, size, extension allowlist), secure cookies, and rate limiting on login, admission form, contact form and payment endpoints.
2. Privacy: restrict medical records to ADMIN (NURSE, PRINCIPAL, SUPER_ADMIN) only, and log every access. Add a Privacy Policy and Terms page (placeholder NDPR-aware text).
3. UX polish: loading skeletons, empty states, error boundaries, 404 and 500 pages in brand style, toasts, keyboard navigation, mobile review of every page at 375px width, dark text contrast check.
4. Performance: pagination everywhere, database indexes on foreign keys and common filters, image optimization.
5. Tests: run the full test suite and a quick Playwright smoke test (login for each role, add student, take attendance, pay an invoice in test mode).
6. Fix every TypeScript and ESLint error.

Acceptance: `npm run build` passes with zero errors and the smoke test passes. List any known gaps honestly. Then wait.
```

---

## STEP 12: Deploy and demo preparation

```
STEP 12: Deployment and demo prep.

1. Prepare for deployment on Vercel with a Neon or Supabase PostgreSQL database. Give me exact click-by-click steps and the environment variables to set. Add the Paystack webhook URL to deploy notes.
2. Write a complete README: overview, features, tech stack, setup, env vars, scripts, demo accounts (admin, principal, accountant, teacher, student with the Guardian PIN), testing payments, and folder structure.
3. Add a /demo-guide route (visible only to SUPER_ADMIN) listing demo credentials and the demo script below.
4. Re-seed a clean, impressive demo dataset so dashboards look full and realistic.
5. Create a short "Roadmap" page or document listing Phase 2 modules (Library, Transport, Hostel, Inventory and Assets, Laboratory, School Health, SMS/Email provider integration, biometric attendance, mobile app) so we can show the full vision.

Acceptance: the live URL works end to end. Give me a final checklist of anything I must do manually (domain, real Paystack live keys, real SMS provider).
```

---

## 5-minute demo script for your boss

1. **Public site (1 min):** open the homepage on a laptop, then on a phone. Show About, Academics and the online Admission form. Submit an application live.
2. **Admin (1 min):** log in as Super Admin, show the dashboard, approve the application and watch it become a student.
3. **Teacher (1 min):** log in as a teacher, take attendance in one tap, enter scores, submit.
4. **Principal (30 sec):** approve the results.
5. **Student and parent (1 min):** log in as the student, view results, download the report card PDF, open Guardian View with the PIN.
6. **Money (1 min):** pay a fee invoice with a Paystack test card, show the instant receipt and the accountant's financial report updating.
7. **Close:** show the Roadmap slide for Phase 2 (library, hostel, transport, health, SMS integration).

## Tips for working with the AI

- Always paste the **Master Context Prompt first** in every new chat session so it remembers the rules.
- If the AI drifts, paste: *"Re-read the Master Context Prompt and fix this to comply."*
- After each step, run the app and click through it yourself before asking for the next step.
- If a step is too big for one reply, say: *"Continue exactly where you stopped."* Do not ask it to start over.
- Commit to Git after every step so you can roll back if something breaks.
- Ask for this at the end of each step: *"List what is finished, what is stubbed, and what is still missing."* This keeps you honest with your boss about what is real.
