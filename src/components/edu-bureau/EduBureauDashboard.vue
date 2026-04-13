<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { EduBureauSession } from "@/utils/eduBureauAuth";
import { maskPhone } from "@/utils/eduBureauAuth";
import {
  BUREAU_CLASSES,
  BUREAU_REGIONS,
  classById,
  classIdsForFilters,
  classesForSchool,
  regionById,
  schoolById,
  schoolsForRegion,
  studentsForClassIds,
  type BureauStudent,
} from "@/data/eduBureauMock";

const props = defineProps<{
  session: EduBureauSession;
}>();

const emit = defineEmits<{
  logout: [];
}>();

const regionId = ref<string | "">("");
const schoolId = ref<string | "">("");
const classId = ref<string | "">("");

watch(regionId, () => {
  schoolId.value = "";
  classId.value = "";
});

watch(schoolId, () => {
  classId.value = "";
});

const schoolOptions = computed(() => schoolsForRegion(regionId.value));
const classOptions = computed(() => {
  if (schoolId.value) {
    return classesForSchool(schoolId.value);
  }
  if (regionId.value) {
    const sids = new Set(schoolOptions.value.map((s) => s.id));
    return classesForSchool("").filter((c) => sids.has(c.schoolId));
  }
  return classesForSchool("");
});

const filteredStudents = computed((): BureauStudent[] => {
  const ids = classIdsForFilters(
    regionId.value,
    schoolId.value,
    classId.value,
  );
  return studentsForClassIds(ids);
});

/** 每人应完成项数（演示）：用于将完成度折算为人次完成数 */
const EXPERIMENT_ITEMS_PER_STUDENT = 10;
const QUIZ_ITEMS_PER_STUDENT = 8;

function experimentDoneCount(s: BureauStudent): number {
  return Math.round((s.experimentPct / 100) * EXPERIMENT_ITEMS_PER_STUDENT);
}

function quizDoneCount(s: BureauStudent): number {
  return Math.round((s.quizPct / 100) * QUIZ_ITEMS_PER_STUDENT);
}

/** 实验、测验两项均达到每人应完成项数（折算后） */
function isExperimentAndQuizFullyDone(s: BureauStudent): boolean {
  return (
    experimentDoneCount(s) === EXPERIMENT_ITEMS_PER_STUDENT &&
    quizDoneCount(s) === QUIZ_ITEMS_PER_STUDENT
  );
}

/** 一组学生：实验/测验项数累计 +「每人 1 套实验任务，双项均完成计 1」人数 */
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
  const expExpected = n * EXPERIMENT_ITEMS_PER_STUDENT;
  const quizExpected = n * QUIZ_ITEMS_PER_STUDENT;
  return {
    expDone,
    expExpected,
    quizDone,
    quizExpected,
    /** 实验与测验均完成人数（1 人最多计 1 次完成） */
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
  const experimentExpectedSum = studentCount * EXPERIMENT_ITEMS_PER_STUDENT;
  const quizExpectedSum = studentCount * QUIZ_ITEMS_PER_STUDENT;
  const totalItemsCompleted = experimentCompletedSum + quizCompletedSum;
  const totalItemsExpected = experimentExpectedSum + quizExpectedSum;
  return {
    schoolCount: schoolsInScope.size,
    classCount: classesInScope.size,
    studentCount,
    experimentCompletedSum,
    quizCompletedSum,
    experimentExpectedSum,
    quizExpectedSum,
    totalItemsCompleted,
    totalItemsExpected,
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
  return schoolsForRegion(regionId.value).map((sch) => {
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

function rowSchoolName(student: BureauStudent): string {
  const cl = classById(student.classId);
  const sch = cl ? schoolById(cl.schoolId) : undefined;
  return sch?.name ?? "—";
}

function rowClassName(student: BureauStudent): string {
  return classById(student.classId)?.name ?? "—";
}

function rowRegionName(student: BureauStudent): string {
  const cl = classById(student.classId);
  const sch = cl ? schoolById(cl.schoolId) : undefined;
  const r = sch ? regionById(sch.regionId) : undefined;
  return r?.name ?? "—";
}
</script>

<template>
  <div class="edu-viz flex min-h-0 flex-col gap-6 pb-8 text-slate-800">
    <header
      class="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/90 pb-4"
    >
      <div>
        <h2 class="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          实验 & 测验 融合看板
        </h2>
        <p class="mt-1.5 text-[13px] text-slate-500">
          {{ props.session.displayName }} · {{ maskPhone(props.session.phone) }}
        </p>
      </div>
      <button
        type="button"
        class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        @click="emit('logout')"
      >
        退出登录
      </button>
    </header>

    <!-- 筛选 -->
    <div
      class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm"
    >
      <p class="mb-3 text-[12px] font-medium text-slate-500">筛选范围</p>
      <div class="flex flex-wrap items-end gap-3">
        <div class="min-w-[140px] flex-1 sm:max-w-[200px]">
          <label class="mb-1 block text-[11px] text-slate-500">地区</label>
          <select
            v-model="regionId"
            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[14px] text-slate-800 outline-none ring-primary/30 focus:ring-2"
          >
            <option value="">全部区县</option>
            <option
              v-for="r in BUREAU_REGIONS"
              :key="r.id"
              :value="r.id"
            >
              {{ r.name }}
            </option>
          </select>
        </div>
        <div class="min-w-[160px] flex-1 sm:max-w-[220px]">
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
        <div class="min-w-[140px] flex-1 sm:max-w-[200px]">
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

    <!-- KPI：前三项紧凑；完成数板块加宽 -->
    <div
      class="grid grid-cols-1 gap-3 sm:grid-cols-6 lg:grid-cols-12 lg:items-stretch"
    >
      <div
        class="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/80 to-white p-3 shadow-sm sm:col-span-2 lg:col-span-2"
      >
        <p class="text-[11px] text-sky-800/80">管辖学校</p>
        <p class="mt-0.5 text-xl font-semibold tabular-nums text-sky-950">
          {{ kpi.schoolCount }}
        </p>
      </div>
      <div
        class="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-3 shadow-sm sm:col-span-2 lg:col-span-2"
      >
        <p class="text-[11px] text-violet-800/80">班级数</p>
        <p class="mt-0.5 text-xl font-semibold tabular-nums text-violet-950">
          {{ kpi.classCount }}
        </p>
      </div>
      <div
        class="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-3 shadow-sm sm:col-span-2 lg:col-span-2"
      >
        <p class="text-[11px] text-emerald-800/80">学生数</p>
        <p class="mt-0.5 text-xl font-semibold tabular-nums text-emerald-950">
          {{ kpi.studentCount }}
        </p>
      </div>
      <div
        class="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 to-white p-4 shadow-sm sm:col-span-6 sm:p-5 lg:col-span-6 lg:p-6"
      >
        <p class="text-[13px] font-medium text-indigo-900/85">实验 & 测验 · 完成数（项）</p>
        <div class="mt-3 tabular-nums sm:mt-4">
          <p class="text-[11px] font-medium text-slate-500 sm:text-[12px]">
            总完成项（实验 + 测验累计）
          </p>
          <p class="mt-1 flex flex-wrap items-baseline gap-1">
            <span
              class="text-3xl font-bold leading-none tracking-tight text-indigo-800 sm:text-4xl"
              >{{ kpi.totalItemsCompleted }}</span
            >
            <span class="text-lg text-slate-400 sm:text-xl">/</span>
            <span class="text-xl font-semibold text-slate-700 sm:text-2xl">{{
              kpi.totalItemsExpected
            }}</span>
            <span class="text-[12px] text-slate-500 sm:text-[13px]">项</span>
          </p>
          <div class="mt-3 space-y-1.5 border-t border-indigo-100/80 pt-3 text-[12px]">
            <p class="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
              <span class="text-slate-500">实验完成</span>
              <span>
                <span class="font-semibold text-sky-700">{{ kpi.experimentCompletedSum }}</span>
                <span class="text-slate-400"> / </span>
                <span class="text-slate-600">{{ kpi.experimentExpectedSum }}</span>
                <span class="text-slate-400"> 项</span>
              </span>
            </p>
            <p class="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
              <span class="text-slate-500">测验完成</span>
              <span>
                <span class="font-semibold text-violet-700">{{ kpi.quizCompletedSum }}</span>
                <span class="text-slate-400"> / </span>
                <span class="text-slate-600">{{ kpi.quizExpectedSum }}</span>
                <span class="text-slate-400"> 项</span>
              </span>
            </p>
          </div>
          <p
            class="mt-3 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 border-t border-indigo-100/80 pt-3 text-[12px]"
          >
            <span class="text-slate-600">完成（1 人 1 次）</span>
            <span>
              <span class="text-base font-bold text-indigo-800">{{
                kpi.fullyCompletedStudentCount
              }}</span>
              <span class="text-slate-400"> / </span>
              <span class="font-medium text-slate-700">{{ kpi.studentCount }}</span>
              <span class="text-slate-400"> 人</span>
            </span>
          </p>
        </div>
      </div>
    </div>

    <!-- 辖区进度：小板块网格，完成项数 -->
    <section>
      <div class="mb-3">
        <h3 class="text-[15px] font-semibold text-slate-900">
          辖区{{ schoolId ? "班级" : "学校" }}统计进度
        </h3>
        <p class="mt-0.5 text-[12px] text-slate-500">
          {{ schoolId ? "当前学校下各班级" : "按学校汇总" }} · 实验/测验为项数；合计为双项均满人数
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
          <dl class="mt-2 space-y-1 border-t border-slate-100 pt-2 text-[12px]">
            <div class="flex justify-between gap-2 tabular-nums">
              <dt class="text-slate-500">实验</dt>
              <dd class="font-semibold text-sky-700">
                {{ row.expDone }} / {{ row.expExpected }} 项
              </dd>
            </div>
            <div class="flex justify-between gap-2 tabular-nums">
              <dt class="text-slate-500">测验</dt>
              <dd class="font-semibold text-violet-700">
                {{ row.quizDone }} / {{ row.quizExpected }} 项
              </dd>
            </div>
            <div class="flex justify-between gap-2 border-t border-slate-50 pt-1 tabular-nums">
              <dt class="text-slate-600">完成</dt>
              <dd class="font-bold text-indigo-700">
                {{ row.fullyDoneCount }} / {{ row.n }} 人
              </dd>
            </div>
          </dl>
        </li>
      </ul>
    </section>

    <!-- 学生明细 -->
    <div
      class="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm"
    >
      <div class="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <p class="text-[14px] font-semibold text-slate-800">学生明细</p>
        <p class="text-[11px] text-slate-500">当前筛选</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-left text-[13px]">
          <thead>
            <tr class="border-b border-slate-100 bg-white text-[12px] text-slate-500">
              <th class="px-4 py-3 font-medium">区县</th>
              <th class="px-4 py-3 font-medium">学校</th>
              <th class="px-4 py-3 font-medium">班级</th>
              <th class="px-4 py-3 font-medium">学生</th>
              <th class="px-4 py-3 font-medium">实验 / 测验 / 完成</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="st in filteredStudents"
              :key="st.id"
              class="border-b border-slate-100 odd:bg-slate-50/50"
            >
              <td class="px-4 py-2.5 text-slate-600">
                {{ rowRegionName(st) }}
              </td>
              <td class="px-4 py-2.5 text-slate-800">
                {{ rowSchoolName(st) }}
              </td>
              <td class="px-4 py-2.5 text-slate-600">
                {{ rowClassName(st) }}
              </td>
              <td class="px-4 py-2.5 font-medium text-slate-900">
                {{ st.name }}
              </td>
              <td class="px-4 py-2.5 text-[12px] tabular-nums text-slate-700">
                <span class="text-sky-700"
                  >{{ experimentDoneCount(st) }}/{{ EXPERIMENT_ITEMS_PER_STUDENT }}</span
                >
                <span class="mx-1 text-slate-300">·</span>
                <span class="text-violet-700"
                  >{{ quizDoneCount(st) }}/{{ QUIZ_ITEMS_PER_STUDENT }}</span
                >
                <span class="mx-1 text-slate-300">·</span>
                <span
                  class="font-medium"
                  :class="
                    isExperimentAndQuizFullyDone(st)
                      ? 'text-indigo-800'
                      : 'text-slate-400'
                  "
                >{{ isExperimentAndQuizFullyDone(st) ? "1" : "0" }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p
        v-if="filteredStudents.length === 0"
        class="px-4 py-10 text-center text-[13px] text-slate-500"
      >
        当前筛选下暂无学生数据
      </p>
    </div>
  </div>
</template>

<style scoped>
.edu-viz {
  font-feature-settings: "tnum" 1;
}
</style>
