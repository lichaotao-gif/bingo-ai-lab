/** 区域管辖范围演示数据：地区 → 学校 → 班级 → 学生 */

export interface BureauRegion {
  id: string;
  name: string;
}

export interface BureauSchool {
  id: string;
  regionId: string;
  name: string;
}

export interface BureauClass {
  id: string;
  schoolId: string;
  name: string;
}

export interface BureauStudent {
  id: string;
  classId: string;
  name: string;
  /** 实验完成度 0～100 */
  experimentPct: number;
  /** 测验完成度 0～100 */
  quizPct: number;
}

export const BUREAU_REGIONS: BureauRegion[] = [
  { id: "r-east", name: "东城区" },
  { id: "r-west", name: "西城区" },
  { id: "r-sub", name: "经开区" },
];

export const BUREAU_SCHOOLS: BureauSchool[] = [
  { id: "s1", regionId: "r-east", name: "第一实验小学" },
  { id: "s2", regionId: "r-east", name: "阳光初级中学" },
  { id: "s3", regionId: "r-west", name: "西城师范附属小学" },
  { id: "s4", regionId: "r-west", name: "明德中学" },
  { id: "s5", regionId: "r-sub", name: "经开区第一小学" },
  { id: "s6", regionId: "r-sub", name: "科创实验学校" },
];

export const BUREAU_CLASSES: BureauClass[] = [
  { id: "c1", schoolId: "s1", name: "三年级二班" },
  { id: "c2", schoolId: "s1", name: "四年级一班" },
  { id: "c3", schoolId: "s2", name: "初二（3）班" },
  { id: "c4", schoolId: "s3", name: "五年级三班" },
  { id: "c5", schoolId: "s4", name: "高一（6）班" },
  { id: "c6", schoolId: "s5", name: "二年级一班" },
  { id: "c7", schoolId: "s6", name: "七年级二班" },
];

function pick(n: number, base: number): number {
  return Math.min(100, Math.max(0, Math.round(base + (Math.sin(n * 1.7) * 18 + n * 3) % 35)));
}

export const BUREAU_STUDENTS: BureauStudent[] = [
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `st-c1-${i}`,
    classId: "c1",
    name: `学生${i + 1}`,
    experimentPct: pick(i, 62),
    quizPct: pick(i + 3, 58),
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `st-c2-${i}`,
    classId: "c2",
    name: `学生${i + 1}`,
    experimentPct: pick(i + 1, 70),
    quizPct: pick(i + 2, 65),
  })),
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `st-c3-${i}`,
    classId: "c3",
    name: `学生${i + 1}`,
    experimentPct: pick(i + 4, 55),
    quizPct: pick(i, 72),
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `st-c4-${i}`,
    classId: "c4",
    name: `学生${i + 1}`,
    experimentPct: pick(i + 2, 68),
    quizPct: pick(i + 5, 60),
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `st-c5-${i}`,
    classId: "c5",
    name: `学生${i + 1}`,
    experimentPct: pick(i, 75),
    quizPct: pick(i + 1, 78),
  })),
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `st-c6-${i}`,
    classId: "c6",
    name: `学生${i + 1}`,
    experimentPct: pick(i + 3, 50),
    quizPct: pick(i + 4, 48),
  })),
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `st-c7-${i}`,
    classId: "c7",
    name: `学生${i + 1}`,
    experimentPct: pick(i + 6, 66),
    quizPct: pick(i + 2, 63),
  })),
];

export function schoolsForRegion(regionId: string | ""): BureauSchool[] {
  if (!regionId) {
    return [...BUREAU_SCHOOLS];
  }
  return BUREAU_SCHOOLS.filter((s) => s.regionId === regionId);
}

export function classesForSchool(schoolId: string | ""): BureauClass[] {
  if (!schoolId) {
    return [...BUREAU_CLASSES];
  }
  return BUREAU_CLASSES.filter((c) => c.schoolId === schoolId);
}

export function classIdsForFilters(
  regionId: string | "",
  schoolId: string | "",
  classId: string | "",
): Set<string> {
  let classes = BUREAU_CLASSES;
  if (schoolId) {
    classes = classes.filter((c) => c.schoolId === schoolId);
  } else if (regionId) {
    const sids = new Set(schoolsForRegion(regionId).map((s) => s.id));
    classes = classes.filter((c) => sids.has(c.schoolId));
  }
  if (classId) {
    return new Set([classId]);
  }
  return new Set(classes.map((c) => c.id));
}

export function studentsForClassIds(ids: Set<string>): BureauStudent[] {
  return BUREAU_STUDENTS.filter((st) => ids.has(st.classId));
}

export function avg(nums: number[]): number {
  if (!nums.length) {
    return 0;
  }
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export function schoolById(id: string): BureauSchool | undefined {
  return BUREAU_SCHOOLS.find((s) => s.id === id);
}

export function classById(id: string): BureauClass | undefined {
  return BUREAU_CLASSES.find((c) => c.id === id);
}

export function regionById(id: string): BureauRegion | undefined {
  return BUREAU_REGIONS.find((r) => r.id === id);
}

/** 按学校聚合平均完成度（用于条形图） */
export function schoolBars(
  regionId: string | "",
): { schoolId: string; schoolName: string; exp: number; quiz: number; students: number }[] {
  const schools = schoolsForRegion(regionId);
  return schools.map((sch) => {
    const cids = new Set(
      BUREAU_CLASSES.filter((c) => c.schoolId === sch.id).map((c) => c.id),
    );
    const studs = studentsForClassIds(cids);
    return {
      schoolId: sch.id,
      schoolName: sch.name,
      exp: avg(studs.map((s) => s.experimentPct)),
      quiz: avg(studs.map((s) => s.quizPct)),
      students: studs.length,
    };
  });
}
