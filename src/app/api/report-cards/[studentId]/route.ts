import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { can } from "@/lib/permissions";
import { teacherScope } from "@/lib/services/academics";
import { reportCardPdf } from "@/lib/services/pdf";

/** Report card PDF. Students see only their own; staff need reports or teaching scope for the student's class. */
export async function GET(req: NextRequest, { params }: { params: { studentId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const student = await db.student.findUnique({ where: { id: params.studentId }, select: { id: true, userId: true, classId: true, deletedAt: true } });
  if (!student || student.deletedAt) return NextResponse.json({ error: "not found" }, { status: 404 });

  let allowed = student.userId === user.id;
  if (!allowed && user.role === "ADMIN") allowed = can(user, "reports:read") || can(user, "results:approve");
  if (!allowed && user.role === "TEACHER") {
    const staff = await db.staff.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (staff) allowed = (await teacherScope(staff.id)).classIds.includes(student.classId);
  }
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const termParam = z.string().uuid().safeParse(req.nextUrl.searchParams.get("termId"));
  const term = termParam.success
    ? await db.term.findUnique({ where: { id: termParam.data } })
    : await db.term.findFirst({ where: { isCurrent: true } });
  if (!term) return NextResponse.json({ error: "term not found" }, { status: 404 });

  const pdf = await reportCardPdf(student.id, term.id);
  return new NextResponse(Buffer.from(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="report-card-${student.id.slice(0, 8)}-${term.name.replace(/\s+/g, "-")}.pdf"` },
  });
}
