/** 区域管辖范围演示数据：省 → 市 → 区县 → 学校 → 班级 → 学生 */

export interface BureauProvince {
  id: string;
  name: string;
}

export interface BureauCity {
  id: string;
  provinceId: string;
  name: string;
}

/** 区/县（原「地区」粒度，与学校.regionId 对应） */
export interface BureauRegion {
  id: string;
  cityId: string;
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

/** 学年学期（演示：与班级绑定，筛选时按学生所属学期过滤） */
export interface BureauSemester {
  id: string;
  label: string;
}

export const BUREAU_SEMESTERS: BureauSemester[] = [
  { id: "sem-2425-2", label: "2024–2025 学年第二学期" },
  { id: "sem-2526-1", label: "2025–2026 学年第一学期" },
];

/** 班级默认所属学期（演示数据） */
const SEMESTER_BY_CLASS_ID: Record<string, string> = {
  c1: "sem-2425-2",
  c2: "sem-2526-1",
  c3: "sem-2425-2",
  c4: "sem-2526-1",
  c5: "sem-2425-2",
  c6: "sem-2526-1",
  c7: "sem-2425-2",
};

function semesterForClass(classId: string): string {
  return SEMESTER_BY_CLASS_ID[classId] ?? BUREAU_SEMESTERS[0]!.id;
}

export interface BureauStudent {
  id: string;
  classId: string;
  name: string;
  /** 所属学期 id，与 BUREAU_SEMESTERS 对应 */
  semesterId: string;
  /** 实验完成度 0～100 */
  experimentPct: number;
  /** 测验完成度 0～100 */
  quizPct: number;
}

export const BUREAU_PROVINCES: BureauProvince[] = [
  { id: "pr-gd", name: "广东省" },
  { id: "pr-bj", name: "北京市" },
];

export const BUREAU_CITIES: BureauCity[] = [
  { id: "ct-sz", provinceId: "pr-gd", name: "深圳市" },
  { id: "ct-gz", provinceId: "pr-gd", name: "广州市" },
  { id: "ct-bj", provinceId: "pr-bj", name: "市辖区" },
];

export const BUREAU_REGIONS: BureauRegion[] = [
  { id: "r-east", cityId: "ct-sz", name: "东城区" },
  { id: "r-west", cityId: "ct-gz", name: "西城区" },
  { id: "r-sub", cityId: "ct-sz", name: "经开区" },
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
    semesterId: semesterForClass("c1"),
    experimentPct: pick(i, 62),
    quizPct: pick(i + 3, 58),
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `st-c2-${i}`,
    classId: "c2",
    name: `学生${i + 1}`,
    semesterId: semesterForClass("c2"),
    experimentPct: pick(i + 1, 70),
    quizPct: pick(i + 2, 65),
  })),
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `st-c3-${i}`,
    classId: "c3",
    name: `学生${i + 1}`,
    semesterId: semesterForClass("c3"),
    experimentPct: pick(i + 4, 55),
    quizPct: pick(i, 72),
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `st-c4-${i}`,
    classId: "c4",
    name: `学生${i + 1}`,
    semesterId: semesterForClass("c4"),
    experimentPct: pick(i + 2, 68),
    quizPct: pick(i + 5, 60),
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `st-c5-${i}`,
    classId: "c5",
    name: `学生${i + 1}`,
    semesterId: semesterForClass("c5"),
    experimentPct: pick(i, 75),
    quizPct: pick(i + 1, 78),
  })),
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `st-c6-${i}`,
    classId: "c6",
    name: `学生${i + 1}`,
    semesterId: semesterForClass("c6"),
    experimentPct: pick(i + 3, 50),
    quizPct: pick(i + 4, 48),
  })),
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `st-c7-${i}`,
    classId: "c7",
    name: `学生${i + 1}`,
    semesterId: semesterForClass("c7"),
    experimentPct: pick(i + 6, 66),
    quizPct: pick(i + 2, 63),
  })),
];

export function citiesForProvince(provinceId: string | ""): BureauCity[] {
  if (!provinceId) {
    return [...BUREAU_CITIES];
  }
  return BUREAU_CITIES.filter((c) => c.provinceId === provinceId);
}

export function districtsForCity(cityId: string | ""): BureauRegion[] {
  if (!cityId) {
    return [...BUREAU_REGIONS];
  }
  return BUREAU_REGIONS.filter((r) => r.cityId === cityId);
}

/**
 * 按省 / 市 / 区筛选时，得到涉及的区县 id 集合；null 表示不限（全部区县）
 */
export function districtIdsForScope(
  provinceId: string | "",
  cityId: string | "",
  districtId: string | "",
): Set<string> | null {
  if (districtId) {
    return new Set([districtId]);
  }
  if (cityId) {
    return new Set(
      BUREAU_REGIONS.filter((r) => r.cityId === cityId).map((r) => r.id),
    );
  }
  if (provinceId) {
    const cityIds = new Set(
      BUREAU_CITIES.filter((c) => c.provinceId === provinceId).map((c) => c.id),
    );
    return new Set(
      BUREAU_REGIONS.filter((r) => cityIds.has(r.cityId)).map((r) => r.id),
    );
  }
  return null;
}

export function schoolsForScope(
  provinceId: string | "",
  cityId: string | "",
  districtId: string | "",
): BureauSchool[] {
  const dids = districtIdsForScope(provinceId, cityId, districtId);
  if (!dids) {
    return [...BUREAU_SCHOOLS];
  }
  return BUREAU_SCHOOLS.filter((s) => dids.has(s.regionId));
}

/** 兼容旧逻辑：regionId 实为区县 id */
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
  districtId: string | "",
  schoolId: string | "",
  cityId: string | "",
  provinceId: string | "",
): Set<string> {
  const dids = districtIdsForScope(provinceId, cityId, districtId);
  let schools = BUREAU_SCHOOLS;
  if (dids) {
    schools = schools.filter((s) => dids.has(s.regionId));
  }
  const schoolIds = new Set(schools.map((s) => s.id));
  let classes = BUREAU_CLASSES.filter((c) => schoolIds.has(c.schoolId));
  if (schoolId) {
    classes = classes.filter((c) => c.schoolId === schoolId);
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

export function cityById(id: string): BureauCity | undefined {
  return BUREAU_CITIES.find((c) => c.id === id);
}

export function provinceById(id: string): BureauProvince | undefined {
  return BUREAU_PROVINCES.find((p) => p.id === id);
}

/** 按学校聚合平均完成度（用于条形图） */
export function schoolBars(
  provinceId: string | "",
  cityId: string | "",
  districtId: string | "",
): { schoolId: string; schoolName: string; exp: number; quiz: number; students: number }[] {
  const schools = schoolsForScope(provinceId, cityId, districtId);
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
