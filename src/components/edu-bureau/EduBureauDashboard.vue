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

/** 课程内实验个数（演示）：实验与测验均按此数量折算人次完成项 */
const EXPERIMENTS_PER_STUDENT = 10;

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
  return {
    totalDone,
    totalExpected,
    completionPct,
    fullyDoneCount,
    n,
  };
}

const kpi = computed(() => {
  const studs = filteredStudents.value;
  const schoolsInScope = new Set<string>();
  const classesInScope = new Set<string>();
  let experimentCompletedSum = 0;
  let quizCompletedSum = 0;
  let fullyCompletedStudentCount = 0;
  for (const st of studs) {
    const cl = classById(st.classId);
    if (cl) {
      classesInScope.add(cl.id);
      schoolsInScope.add(cl.schoolId);
    }
    experimentCompletedSum += experimentDoneCount(st);
    quizCompletedSum += quizDoneCount(st);
    if (isExperimentAndQuizFullyDone(st)) {
      fullyCompletedStudentCount += 1;
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
  return {
    schoolCount: schoolsInScope.size,
    classCount: classesInScope.size,
    studentCount,
    totalItemsCompleted,
    totalItemsExpected,
    completionPct,
    fullyCompletedStudentCount,
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
      return {
        label: c.name,
        ...aggregateDoneForStudents(stu),
      };
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
    return {
      label: sch.name,
      ...aggregateDoneForStudents(stu),
    };
  });
});

/** 演示：当前筛选下「实验+测验均完成」人数，按周次平滑爬升曲线 */
const completionTrendPoints = computed(() => {
  const end = kpi.value.fullyCompletedStudentCount;
  const weeks = 8;
  const out: { label: string; value: number }[] = [];
  const last = weeks - 1;
  for (let i = 0; i < weeks; i++) {
    const t = last === 0 ? 1 : i / last;
    const start = Math.max(0, Math.round(end * 0.22));
    const v = Math.round(start + (end - start) * (t * t));
    out.push({ label: `第${i + 1}周`, value: i === last ? end : v });
  }
  return out;
});

const barChartRows = computed(() =>
  progressTiles.value.map((row) => ({
    label: row.label,
    pct: row.completionPct,
    sub: `${row.totalDone}/${row.totalExpected} 项`,
  })),
);

const barChartTitle = computed(() =>
  schoolId.value ? "各班级项完成率（%）" : "各学校项完成率（%）",
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

    <!-- 管辖概览 + 实验&测验完成数：同一行（大屏并排） -->
    <div
      class="grid gap-4 lg:grid-cols-12 lg:items-stretch"
    >
      <div
        class="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5 lg:col-span-5"
      >
        <p class="mb-3 text-[12px] font-medium text-slate-500">
          管辖范围概览
        </p>
        <div
          class="grid flex-1 grid-cols-3 gap-2 rounded-xl bg-slate-50/80 p-3 sm:gap-3 sm:p-4"
        >
          <div class="text-center sm:text-left">
            <p class="text-[11px] text-sky-800/85">学校</p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-sky-950 sm:text-3xl">
              {{ kpi.schoolCount }}
            </p>
            <p class="text-[11px] text-slate-400">所</p>
          </div>
          <div class="border-x border-slate-200/80 px-2 text-center sm:px-3 sm:text-left">
            <p class="text-[11px] text-violet-800/85">班级</p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-violet-950 sm:text-3xl">
              {{ kpi.classCount }}
            </p>
            <p class="text-[11px] text-slate-400">个</p>
          </div>
          <div class="text-center sm:text-left">
            <p class="text-[11px] text-emerald-800/85">学生</p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-emerald-950 sm:text-3xl">
              {{ kpi.studentCount }}
            </p>
            <p class="text-[11px] text-slate-400">人</p>
          </div>
        </div>
      </div>

      <div
        class="flex flex-col rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/95 via-white to-violet-50/40 p-4 shadow-sm sm:p-5 lg:col-span-7"
      >
        <div class="mb-3 flex items-start justify-between gap-3">
          <p class="min-w-0 text-[13px] font-semibold text-indigo-950">
            实验 &amp; 测验 · 完成情况
          </p>
          <p
            class="shrink-0 text-right text-[11px] leading-snug text-slate-500"
          >
            项（实验+测验）
          </p>
        </div>

        <div
          class="grid flex-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-5"
        >
          <div class="tabular-nums">
            <p class="text-[11px] text-indigo-900/70">实验与测验 · 累计完成 / 应完成</p>
            <p class="mt-1 flex flex-wrap items-baseline gap-1">
              <span class="text-3xl font-bold tracking-tight text-indigo-800 sm:text-[2.1rem]">{{
                kpi.totalItemsCompleted
              }}</span>
              <span class="text-lg text-indigo-300">/</span>
              <span class="text-xl font-semibold text-slate-700">{{
                kpi.totalItemsExpected
              }}</span>
              <span class="text-[12px] text-slate-500">项</span>
            </p>
            <div
              class="mt-3 flex items-center gap-2"
            >
              <div
                class="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-indigo-100/90"
                role="presentation"
              >
                <div
                  class="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 transition-[width]"
                  :style="{
                    width: `${
                      kpi.totalItemsExpected > 0
                        ? Math.min(
                            100,
                            (kpi.totalItemsCompleted / kpi.totalItemsExpected) * 100,
                          )
                        : 0
                    }%`,
                  }"
                />
              </div>
              <span
                class="shrink-0 min-w-[2.75rem] text-right text-[13px] font-bold tabular-nums text-indigo-800"
              >{{ kpi.completionPct }}%</span>
            </div>
          </div>

          <div
            class="flex flex-col justify-center gap-2 rounded-xl border border-white/80 bg-white/60 p-3 text-[12px] shadow-sm ring-1 ring-indigo-100/60"
          >
            <div
              class="flex items-center justify-between gap-2 border-b border-indigo-100/80 pb-2 tabular-nums"
            >
              <span class="font-medium text-indigo-900/90">完成</span>
              <span>
                <span class="text-base font-bold text-indigo-800">{{
                  kpi.fullyCompletedStudentCount
                }}</span>
                <span class="text-slate-400">/</span>
                <span class="font-medium text-slate-700">{{ kpi.studentCount }}</span>
                <span class="text-slate-400">人</span>
              </span>
            </div>
            <p class="text-[11px] leading-relaxed text-slate-500">
              备注：为「一名学生实验与测验均已完成」的人数
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据视图（在辖区进度卡片之上） -->
    <section>
      <div class="mb-3 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="text-[15px] font-semibold text-slate-900">
            数据视图
          </h3>
          <p class="mt-0.5 text-[12px] text-slate-500">
            趋势为演示累计曲线；柱状为各校/各班项完成率（%）
          </p>
        </div>
        <p
          class="shrink-0 text-right text-[11px] leading-snug text-slate-500"
        >
          项（实验+测验）
        </p>
      </div>
      <EduBureauDataCharts
        :trend-points="completionTrendPoints"
        :bar-rows="barChartRows"
        :bar-title="barChartTitle"
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
            {{ schoolId ? "当前学校下各班级" : "按学校汇总" }} · 实验与测验合并为累计项；百分比为项完成率；「完成」为实验与测验均满项人数
          </p>
        </div>
        <p
          class="shrink-0 text-right text-[11px] leading-snug text-slate-500"
        >
          项（实验+测验）
        </p>
      </div>
      <ul
        class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        <li
          v-for="(row, i) in progressTiles"
          :key="i"
          class="flex max-w-full flex-col rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm ring-1 ring-black/[0.02]"
        >
          <p
            class="line-clamp-2 min-h-[2.5rem] text-[13px] font-medium leading-snug text-slate-900"
            :title="row.label"
          >
            {{ row.label }}
          </p>
          <p class="mt-2 text-[11px] text-slate-400">{{ row.n }} 人</p>
          <div class="mt-2 space-y-2 border-t border-slate-100 pt-2 text-[12px]">
            <div class="flex justify-between gap-2 tabular-nums">
              <span class="text-slate-600">实验与测验</span>
              <span class="font-semibold text-indigo-800">
                {{ row.totalDone }} / {{ row.totalExpected }} 项
              </span>
            </div>
            <div class="flex items-center gap-2">
              <div
                class="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100"
                role="presentation"
              >
                <div
                  class="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 transition-[width]"
                  :style="{ width: `${row.completionPct}%` }"
                />
              </div>
              <span class="shrink-0 text-[11px] font-bold tabular-nums text-indigo-800"
                >{{ row.completionPct }}%</span
              >
            </div>
            <div class="flex justify-between gap-2 border-t border-slate-50 pt-1.5 tabular-nums">
              <span class="text-slate-600">完成</span>
              <span class="font-bold text-indigo-700">
                {{ row.fullyDoneCount }} / {{ row.n }} 人
              </span>
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
