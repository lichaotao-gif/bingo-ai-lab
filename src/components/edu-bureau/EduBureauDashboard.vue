<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import EduBureauDataCharts from "@/components/edu-bureau/EduBureauDataCharts.vue";
import {
  BUREAU_CLASSES,
  BUREAU_CITIES,
  BUREAU_PROVINCES,
  BUREAU_REGIONS,
  classById,
  classIdsForFilters,
  classesForSchool,
  cityById,
  provinceById,
  regionById,
  schoolById,
  schoolsForScope,
  studentsForClassIds,
  type BureauStudent,
} from "@/data/eduBureauMock";

const provinceId = ref<string | "">("");
const cityId = ref<string | "">("");
const districtId = ref<string | "">("");
const schoolId = ref<string | "">("");
const classId = ref<string | "">("");

watch(provinceId, () => {
  cityId.value = "";
  districtId.value = "";
  schoolId.value = "";
  classId.value = "";
});

watch(cityId, () => {
  districtId.value = "";
  schoolId.value = "";
  classId.value = "";
});

watch(districtId, () => {
  schoolId.value = "";
  classId.value = "";
});

watch(schoolId, () => {
  classId.value = "";
});

const cityOptions = computed(() => {
  if (!provinceId.value) {
    return [...BUREAU_CITIES];
  }
  return BUREAU_CITIES.filter((c) => c.provinceId === provinceId.value);
});

const districtOptions = computed(() => {
  if (!cityId.value) {
    if (!provinceId.value) {
      return [...BUREAU_REGIONS];
    }
    const cids = new Set(
      BUREAU_CITIES.filter((c) => c.provinceId === provinceId.value).map(
        (c) => c.id,
      ),
    );
    return BUREAU_REGIONS.filter((r) => cids.has(r.cityId));
  }
  return BUREAU_REGIONS.filter((r) => r.cityId === cityId.value);
});

const schoolOptions = computed(() =>
  schoolsForScope(provinceId.value, cityId.value, districtId.value),
);

const classOptions = computed(() => {
  if (schoolId.value) {
    return classesForSchool(schoolId.value);
  }
  const schIds = new Set(schoolOptions.value.map((s) => s.id));
  return BUREAU_CLASSES.filter((c) => schIds.has(c.schoolId));
});

const filteredStudents = computed((): BureauStudent[] => {
  const ids = classIdsForFilters(
    districtId.value,
    schoolId.value,
    classId.value,
    cityId.value,
    provinceId.value,
  );
  return studentsForClassIds(ids);
});

/** 课程内实验个数：实验与测验均按此数量折算人次完成量 */
const EXPERIMENTS_PER_STUDENT = 10;

/** 每班开课总课时（与顶部「开课情况统计」一致） */
const LESSON_HOURS_PER_CLASS = 40;

function experimentDoneCount(s: BureauStudent): number {
  return Math.round((s.experimentPct / 100) * EXPERIMENTS_PER_STUDENT);
}

function quizDoneCount(s: BureauStudent): number {
  return Math.round((s.quizPct / 100) * EXPERIMENTS_PER_STUDENT);
}

function isExperimentAndQuizFullyDone(s: BureauStudent): boolean {
  return (
    experimentDoneCount(s) === EXPERIMENTS_PER_STUDENT &&
    quizDoneCount(s) === EXPERIMENTS_PER_STUDENT
  );
}

function aggregateDoneForStudents(stu: BureauStudent[]) {
  let expDone = 0;
  let quizDone = 0;
  let fullyDoneCount = 0;
  for (const s of stu) {
    expDone += experimentDoneCount(s);
    quizDone += quizDoneCount(s);
    if (isExperimentAndQuizFullyDone(s)) {
      fullyDoneCount += 1;
    }
  }
  const n = stu.length;
  const expExpected = n * EXPERIMENTS_PER_STUDENT;
  const quizExpected = n * EXPERIMENTS_PER_STUDENT;
  const totalDone = expDone + quizDone;
  const totalExpected = expExpected + quizExpected;
  const completionPct =
    totalExpected > 0
      ? Math.min(100, Math.round((totalDone / totalExpected) * 100))
      : 0;
  const experimentCompletionPct =
    expExpected > 0
      ? Math.min(100, Math.round((expDone / expExpected) * 100))
      : 0;
  const quizCompletionPct =
    quizExpected > 0
      ? Math.min(100, Math.round((quizDone / quizExpected) * 100))
      : 0;
  return {
    totalDone,
    totalExpected,
    completionPct,
    fullyDoneCount,
    n,
    experimentTotalCount: expExpected,
    experimentCompletedCount: expDone,
    experimentCompletionPct,
    quizTotalCount: quizExpected,
    quizCompletedCount: quizDone,
    quizCompletionPct,
  };
}

function buildProgressTileRow(
  label: string,
  stu: BureauStudent[],
  /** 用于折算开课总课时（学校为该校班级数，班级为 1） */
  classCountForLessons: number,
) {
  const agg = aggregateDoneForStudents(stu);
  const totalLessonHours = classCountForLessons * LESSON_HOURS_PER_CLASS;
  const completedLessonHours =
    totalLessonHours > 0
      ? Math.min(
          totalLessonHours,
          Math.round((totalLessonHours * agg.completionPct) / 100),
        )
      : 0;
  const lessonHoursCompletionPct =
    totalLessonHours > 0
      ? Math.min(
          100,
          Math.round((completedLessonHours / totalLessonHours) * 100),
        )
      : 0;
  return {
    label,
    classCountForLessons,
    totalLessonHours,
    completedLessonHours,
    lessonHoursCompletionPct,
    ...agg,
  };
}

const kpi = computed(() => {
  const studs = filteredStudents.value;
  const schoolsInScope = new Set<string>();
  const classesInScope = new Set<string>();
  let experimentCompletedSum = 0;
  let quizCompletedSum = 0;
  let experimentFullyDoneStudentCount = 0;
  let quizFullyDoneStudentCount = 0;
  for (const st of studs) {
    const cl = classById(st.classId);
    if (cl) {
      classesInScope.add(cl.id);
      schoolsInScope.add(cl.schoolId);
    }
    experimentCompletedSum += experimentDoneCount(st);
    quizCompletedSum += quizDoneCount(st);
    if (experimentDoneCount(st) === EXPERIMENTS_PER_STUDENT) {
      experimentFullyDoneStudentCount += 1;
    }
    if (quizDoneCount(st) === EXPERIMENTS_PER_STUDENT) {
      quizFullyDoneStudentCount += 1;
    }
  }
  const studentCount = studs.length;
  const experimentExpectedSum = studentCount * EXPERIMENTS_PER_STUDENT;
  const quizExpectedSum = studentCount * EXPERIMENTS_PER_STUDENT;
  const totalItemsCompleted = experimentCompletedSum + quizCompletedSum;
  const totalItemsExpected = experimentExpectedSum + quizExpectedSum;
  const completionPct =
    totalItemsExpected > 0
      ? Math.min(
          100,
          Math.round((totalItemsCompleted / totalItemsExpected) * 100),
        )
      : 0;
  const experimentCompletionPct =
    experimentExpectedSum > 0
      ? Math.min(
          100,
          Math.round((experimentCompletedSum / experimentExpectedSum) * 100),
        )
      : 0;
  const quizCompletionPct =
    quizExpectedSum > 0
      ? Math.min(
          100,
          Math.round((quizCompletedSum / quizExpectedSum) * 100),
        )
      : 0;
  return {
    schoolCount: schoolsInScope.size,
    classCount: classesInScope.size,
    studentCount,
    totalItemsCompleted,
    totalItemsExpected,
    completionPct,
    experimentFullyDoneStudentCount,
    quizFullyDoneStudentCount,
    experimentTotalCount: experimentExpectedSum,
    experimentCompletedCount: experimentCompletedSum,
    experimentCompletionPct,
    quizTotalCount: quizExpectedSum,
    quizCompletedCount: quizCompletedSum,
    quizCompletionPct,
  };
});

/** 总课时 = 当前筛选范围内班级数 × 每班课时；已完成与完成率与实验/测验整体进度联动 */
const regionOpeningLessonStats = computed(() => {
  const totalLessonHours = kpi.value.classCount * LESSON_HOURS_PER_CLASS;
  const pct = kpi.value.completionPct;
  const completedLessonHours =
    totalLessonHours > 0
      ? Math.min(
          totalLessonHours,
          Math.round((totalLessonHours * pct) / 100),
        )
      : 0;
  const lessonHoursCompletionPct =
    totalLessonHours > 0
      ? Math.min(
          100,
          Math.round((completedLessonHours / totalLessonHours) * 100),
        )
      : 0;
  return {
    totalLessonHours,
    completedLessonHours,
    lessonHoursCompletionPct,
  };
});

const progressTiles = computed(() => {
  if (schoolId.value) {
    const sch = schoolById(schoolId.value);
    if (!sch) {
      return [];
    }
    return classesForSchool(schoolId.value).map((c) => {
      const stu = studentsForClassIds(new Set([c.id]));
      return buildProgressTileRow(c.name, stu, 1);
    });
  }
  return schoolsForScope(
    provinceId.value,
    cityId.value,
    districtId.value,
  ).map((sch) => {
    const cids = new Set(
      BUREAU_CLASSES.filter((c) => c.schoolId === sch.id).map((c) => c.id),
    );
    const stu = studentsForClassIds(cids);
    const classCountForLessons = classesForSchool(sch.id).length;
    return buildProgressTileRow(sch.name, stu, classCountForLessons);
  });
});

const TREND_WEEK_COUNT = 8;

/** 按周次平滑爬升曲线（终点为当前筛选下该维度全完成人数） */
function buildWeeklySmoothTrend(end: number): { label: string; value: number }[] {
  const weeks = TREND_WEEK_COUNT;
  const out: { label: string; value: number }[] = [];
  const last = weeks - 1;
  for (let i = 0; i < weeks; i++) {
    const t = last === 0 ? 1 : i / last;
    const start = Math.max(0, Math.round(end * 0.22));
    const v = Math.round(start + (end - start) * (t * t));
    out.push({ label: `第${i + 1}周`, value: i === last ? end : v });
  }
  return out;
}

const experimentStudentTrendPoints = computed(() =>
  buildWeeklySmoothTrend(kpi.value.experimentFullyDoneStudentCount),
);

const quizStudentTrendPoints = computed(() =>
  buildWeeklySmoothTrend(kpi.value.quizFullyDoneStudentCount),
);

const schoolLessonChartRows = computed(() =>
  progressTiles.value.map((row) => ({
    label: row.label,
    totalLessonHours: row.totalLessonHours,
    completedLessonHours: row.completedLessonHours,
    completionPct: row.lessonHoursCompletionPct,
  })),
);

const schoolLessonChartTitle = computed(() =>
  schoolId.value ? "各班级开课情况" : "各学校开课情况",
);

/** 省 / 市 / 区：合并为一个级联下拉 */
const regionPanelOpen = ref(false);
const regionCascaderRef = ref<HTMLElement | null>(null);

const regionSummaryText = computed(() => {
  if (!provinceId.value && !cityId.value && !districtId.value) {
    return "请选择省 / 市 / 区（县）";
  }
  const parts: string[] = [];
  if (provinceId.value) {
    parts.push(provinceById(provinceId.value)?.name ?? "");
  }
  if (cityId.value) {
    parts.push(cityById(cityId.value)?.name ?? "");
  }
  if (districtId.value) {
    parts.push(regionById(districtId.value)?.name ?? "");
  }
  return parts.filter(Boolean).join(" · ") || "请选择省 / 市 / 区（县）";
});

function closeRegionPanel() {
  regionPanelOpen.value = false;
}

function onRegionDocClick(e: MouseEvent) {
  const root = regionCascaderRef.value;
  if (!regionPanelOpen.value || !root) {
    return;
  }
  if (!root.contains(e.target as Node)) {
    regionPanelOpen.value = false;
  }
}

function onRegionKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    regionPanelOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", onRegionDocClick, true);
  document.addEventListener("keydown", onRegionKeydown);
});

onUnmounted(() => {
  document.removeEventListener("click", onRegionDocClick, true);
  document.removeEventListener("keydown", onRegionKeydown);
});
</script>

<template>
  <div class="edu-viz flex min-h-0 flex-col gap-6 pb-8 text-slate-800">
    <!-- 筛选：省市区 + 学校 + 班级 -->
    <div
      class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm"
    >
      <p class="mb-3 text-[12px] font-medium text-slate-500">筛选范围</p>
      <div
        class="flex flex-wrap items-end gap-3"
      >
        <div
          ref="regionCascaderRef"
          class="relative min-w-[min(100%,280px)] flex-1 sm:max-w-[420px]"
        >
          <label class="mb-1 block text-[11px] text-slate-500">省 / 市 / 区（县）</label>
          <button
            type="button"
            class="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-[14px] text-slate-800 outline-none ring-primary/30 transition hover:border-slate-300 focus:ring-2"
            :class="regionPanelOpen ? 'border-primary/40 ring-2 ring-primary/25' : ''"
            :aria-expanded="regionPanelOpen"
            aria-haspopup="listbox"
            @click.stop="regionPanelOpen = !regionPanelOpen"
          >
            <span
              class="min-w-0 flex-1 truncate"
              :class="
                provinceId || cityId || districtId ? 'text-slate-900' : 'text-slate-400'
              "
            >{{ regionSummaryText }}</span>
            <span
              class="shrink-0 text-slate-400 transition"
              :class="regionPanelOpen ? 'rotate-180' : ''"
              aria-hidden="true"
            >▼</span>
          </button>

          <div
            v-show="regionPanelOpen"
            class="absolute left-0 right-0 top-full z-[60] mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black/[0.06] sm:right-auto sm:w-[min(100vw-2rem,520px)]"
            role="dialog"
            aria-label="选择省市区"
            @click.stop
          >
            <div class="grid max-h-[min(70vh,280px)] grid-cols-3 divide-x divide-slate-100">
              <!-- 省 -->
              <div class="flex min-h-0 min-w-0 flex-col">
                <p class="shrink-0 border-b border-slate-100 bg-slate-50 px-2 py-1.5 text-[11px] font-medium text-slate-500">
                  省
                </p>
                <ul class="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
                  <li>
                    <button
                      type="button"
                      class="w-full px-2.5 py-2 text-left text-[13px] transition"
                      :class="
                        !provinceId
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-slate-700 hover:bg-slate-50'
                      "
                      @click="provinceId = ''"
                    >
                      全部省
                    </button>
                  </li>
                  <li
                    v-for="p in BUREAU_PROVINCES"
                    :key="p.id"
                  >
                    <button
                      type="button"
                      class="w-full px-2.5 py-2 text-left text-[13px] transition"
                      :class="
                        provinceId === p.id
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-slate-700 hover:bg-slate-50'
                      "
                      @click="provinceId = p.id"
                    >
                      {{ p.name }}
                    </button>
                  </li>
                </ul>
              </div>
              <!-- 市 -->
              <div class="flex min-h-0 min-w-0 flex-col">
                <p class="shrink-0 border-b border-slate-100 bg-slate-50 px-2 py-1.5 text-[11px] font-medium text-slate-500">
                  市
                </p>
                <ul class="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
                  <li>
                    <button
                      type="button"
                      class="w-full px-2.5 py-2 text-left text-[13px] transition"
                      :class="
                        !cityId
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-slate-700 hover:bg-slate-50'
                      "
                      @click="cityId = ''"
                    >
                      全部市
                    </button>
                  </li>
                  <li
                    v-for="c in cityOptions"
                    :key="c.id"
                  >
                    <button
                      type="button"
                      class="w-full px-2.5 py-2 text-left text-[13px] transition"
                      :class="
                        cityId === c.id
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-slate-700 hover:bg-slate-50'
                      "
                      @click="cityId = c.id"
                    >
                      {{ c.name }}
                    </button>
                  </li>
                </ul>
              </div>
              <!-- 区/县 -->
              <div class="flex min-h-0 min-w-0 flex-col">
                <p class="shrink-0 border-b border-slate-100 bg-slate-50 px-2 py-1.5 text-[11px] font-medium text-slate-500">
                  区/县
                </p>
                <ul class="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
                  <li>
                    <button
                      type="button"
                      class="w-full px-2.5 py-2 text-left text-[13px] transition"
                      :class="
                        !districtId
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-slate-700 hover:bg-slate-50'
                      "
                      @click="districtId = ''; closeRegionPanel()"
                    >
                      全部区县
                    </button>
                  </li>
                  <li
                    v-for="r in districtOptions"
                    :key="r.id"
                  >
                    <button
                      type="button"
                      class="w-full px-2.5 py-2 text-left text-[13px] transition"
                      :class="
                        districtId === r.id
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-slate-700 hover:bg-slate-50'
                      "
                      @click="districtId = r.id; closeRegionPanel()"
                    >
                      {{ r.name }}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
            <div class="flex justify-end border-t border-slate-100 bg-slate-50/90 px-2 py-2">
              <button
                type="button"
                class="rounded-lg px-3 py-1.5 text-[12px] font-medium text-primary transition hover:bg-primary/10"
                @click="closeRegionPanel"
              >
                完成
              </button>
            </div>
          </div>
        </div>
        <div class="min-w-[140px] flex-1 sm:max-w-[200px]">
          <label class="mb-1 block text-[11px] text-slate-500">学校</label>
          <select
            v-model="schoolId"
            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[14px] text-slate-800 outline-none ring-primary/30 focus:ring-2"
          >
            <option value="">全部学校</option>
            <option
              v-for="s in schoolOptions"
              :key="s.id"
              :value="s.id"
            >
              {{ s.name }}
            </option>
          </select>
        </div>
        <div class="min-w-[120px] flex-1 sm:max-w-[180px]">
          <label class="mb-1 block text-[11px] text-slate-500">班级</label>
          <select
            v-model="classId"
            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[14px] text-slate-800 outline-none ring-primary/30 focus:ring-2"
          >
            <option value="">全部班级</option>
            <option
              v-for="c in classOptions"
              :key="c.id"
              :value="c.id"
            >
              {{ c.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
      <p class="mb-3 text-[12px] font-medium text-slate-500">
        管辖范围概览
      </p>
      <div
        class="grid grid-cols-3 gap-2 rounded-xl bg-slate-50/80 p-3 sm:gap-3 sm:p-4"
      >
        <div class="min-w-0 text-center sm:text-left">
          <p
            class="text-[10px] font-medium leading-snug text-sky-800/85 sm:text-[11px]"
          >
            开通学校数量
          </p>
          <p class="mt-1 text-2xl font-bold tabular-nums text-sky-950 sm:text-3xl">
            {{ kpi.schoolCount }}
          </p>
          <p class="text-[11px] text-slate-400">所</p>
        </div>
        <div
          class="min-w-0 border-x border-slate-200/80 px-2 text-center sm:px-3 sm:text-left"
        >
          <p
            class="text-[10px] font-medium leading-snug text-violet-800/85 sm:text-[11px]"
          >
            使用班级数量
          </p>
          <p class="mt-1 text-2xl font-bold tabular-nums text-violet-950 sm:text-3xl">
            {{ kpi.classCount }}
          </p>
          <p class="text-[11px] text-slate-400">个</p>
        </div>
        <div class="min-w-0 text-center sm:text-left">
          <p
            class="text-[10px] font-medium leading-snug text-emerald-800/85 sm:text-[11px]"
          >
            学生数量
          </p>
          <p class="mt-1 text-2xl font-bold tabular-nums text-emerald-950 sm:text-3xl">
            {{ kpi.studentCount }}
          </p>
          <p class="text-[11px] text-slate-400">人</p>
        </div>
      </div>
    </div>

    <!-- 开课 + 实验/测验统计（md+ 同一行、紧凑） -->
    <div class="grid gap-3 md:grid-cols-2 md:items-stretch md:gap-4">
      <section
        class="flex min-h-0 flex-col rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4"
      >
        <h3 class="text-[13px] font-semibold leading-tight text-slate-900 sm:text-sm">
          开课情况统计（班）
        </h3>
        <p class="mt-0.5 text-[11px] leading-snug text-slate-500">
          筛选范围内 · 每班 {{ LESSON_HOURS_PER_CLASS }} 课时
        </p>
        <div
          class="mt-2 grid flex-1 grid-cols-3 gap-1.5 rounded-lg bg-slate-50/90 p-2 sm:gap-2 sm:p-2.5"
        >
          <div class="min-w-0 text-center sm:text-left">
            <p class="text-[9px] font-medium leading-tight text-amber-900/85 sm:text-[10px]">
              总课时数
            </p>
            <p
              class="mt-0.5 text-xl font-bold tabular-nums leading-none text-amber-950 sm:text-2xl"
            >
              {{ regionOpeningLessonStats.totalLessonHours }}
            </p>
            <p class="mt-0.5 text-[10px] text-slate-400">课时</p>
          </div>
          <div
            class="min-w-0 border-l border-slate-200/80 pl-1.5 text-center sm:pl-2 sm:text-left"
          >
            <p class="text-[9px] font-medium leading-tight text-teal-900/85 sm:text-[10px]">
              已完成课时数
            </p>
            <p
              class="mt-0.5 text-xl font-bold tabular-nums leading-none text-teal-950 sm:text-2xl"
            >
              {{ regionOpeningLessonStats.completedLessonHours }}
            </p>
            <p class="mt-0.5 text-[10px] text-slate-400">课时</p>
          </div>
          <div
            class="min-w-0 border-l border-slate-200/80 pl-1.5 text-center sm:pl-2 sm:text-left"
          >
            <p class="text-[9px] font-medium leading-tight text-rose-900/80 sm:text-[10px]">
              完成率
            </p>
            <p
              class="mt-0.5 text-xl font-bold tabular-nums leading-none text-rose-950 sm:text-2xl"
            >
              {{ regionOpeningLessonStats.lessonHoursCompletionPct }}%
            </p>
          </div>
        </div>
      </section>

      <section
        class="flex min-h-0 flex-col rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4"
      >
        <h3 class="text-[13px] font-semibold leading-tight text-slate-900 sm:text-sm">
          实验情况统计（学生）
        </h3>
        <p class="mt-0.5 text-[11px] leading-snug text-slate-500">
          筛选范围内 · 每人各 {{ EXPERIMENTS_PER_STUDENT }} 个实验与测验
        </p>
        <div
          class="mt-2 space-y-1.5 rounded-lg bg-slate-50/90 p-2 sm:space-y-2 sm:p-2.5"
        >
          <div class="grid grid-cols-3 gap-1.5 sm:gap-2">
            <div class="min-w-0 text-center sm:text-left">
              <p class="text-[9px] font-medium leading-tight text-indigo-900/85 sm:text-[10px]">
                总实验数
              </p>
              <p
                class="mt-0.5 text-xl font-bold tabular-nums leading-none text-indigo-950 sm:text-2xl"
              >
                {{ kpi.experimentTotalCount }}
              </p>
              <p class="mt-0.5 text-[10px] text-slate-400">个</p>
            </div>
            <div
              class="min-w-0 border-l border-slate-200/80 pl-1.5 text-center sm:pl-2 sm:text-left"
            >
              <p class="text-[9px] font-medium leading-tight text-cyan-900/85 sm:text-[10px]">
                已完成实验数
              </p>
              <p
                class="mt-0.5 text-xl font-bold tabular-nums leading-none text-cyan-950 sm:text-2xl"
              >
                {{ kpi.experimentCompletedCount }}
              </p>
              <p class="mt-0.5 text-[10px] text-slate-400">个</p>
            </div>
            <div
              class="min-w-0 border-l border-slate-200/80 pl-1.5 text-center sm:pl-2 sm:text-left"
            >
              <p class="text-[9px] font-medium leading-tight text-fuchsia-900/80 sm:text-[10px]">
                实验完成率
              </p>
              <p
                class="mt-0.5 text-xl font-bold tabular-nums leading-none text-fuchsia-950 sm:text-2xl"
              >
                {{ kpi.experimentCompletionPct }}%
              </p>
            </div>
          </div>
          <div
            class="grid grid-cols-3 gap-1.5 border-t border-slate-200/70 pt-1.5 sm:gap-2 sm:pt-2"
          >
            <div class="min-w-0 text-center sm:text-left">
              <p class="text-[9px] font-medium leading-tight text-orange-900/85 sm:text-[10px]">
                测验数
              </p>
              <p
                class="mt-0.5 text-xl font-bold tabular-nums leading-none text-orange-950 sm:text-2xl"
              >
                {{ kpi.quizTotalCount }}
              </p>
              <p class="mt-0.5 text-[10px] text-slate-400">个</p>
            </div>
            <div
              class="min-w-0 border-l border-slate-200/80 pl-1.5 text-center sm:pl-2 sm:text-left"
            >
              <p class="text-[9px] font-medium leading-tight text-amber-900/85 sm:text-[10px]">
                测验完成数
              </p>
              <p
                class="mt-0.5 text-xl font-bold tabular-nums leading-none text-amber-950 sm:text-2xl"
              >
                {{ kpi.quizCompletedCount }}
              </p>
              <p class="mt-0.5 text-[10px] text-slate-400">个</p>
            </div>
            <div
              class="min-w-0 border-l border-slate-200/80 pl-1.5 text-center sm:pl-2 sm:text-left"
            >
              <p class="text-[9px] font-medium leading-tight text-violet-900/85 sm:text-[10px]">
                测验完成率
              </p>
              <p
                class="mt-0.5 text-xl font-bold tabular-nums leading-none text-violet-950 sm:text-2xl"
              >
                {{ kpi.quizCompletionPct }}%
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 数据视图（在辖区进度卡片之上） -->
    <section>
      <div class="mb-3 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="text-[15px] font-semibold text-slate-900">
            数据视图
          </h3>
          <p class="mt-0.5 text-[12px] text-slate-500">
            左：实验与测验全完成人数分维度按周趋势；右：各校（班）开课课时与完成率
          </p>
        </div>
      </div>
      <EduBureauDataCharts
        :experiment-trend-points="experimentStudentTrendPoints"
        :quiz-trend-points="quizStudentTrendPoints"
        :school-lesson-rows="schoolLessonChartRows"
        :school-lesson-title="schoolLessonChartTitle"
      />
    </section>

    <!-- 辖区进度 -->
    <section>
      <div class="mb-3 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="text-[15px] font-semibold text-slate-900">
            辖区{{ schoolId ? "班级" : "学校" }}统计进度
          </h3>
          <p class="mt-0.5 text-[12px] text-slate-500">
            {{ schoolId ? "当前学校下各班级" : "按学校汇总" }} · 卡片：开课课时（班）、实验与测验（学生）
          </p>
        </div>
      </div>
      <ul
        class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        <li
          v-for="(row, i) in progressTiles"
          :key="i"
          class="flex max-w-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white to-slate-50/90 shadow-sm ring-1 ring-slate-900/[0.03] transition-shadow duration-200 hover:border-slate-300/80 hover:shadow-md"
        >
          <div
            class="border-b border-slate-100/90 bg-white/80 px-4 pb-3 pt-4 sm:px-5 sm:pb-3.5 sm:pt-5"
          >
            <p
              class="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-slate-900 sm:text-base"
              :title="row.label"
            >
              {{ row.label }}
            </p>
            <div class="mt-2.5 flex flex-wrap items-center gap-2">
              <span
                class="inline-flex items-center rounded-full bg-slate-100/90 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 tabular-nums"
              >
                {{ row.n }} 人
              </span>
              <span
                v-if="!schoolId"
                class="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-medium text-sky-700/90 tabular-nums ring-1 ring-sky-100"
              >
                {{ row.classCountForLessons }} 个班
              </span>
            </div>
          </div>

          <div class="flex flex-1 flex-col gap-2.5 p-3 sm:gap-3 sm:p-4">
            <div
              class="rounded-xl border border-sky-100/80 bg-sky-50/35 p-2.5 ring-1 ring-sky-900/[0.04] sm:p-3"
            >
              <div class="mb-1.5 flex items-center gap-2">
                <span
                  class="size-1.5 shrink-0 rounded-full bg-sky-500 shadow-sm shadow-sky-200"
                  aria-hidden="true"
                />
                <p class="text-[11px] font-semibold text-slate-700">
                  开课课时（班）
                </p>
              </div>
              <div
                class="grid grid-cols-3 gap-1.5 tabular-nums sm:gap-2"
              >
                <div class="rounded-lg bg-white/70 px-1 py-1.5 text-center shadow-sm ring-1 ring-slate-900/[0.03] sm:px-1.5">
                  <p class="text-[10px] leading-none text-slate-500">总</p>
                  <p class="mt-1 flex flex-wrap items-baseline justify-center gap-0.5 leading-none">
                    <span class="text-[13px] font-semibold text-slate-900 sm:text-sm">{{ row.totalLessonHours }}</span>
                    <span class="text-[10px] font-normal text-slate-400">课时</span>
                  </p>
                </div>
                <div class="rounded-lg bg-white/70 px-1 py-1.5 text-center shadow-sm ring-1 ring-slate-900/[0.03] sm:px-1.5">
                  <p class="text-[10px] leading-none text-slate-500">已完</p>
                  <p class="mt-1 flex flex-wrap items-baseline justify-center gap-0.5 leading-none">
                    <span class="text-[13px] font-semibold text-sky-800 sm:text-sm">{{ row.completedLessonHours }}</span>
                    <span class="text-[10px] font-normal text-slate-400">课时</span>
                  </p>
                </div>
                <div class="rounded-lg bg-white/70 px-1 py-1.5 text-center shadow-sm ring-1 ring-slate-900/[0.03] sm:px-1.5">
                  <p class="text-[10px] leading-none text-slate-500">完成率</p>
                  <p class="mt-1 text-[13px] font-semibold leading-none text-sky-700 sm:text-sm">
                    {{ row.lessonHoursCompletionPct }}%
                  </p>
                </div>
              </div>
            </div>

            <div
              class="rounded-xl border border-violet-100/80 bg-violet-50/30 p-2.5 ring-1 ring-violet-900/[0.04] sm:p-3"
            >
              <div class="mb-1.5 flex items-center gap-2">
                <span
                  class="size-1.5 shrink-0 rounded-full bg-violet-500 shadow-sm shadow-violet-200"
                  aria-hidden="true"
                />
                <p class="text-[11px] font-semibold text-slate-700">
                  实验（学生）
                </p>
              </div>
              <div
                class="grid grid-cols-3 gap-1.5 tabular-nums sm:gap-2"
              >
                <div class="rounded-lg bg-white/70 px-1 py-1.5 text-center shadow-sm ring-1 ring-slate-900/[0.03] sm:px-1.5">
                  <p class="text-[10px] leading-none text-slate-500">总</p>
                  <p class="mt-1 flex flex-wrap items-baseline justify-center gap-0.5 leading-none">
                    <span class="text-[13px] font-semibold text-slate-900 sm:text-sm">{{ row.experimentTotalCount }}</span>
                    <span class="text-[10px] font-normal text-slate-400">个</span>
                  </p>
                </div>
                <div class="rounded-lg bg-white/70 px-1 py-1.5 text-center shadow-sm ring-1 ring-slate-900/[0.03] sm:px-1.5">
                  <p class="text-[10px] leading-none text-slate-500">已完</p>
                  <p class="mt-1 flex flex-wrap items-baseline justify-center gap-0.5 leading-none">
                    <span class="text-[13px] font-semibold text-violet-800 sm:text-sm">{{ row.experimentCompletedCount }}</span>
                    <span class="text-[10px] font-normal text-slate-400">个</span>
                  </p>
                </div>
                <div class="rounded-lg bg-white/70 px-1 py-1.5 text-center shadow-sm ring-1 ring-slate-900/[0.03] sm:px-1.5">
                  <p class="text-[10px] leading-none text-slate-500">完成率</p>
                  <p class="mt-1 text-[13px] font-semibold leading-none text-violet-700 sm:text-sm">
                    {{ row.experimentCompletionPct }}%
                  </p>
                </div>
              </div>
            </div>

            <div
              class="rounded-xl border border-emerald-100/80 bg-emerald-50/30 p-2.5 ring-1 ring-emerald-900/[0.04] sm:p-3"
            >
              <div class="mb-1.5 flex items-center gap-2">
                <span
                  class="size-1.5 shrink-0 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"
                  aria-hidden="true"
                />
                <p class="text-[11px] font-semibold text-slate-700">
                  测验（学生）
                </p>
              </div>
              <div
                class="grid grid-cols-3 gap-1.5 tabular-nums sm:gap-2"
              >
                <div class="rounded-lg bg-white/70 px-1 py-1.5 text-center shadow-sm ring-1 ring-slate-900/[0.03] sm:px-1.5">
                  <p class="text-[10px] leading-none text-slate-500">总</p>
                  <p class="mt-1 flex flex-wrap items-baseline justify-center gap-0.5 leading-none">
                    <span class="text-[13px] font-semibold text-slate-900 sm:text-sm">{{ row.quizTotalCount }}</span>
                    <span class="text-[10px] font-normal text-slate-400">个</span>
                  </p>
                </div>
                <div class="rounded-lg bg-white/70 px-1 py-1.5 text-center shadow-sm ring-1 ring-slate-900/[0.03] sm:px-1.5">
                  <p class="text-[10px] leading-none text-slate-500">已完</p>
                  <p class="mt-1 flex flex-wrap items-baseline justify-center gap-0.5 leading-none">
                    <span class="text-[13px] font-semibold text-emerald-800 sm:text-sm">{{ row.quizCompletedCount }}</span>
                    <span class="text-[10px] font-normal text-slate-400">个</span>
                  </p>
                </div>
                <div class="rounded-lg bg-white/70 px-1 py-1.5 text-center shadow-sm ring-1 ring-slate-900/[0.03] sm:px-1.5">
                  <p class="text-[10px] leading-none text-slate-500">完成率</p>
                  <p class="mt-1 text-[13px] font-semibold leading-none text-emerald-700 sm:text-sm">
                    {{ row.quizCompletionPct }}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.edu-viz {
  font-feature-settings: "tnum" 1;
}
</style>
