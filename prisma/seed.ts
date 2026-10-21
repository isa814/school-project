/* eslint-disable no-console */
import { PrismaClient, AttendanceStatus, InvoiceStatus, PaymentMethod, PaymentStatus, ScoreStatus, FeeType, AnnouncementAudience, ModerationStatus, AdmissionStatus, AdminRole, UserRole, StudentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const DEMO_PASSWORD = "Demo@1234";
const GUARDIAN_PIN = "1234";

const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const rand = rng(20262027);
const pick = <T,>(arr: readonly T[], i: number): T => arr[i % arr.length];

const MALE_FIRST = ["Abdulrahman", "Musa", "Ibrahim", "Yusuf", "Abdullahi", "Usman", "Hamza", "Ismail", "Bello", "Aminu", "Sadiq", "Suleiman", "Tijani", "Kabir", "Jamiu", "Ridwan", "Salihu", "Zubairu", "Nasir", "Lukman"];
const FEMALE_FIRST = ["Aisha", "Fatimah", "Khadijah", "Zainab", "Maryam", "Hauwa", "Amina", "Sumayya", "Rukayya", "Hafsat", "Khadija", "Raliat", "Bilkisu", "Jamila", "Zulaihat", "Nafisa", "Ummi", "Saratu", "Safiya", "Hajara"];
const LAST = ["Abubakar", "Adeyemi", "Balogun", "Ogunleye", "Lawal", "Bello", "Sanni", "Oladipo", "Yusuf", "Agboola", "Raji", "Olanrewaju", "Hassan", "Ajayi", "Mohammed", "Adebayo", "Oyelakin", "Ahmed", "Kareem", "Salami"];
const TEACHERS = [
  ["Halimat", "Oloyede", "Mathematics & Sciences"], ["Musa", "Garba", "Languages"], ["Taiwo", "Akinsola", "Sciences"],
  ["Ustaz Abdulazeez", "Ibrahim", "Islamic Studies"], ["Mariam", "Yahaya", "Languages"], ["Sulaimon", "Adewale", "Humanities"],
  ["Funmilayo", "Okeke", "ICT"], ["Hajia Rukayat", "Bello", "Humanities"],
] as const;
const SUBJECTS: [string, string, number][] = [
  ["Mathematics", "MTH", 0], ["English Language", "ENG", 1], ["Basic Science", "BSC", 2], ["Arabic Language", "ARB", 1],
  ["Islamic Studies", "ISL", 3], ["Quranic Studies", "QRN", 3], ["Computer Studies", "CMP", 4], ["Civic Education", "CIV", 5],
  ["Social Studies", "SOS", 5], ["Biology", "BIO", 2], ["Physics", "PHY", 2], ["Economics", "ECO", 5],
];
const DEPARTMENTS = ["Mathematics & Sciences", "Languages", "Sciences", "Islamic Studies", "Humanities", "ICT"];
const CLASSES = [["JSS1", "JUNIOR"], ["JSS2", "JUNIOR"], ["JSS3", "JUNIOR"], ["SS1", "SENIOR"], ["SS2", "SENIOR"], ["SS3", "SENIOR"]] as const;

async function wipe() {
  const tables = await db.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '_prisma%'`;
  if (tables.length) {
    await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`);
  }
}

async function main() {
  console.log("Resetting demo data...");
  await wipe();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const pinHash = await bcrypt.hash(GUARDIAN_PIN, 10);

  // ---- Grade scale
  const scale = [
    [75, 100, "A1", "Excellent"], [70, 74, "B2", "Very Good"], [65, 69, "B3", "Good"], [60, 64, "C4", "Credit"],
    [55, 59, "C5", "Credit"], [50, 54, "C6", "Credit"], [45, 49, "D7", "Pass"], [40, 44, "E8", "Fair"], [0, 39, "F9", "Fail"],
  ] as const;
  await db.gradeScale.createMany({ data: scale.map(([minScore, maxScore, grade, remark]) => ({ minScore, maxScore, grade, remark })) });

  // ---- Academic sessions and terms
  const prevSession = await db.academicSession.create({ data: { name: "2025/2026", startDate: new Date("2025-09-15"), endDate: new Date("2026-07-31") } });
  const session = await db.academicSession.create({ data: { name: "2026/2027", startDate: new Date("2026-09-14"), endDate: new Date("2027-07-30"), isCurrent: true } });
  const prevThird = await db.term.create({ data: { sessionId: prevSession.id, name: "Third Term", startDate: new Date("2026-04-20"), endDate: new Date("2026-07-31"), isLocked: true } });
  await db.term.create({ data: { sessionId: prevSession.id, name: "First Term", startDate: new Date("2025-09-15"), endDate: new Date("2025-12-19"), isLocked: true } });
  await db.term.create({ data: { sessionId: prevSession.id, name: "Second Term", startDate: new Date("2026-01-12"), endDate: new Date("2026-04-10"), isLocked: true } });
  const term1 = await db.term.create({ data: { sessionId: session.id, name: "First Term", startDate: new Date("2026-09-14"), endDate: new Date("2026-12-18"), isCurrent: true } });

  // ---- Departments and subjects
  const depts = new Map<string, string>();
  for (const name of DEPARTMENTS) {
    const d = await db.department.create({ data: { name } });
    depts.set(name, d.id);
  }
  const subjects: { id: string; name: string }[] = [];
  for (const [name, code, di] of SUBJECTS) {
    const s = await db.subject.create({ data: { name, code, departmentId: depts.get(DEPARTMENTS[di]) } });
    subjects.push(s);
  }

  // ---- Users and staff (admins)
  const adminAccounts: { email: string; name: string; staffNo: string; role: AdminRole }[] = [
    { email: "admin@ansarruhul.demo", name: "Super Admin", staffNo: "STF-0001", role: "SUPER_ADMIN" },
    { email: "principal@ansarruhul.demo", name: "Principal", staffNo: "STF-0002", role: "PRINCIPAL" },
    { email: "accountant@ansarruhul.demo", name: "Accountant", staffNo: "STF-0003", role: "ACCOUNTANT" },
  ];
  for (const a of adminAccounts) {
    const [firstName, ...rest] = a.name.split(" ");
    const u = await db.user.create({ data: { email: a.email, passwordHash, role: UserRole.ADMIN, adminRole: a.role } });
    await db.staff.create({ data: { userId: u.id, staffNo: a.staffNo, firstName, lastName: rest.join(" ") || "Staff", qualification: "B.Ed Educational Management", status: "ACTIVE" } });
  }
  const principalUser = await db.user.findUniqueOrThrow({ where: { email: "principal@ansarruhul.demo" }, include: { staff: true } });
  const principalStaffId = principalUser.staff?.id;

  // ---- Teachers
  const teachers: { id: string; name: string; dept: string }[] = [];
  for (let i = 0; i < TEACHERS.length; i++) {
    const [first, last, dept] = TEACHERS[i];
    const u = await db.user.create({ data: { email: `teacher${i + 1}@ansarruhul.demo`, passwordHash, role: UserRole.TEACHER } });
    const s = await db.staff.create({
      data: {
        userId: u.id, staffNo: `TCH-${String(i + 1).padStart(3, "0")}`, firstName: first, lastName: last,
        phone: `0803${String(1000000 + i * 7919).slice(0, 7)}`, qualification: i % 2 ? "B.Sc Education" : "B.Ed, PGDE",
        bio: "Dedicated educator committed to building character and competence in every learner.",
        departmentId: depts.get(dept) ?? null, status: "ACTIVE",
      },
    });
    teachers.push({ id: s.id, name: `${first} ${last}`, dept });
  }

  // ---- Classes and sections
  const classes: { id: string; name: string; level: string; sections: { id: string; name: string }[] }[] = [];
  for (let i = 0; i < CLASSES.length; i++) {
    const [name, level] = CLASSES[i];
    const c = await db.class.create({ data: { name, level, sortOrder: i + 1, classTeacherId: teachers[i % teachers.length].id } });
    const a = await db.section.create({ data: { classId: c.id, name: "A" } });
    const b = await db.section.create({ data: { classId: c.id, name: "B" } });
    classes.push({ id: c.id, name, level, sections: [a, b] });
  }

  // ---- Subject assignments (every class/section/subject) and timetable
  const teacherFor = (subjectIdx: number) => teachers[subjectIdx % teachers.length].id;
  for (const c of classes) {
    for (const sec of c.sections) {
      for (let si = 0; si < subjects.length; si++) {
        await db.subjectAssignment.create({ data: { subjectId: subjects[si].id, classId: c.id, sectionId: sec.id, teacherId: teacherFor(si) } });
      }
      let secIdx = 0;
      for (const cc of classes) for (const ss of cc.sections) { if (ss.id === sec.id) break; secIdx++; }
      const entries = [];
      for (let day = 1; day <= 5; day++) {
        for (let period = 1; period <= 6; period++) {
          const si = (day * 6 + period + secIdx) % subjects.length;
          const startH = 7 + period; // 08:00 .. 13:00
          entries.push({
            classId: c.id, sectionId: sec.id, dayOfWeek: day, period,
            startTime: `${String(startH).padStart(2, "0")}:00`, endTime: `${String(startH).padStart(2, "0")}:40`,
            subjectId: subjects[si].id, teacherId: teacherFor(si),
          });
        }
      }
      await db.timetableEntry.createMany({ data: entries });
    }
  }

  // ---- Students (60), guardians, medical, logins
  const students: { id: string; classIdx: number; sectionId: string; name: string; admissionNo: string; gender: string; status: StudentStatus }[] = [];
  for (let i = 0; i < 60; i++) {
    const classIdx = Math.floor(i / 10);
    const sec = classes[classIdx].sections[Math.floor((i % 10) / 5)];
    const female = i % 2 === 1;
    const first = female ? pick(FEMALE_FIRST, i) : pick(MALE_FIRST, i);
    const last = pick(LAST, i * 3 + 1);
    const admissionNo = `ARI-${i < 40 ? 2024 : 2026}-${String(i + 1).padStart(4, "0")}`;
    const u = await db.user.create({ data: { email: `student${String(i + 1).padStart(2, "0")}@ansarruhul.demo`, passwordHash, role: UserRole.STUDENT } });
    const dobYear = 2026 - (11 + classIdx) - Math.floor(rand() * 2);
    const st = await db.student.create({
      data: {
        userId: u.id, admissionNo, firstName: first, lastName: last,
        dob: new Date(`${dobYear}-0${1 + (i % 9)}-1${i % 9}`), gender: female ? "Female" : "Male",
        classId: classes[classIdx].id, sectionId: sec.id, status: "ACTIVE",
        admissionDate: new Date(i < 40 ? "2024-09-16" : "2026-09-14"),
        previousSchool: i % 4 === 0 ? "Ansar Ruhul Islam Nursery & Primary School" : "Local Primary School, Surulere",
        guardianPinHash: pinHash, familyAccessCode: `FAM-${String(100000 + i * 137).slice(0, 6)}`,
      },
    });
    await db.guardian.create({
      data: {
        studentId: st.id, name: `${pick(MALE_FIRST, i + 5)} ${last}`, relationship: i % 3 === 0 ? "Mother" : "Father",
        phone: `0806${String(2000000 + i * 4111).slice(0, 7)}`, email: `guardian${i + 1}@example.com`,
        address: "Lagos, Nigeria", isPrimary: true,
      },
    });
    await db.medicalRecord.create({ data: { studentId: st.id, bloodGroup: pick(["O+", "A+", "B+", "AA"], i), allergies: i % 7 === 0 ? "Peanuts" : "None known", conditions: "None", emergencyContact: "Guardian phone on file" } });
    students.push({ id: st.id, classIdx, sectionId: sec.id, name: `${first} ${last}`, admissionNo, gender: female ? "Female" : "Male", status: "ACTIVE" });
  }

  // ---- Attendance: last 30 school days (weekdays) before 2026-10-19
  const days: Date[] = [];
  const cursor = new Date("2026-10-19T00:00:00Z");
  while (days.length < 30) {
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) days.unshift(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  const markers = teachers.map((t) => t.id);
  const attendanceRows: { studentId: string; date: Date; status: AttendanceStatus; markedById: string; termId: string }[] = [];
  for (const st of students) {
    for (const d of days) {
      const roll = rand();
      const status: AttendanceStatus = roll < 0.84 ? "PRESENT" : roll < 0.92 ? "LATE" : roll < 0.97 ? "EXCUSED" : "ABSENT";
      attendanceRows.push({ studentId: st.id, date: d, status, markedById: pick(markers, 0), termId: term1.id });
    }
  }
  await db.attendance.createMany({ data: attendanceRows });

  // ---- Scores: previous term approved for everyone; current term subjects Mathematics & English submitted
  const scoreRows: {
    studentId: string; subjectId: string; termId: string; caScore: number; examScore: number; total: number; grade: string; remark: string; status: ScoreStatus; enteredById: string; approvedById?: string;
  }[] = [];
  const gradeOf = (t: number) => scale.find(([mn, mx]) => Math.round(t) >= mn && Math.round(t) <= mx)!;
  students.forEach((st) => {
    subjects.forEach((sub, subIdx) => {
      const ca = Math.round(20 + rand() * 20);
      const ex = Math.round(25 + rand() * 35);
      const total = ca + ex;
      const g = gradeOf(total);
      scoreRows.push({ studentId: st.id, subjectId: sub.id, termId: prevThird.id, caScore: ca, examScore: ex, total, grade: g[2], remark: g[3], status: "APPROVED", enteredById: teachers[subIdx % teachers.length].id, approvedById: principalStaffId });
      if (subIdx < 2) {
        const ca2 = Math.round(18 + rand() * 22);
        const ex2 = Math.round(20 + rand() * 40);
        const t2 = ca2 + ex2;
        const g2 = gradeOf(t2);
        scoreRows.push({ studentId: st.id, subjectId: sub.id, termId: term1.id, caScore: ca2, examScore: ex2, total: t2, grade: g2[2], remark: g2[3], status: "SUBMITTED", enteredById: teachers[subIdx % teachers.length].id });
      }
    });
  });
  await db.score.createMany({ data: scoreRows });

  // ---- Fee structure (current term) per class, and invoices
  const feeDefs = [
    { name: "Tuition", type: FeeType.TUITION, jss: 120000, ss: 150000 },
    { name: "Registration", type: FeeType.REGISTRATION, jss: 10000, ss: 10000 },
    { name: "Examination", type: FeeType.EXAM, jss: 15000, ss: 18000 },
    { name: "School Uniform", type: FeeType.UNIFORM, jss: 18000, ss: 18000 },
  ];
  const feeIds = new Map<string, { id: string; name: string; amountKobo: number }[]>();
  for (const c of classes) {
    const list = [];
    for (const f of feeDefs) {
      const amountNaira = c.level === "JUNIOR" ? f.jss : f.ss;
      const fi = await db.feeItem.create({ data: { classId: c.id, termId: term1.id, name: f.name, type: f.type, amountKobo: amountNaira * 100 } });
      list.push({ id: fi.id, name: fi.name, amountKobo: fi.amountKobo });
    }
    feeIds.set(c.id, list);
  }
  for (let i = 0; i < students.length; i++) {
    const st = students[i];
    const items = feeIds.get(classes[st.classIdx].id)!;
    const total = items.reduce((s, f) => s + f.amountKobo, 0);
    const bucket = i % 3; // 0 paid, 1 partial, 2 unpaid
    const paid = bucket === 0 ? total : bucket === 1 ? Math.round(total * 0.4 / 100) * 100 : 0;
    const status: InvoiceStatus = bucket === 0 ? "PAID" : bucket === 1 ? "PARTIAL" : "UNPAID";
    const inv = await db.invoice.create({
      data: {
        invoiceNo: `INV-2026-${String(i + 1).padStart(4, "0")}`, studentId: st.id, termId: term1.id,
        totalKobo: total, paidKobo: paid, status, dueDate: new Date("2026-10-31"),
        lines: { create: items.map((f) => ({ feeItemId: f.id, description: f.name, amountKobo: f.amountKobo })) },
      },
    });
    if (paid > 0) {
      await db.payment.create({
        data: {
          invoiceId: inv.id, amountKobo: paid, method: i % 2 ? PaymentMethod.TRANSFER : PaymentMethod.POS,
          gatewayRef: `SEED-${String(i + 1).padStart(4, "0")}`, receiptNo: `RCP-2026-${String(i + 1).padStart(4, "0")}`,
          status: PaymentStatus.SUCCESS, paidAt: new Date("2026-09-20"), recordedById: null,
        },
      });
    }
  }

  // ---- Announcements, news, events, forum, admissions, contact
  await db.announcement.createMany({
    data: [
      { title: "First Term resumption and dress code", body: "All students should resume on Monday 14 September 2026 in full uniform. Please ensure your child's ID card is worn at all times.", audience: AnnouncementAudience.ALL, createdById: principalUser.id },
      { title: "Staff meeting: Continuous Assessment review", body: "All teachers are invited to the staff room on Friday at 2:00 PM to review CA scoring guidelines before submission.", audience: AnnouncementAudience.STAFF, createdById: principalUser.id },
      { title: "Tahfiz and Quran competition", body: "Inter-house Quran recitation competition holds on the last Thursday of this month. Students should prepare their portions.", audience: AnnouncementAudience.STUDENTS, createdById: principalUser.id },
      { title: "Fee reminder: First Term 2026/2027", body: "Parents are reminded that the First Term fees are due on 31 October 2026. Payments can be made online through the portal.", audience: AnnouncementAudience.PARENTS, createdById: principalUser.id },
      { title: "JSS1 orientation for new pupils", body: "JSS1 new pupils and their parents are invited to orientation on Saturday. Bring the admission letter.", audience: AnnouncementAudience.CLASS, classId: classes[0].id, createdById: principalUser.id },
      { title: "Mid-term test timetable released", body: "The mid-term test timetable is now available on the portal. Check your timetable for subject and date details.", audience: AnnouncementAudience.ALL, createdById: principalUser.id },
    ],
  });
  await db.newsPost.createMany({
    data: [
      { title: "Ansar Ruhul Islam students shine at the state Quiz competition", slug: "state-quiz-2026", excerpt: "Our Senior Secondary team placed second in the Lagos State Mathematics Quiz.", body: "TODO: replace with the official news story. Our SS2 team placed second in the regional quiz.", publishedAt: new Date("2026-10-02") },
      { title: "New ICT laboratory opens", slug: "ict-lab-opens", excerpt: "Students now have access to a modern computer laboratory with internet connectivity.", body: "TODO: replace with the official news story. The new ICT laboratory was commissioned this term.", publishedAt: new Date("2026-09-22") },
      { title: "Welcome to the 2026/2027 academic session", slug: "welcome-2026-2027", excerpt: "We welcome returning and new students to a new academic year of learning and character.", body: "TODO: replace with the official principal's welcome message.", publishedAt: new Date("2026-09-14") },
      { title: "Hifz graduates receive certificates", slug: "hifz-graduates", excerpt: "Eight students completed their Quran memorisation programme this session.", body: "TODO: replace with the official news story.", publishedAt: new Date("2026-07-25") },
    ],
  });
  await db.event.createMany({
    data: [
      { title: "Mid-Term Test Week", date: new Date("2026-10-26"), description: "Continuous assessment tests across all classes.", type: "ACADEMIC" },
      { title: "Inter-House Quran Competition", date: new Date("2026-10-29"), description: "Recitation and tajweed competition in the prayer hall.", type: "RELIGIOUS" },
      { title: "Parents' Open Day", date: new Date("2026-11-07"), description: "Meet your child's teachers and review progress.", type: "GENERAL" },
      { title: "Sports Day", date: new Date("2026-11-21"), description: "Annual athletics and sports competition.", type: "SPORTS" },
      { title: "End of First Term Examinations", date: new Date("2026-12-07"), description: "Final examinations for the First Term.", type: "ACADEMIC" },
    ],
  });
  await db.forumThread.createMany({
    data: [
      { title: "Bus route to Ikeja", body: "Does the school bus cover the Ikeja route this term?", familyAccessCode: "FAM-100000", authorName: "Mrs. Abubakar", status: ModerationStatus.APPROVED },
      { title: "Book list for JSS2", body: "Where can parents purchase the JSS2 textbooks approved this term?", familyAccessCode: "FAM-100137", authorName: "Mr. Lawal", status: ModerationStatus.APPROVED },
      { title: "Question about fee instalments", body: "Can we pay First Term fees in two instalments?", familyAccessCode: "FAM-100274", authorName: "Anonymous parent", status: ModerationStatus.PENDING },
    ],
  });
  await db.admissionApplication.createMany({
    data: [
      { reference: "ARI-2026-00101", applicantName: "Zainab Olatunji", gender: "Female", classApplyingFor: "JSS1", guardianName: "Olatunji Kareem", guardianPhone: "08031234567", guardianEmail: "olatunji@example.com", address: "Ikeja, Lagos", previousSchool: "Bright Stars Primary School", status: AdmissionStatus.SUBMITTED },
      { reference: "ARI-2026-00102", applicantName: "Ahmed Bello Jnr", gender: "Male", classApplyingFor: "SS1", guardianName: "Alhaji Bello", guardianPhone: "08057654321", guardianEmail: "bello@example.com", address: "Surulere, Lagos", previousSchool: "Model Junior Secondary School", status: AdmissionStatus.UNDER_REVIEW },
      { reference: "ARI-2026-00103", applicantName: "Khadijah Sanni", gender: "Female", classApplyingFor: "JSS2", guardianName: "Mrs. Sanni", guardianPhone: "08099887766", guardianEmail: "sanni@example.com", address: "Mushin, Lagos", previousSchool: "Ansar Model Primary", status: AdmissionStatus.APPROVED },
    ],
  });
  await db.contactMessage.create({ data: { name: "Demo Visitor", email: "visitor@example.com", subject: "Admission enquiry", message: "Please share the admission timeline for JSS1." } });

  // ---- Demo account summary
  console.log("Seed complete.");
  console.log(`Classes: ${classes.map((c) => c.name).join(", ")} (arms A & B)`);
  console.log(`Teachers: ${teachers.length}, Students: ${students.length}, Subjects: ${subjects.length}`);
  console.log(`Demo password for every account: ${DEMO_PASSWORD}`);
  console.log(`Guardian PIN for demo students: ${GUARDIAN_PIN}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
