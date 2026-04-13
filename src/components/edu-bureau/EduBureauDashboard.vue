<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { EduBureauSession } from "@/utils/eduBureauAuth";
import { maskPhone } from "@/utils/eduBureauAuth";
import EduBureauStudentDetailDrawer from "@/components/edu-bureau/EduBureauStudentDetailDrawer.vue";
import {
  BUREAU_REGIONS,
  avg,
  classById,
  classIdsForFilters,
  classesForSchool,
  regionById,
  schoolBars,
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

function combinedPct(s: BureauStudent): number {
  return Math.round((s.experimentPct + s.quizPct) / 2);
}

const kpi = computed(() => {
  const studs = filteredStudents.value;
  const schoolsInScope = new Set<string>();
  const classesInScope = new Set<string>();
  for (const st of studs) {
    const cl = classById(st.classId);
    if (cl) {
      classesInScope.add(cl.id);
      schoolsInScope.add(cl.schoolId);
    }
  }
  const combinedList = studs.map(combinedPct);
  return {
    schoolCount: schoolsInScope.size,
    classCount: classesInScope.size,
    studentCount: studs.length,
    avgCombined: avg(combinedList),
  };
});

const progressTiles = computed(() => {
  if (schoolId.value) {
    const sch = schoolById(schoolId.value);
    if (!sch) {
      return [];
    }
    return classesForSchool(schoolId.value).map((c) => {
      const ids = new Set([c.id]);
      const stu = studentsForClassIds(ids);
      const exp = avg(stu.map((s) => s.experimentPct));
      const quiz = avg(stu.map((s) => s.quizPct));
      return {
        label: c.name,
        exp,
        quiz,
        combined: Math.round((exp + quiz) / 2),
        n: stu.length,
      };
    });
  }
  return schoolBars(regionId.value).map((b) => ({
    label: b.schoolName,
    exp: b.exp,
    quiz: b.quiz,
    combined: Math.round((b.exp + b.quiz) / 2),
    n: b.students,
  }));
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

const detailOpen = ref(false);
const detailStudent = ref<BureauStudent | null>(null);

function openStudentDetail(st: BureauStudent) {
  detailStudent.value = st;
  detailOpen.value = true;
}

function onDetailOpen(v: boolean) {
  detailOpen.value = v;
  if (!v) {
    detailStudent.value = null;
  }
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

    <!-- KPI -->
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div
        class="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/80 to-white p-4 shadow-sm"
      >
        <p class="text-[12px] text-sky-800/80">管辖学校</p>
        <p class="mt-1 text-2xl font-semibold tabular-nums text-sky-950">
          {{ kpi.schoolCount }}
        </p>
      </div>
      <div
        class="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-4 shadow-sm"
      >
        <p class="text-[12px] text-violet-800/80">班级数</p>
        <p class="mt-1 text-2xl font-semibold tabular-nums text-violet-950">
          {{ kpi.classCount }}
        </p>
      </div>
      <div
        class="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-4 shadow-sm"
      >
        <p class="text-[12px] text-emerald-800/80">学生数</p>
        <p class="mt-1 text-2xl font-semibold tabular-nums text-emerald-950">
          {{ kpi.studentCount }}
        </p>
      </div>
      <div
        class="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 to-white p-4 shadow-sm"
      >
        <p class="text-[12px] font-medium text-indigo-900/85">实验 & 测验 · 综合达成</p>
        <p class="mt-1 text-[11px] leading-snug text-slate-500">
          个人两项取平均后，再对全员求平均
        </p>
        <p class="mt-2 text-3xl font-bold tabular-nums text-indigo-700">
          {{ kpi.avgCombined }}%
        </p>
      </div>
    </div>

    <!-- 辖区进度：小板块网格，仅百分比 -->
    <section>
      <div class="mb-3">
        <h3 class="text-[15px] font-semibold text-slate-900">
          辖区{{ schoolId ? "班级" : "学校" }}统计进度
        </h3>
        <p class="mt-0.5 text-[12px] text-slate-500">
          {{ schoolId ? "当前学校下各班级" : "按学校汇总" }} · 仅展示数值
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
              <dd class="font-semibold text-sky-700">{{ row.exp }}%</dd>
            </div>
            <div class="flex justify-between gap-2 tabular-nums">
              <dt class="text-slate-500">测验</dt>
              <dd class="font-semibold text-violet-700">{{ row.quiz }}%</dd>
            </div>
            <div class="flex justify-between gap-2 border-t border-slate-50 pt-1 tabular-nums">
              <dt class="text-slate-600">综合</dt>
              <dd class="font-bold text-indigo-700">{{ row.combined }}%</dd>
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
        <table class="w-full min-w-[800px] text-left text-[13px]">
          <thead>
            <tr class="border-b border-slate-100 bg-white text-[12px] text-slate-500">
              <th class="px-4 py-3 font-medium">区县</th>
              <th class="px-4 py-3 font-medium">学校</th>
              <th class="px-4 py-3 font-medium">班级</th>
              <th class="px-4 py-3 font-medium">学生</th>
              <th class="px-4 py-3 font-medium">实验 / 测验 / 综合</th>
              <th class="w-[100px] px-4 py-3 font-medium">操作</th>
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
                <span class="text-sky-700">{{ st.experimentPct }}%</span>
                <span class="mx-1 text-slate-300">·</span>
                <span class="text-violet-700">{{ st.quizPct }}%</span>
                <span class="mx-1 text-slate-300">·</span>
                <span class="font-medium text-indigo-800">综 {{ combinedPct(st) }}%</span>
              </td>
              <td class="px-4 py-2.5">
                <button
                  type="button"
                  class="rounded-lg border border-primary/25 bg-primary-muted px-2.5 py-1 text-[12px] font-medium text-primary transition hover:bg-primary/10"
                  @click="openStudentDetail(st)"
                >
                  查看
                </button>
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

    <EduBureauStudentDetailDrawer
      :open="detailOpen"
      :student="detailStudent"
      @update:open="onDetailOpen"
    />
  </div>
</template>

<style scoped>
.edu-viz {
  font-feature-settings: "tnum" 1;
}
</style>
