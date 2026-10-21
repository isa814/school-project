/** Nigerian secondary school grade scale (WAEC-style). Pure functions, no DB access. */
export const GRADE_SCALE = [
  { min: 75, max: 100, grade: "A1", remark: "Excellent" },
  { min: 70, max: 74, grade: "B2", remark: "Very Good" },
  { min: 65, max: 69, grade: "B3", remark: "Good" },
  { min: 60, max: 64, grade: "C4", remark: "Credit" },
  { min: 55, max: 59, grade: "C5", remark: "Credit" },
  { min: 50, max: 54, grade: "C6", remark: "Credit" },
  { min: 45, max: 49, grade: "D7", remark: "Pass" },
  { min: 40, max: 44, grade: "E8", remark: "Fair" },
  { min: 0, max: 39, grade: "F9", remark: "Fail" },
] as const;

export const CA_MAX = 40;
export const EXAM_MAX = 60;

export function gradeFor(total: number): { grade: string; remark: string } {
  const rounded = Math.round(total);
  const hit = GRADE_SCALE.find((g) => rounded >= g.min && rounded <= g.max) ?? GRADE_SCALE[GRADE_SCALE.length - 1];
  return { grade: hit.grade, remark: hit.remark };
}

export function computeTotal(ca: number, exam: number): number {
  return Math.min(CA_MAX, Math.max(0, ca)) + Math.min(EXAM_MAX, Math.max(0, exam));
}
