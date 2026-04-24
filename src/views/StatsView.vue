<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { LAB_PACKAGE_OPTIONS } from "@/data/labPackages";
import {
  getExperimentsForGrade,
  gradeLabel,
  parseGradeId,
} from "@/data/gradeExperiments";
import type { ExperimentItem } from "@/data/gradeExperiments";
import type { GroupMember } from "@/data/groupMembers";
import QuizAnswerDetailItem from "@/components/quiz/QuizAnswerDetailItem.vue";
import {
  normalizeKnowledgeLearned,
  quizCorrectRatePercent,
  type QuizAnswerDetail,
  type QuizReport,
} from "@/types/quizReport";
import { resolveQuizExplanation } from "@/utils/quizExplanation";
import { loadQuizReports } from "@/utils/quizReportStorage";
import { findExperimentResultSubmit } from "@/utils/experimentResultStorage";
import { loadGroupMembersByGroup } from "@/utils/groupMembersStorage";

const route = useRoute();
const router = useRouter();

/** 进入统计页时刷新本地数据 */
const loadTick = ref(0);

const pkgOption = computed(() => {
  const id = route.query.pkg as string | undefined;
  if (!id) {
    return undefined;
  }
  return LAB_PACKAGE_OPTIONS.find((p) => p.id === id);
});

const gradeIndex = computed(() => {
  const p = pkgOption.value;
  if (p) {
    return p.gradeRouteIndex;
  }
  const g = route.query.grade;
  if (g !== undefined && g !== null && String(g) !== "") {
    return parseGradeId(String(g));
  }
  return 0;
});

const listHeading = computed(() => {
  const p = pkgOption.value;
  if (p?.detailTitle) {
    return p.detailTitle;
  }
  return gradeLabel(gradeIndex.value);
});

const groupId = computed(
  () => (route.query.group as string) || "ai-group",
);

/** 群组成员「查看统计」：以学生为第一列，实验为第二列 */
const memberFirstLayout = computed(
  () => route.query.layout === "member-first",
);

const experiments = computed((): ExperimentItem[] =>
  getExperimentsForGrade(gradeIndex.value),
);

const members = computed((): GroupMember[] => {
  const membersByGroup = loadGroupMembersByGroup();
  return (
    membersByGroup[groupId.value] ??
    membersByGroup["ai-group"] ??
    []
  );
});

const reports = computed((): QuizReport[] => {
  loadTick.value;
  return loadQuizReports().filter((r) => r.gradeLabel === listHeading.value);
});

function reportFor(
  experimentId: string,
  memberName: string,
): QuizReport | undefined {
  return reports.value.find(
    (r) => r.experimentId === experimentId && r.studentName === memberName,
  );
}

/** 单项完成：该实验的测验与实验结果提交均已存在 */
function isExperimentCompleteForMember(
  ex: ExperimentItem,
  m: GroupMember | null,
): boolean {
  if (!m) {
    return false;
  }
  const quizDone = !!reportFor(ex.id, m.name);
  const submitDone = !!findExperimentResultSubmit(
    ex.id,
    listHeading.value,
    m.name,
  );
  return quizDone && submitDone;
}

function memberHasAnyCompletion(m: GroupMember): boolean {
  for (const ex of experiments.value) {
    if (isExperimentCompleteForMember(ex, m)) {
      return true;
    }
  }
  return false;
}

function completionForExperiment(ex: ExperimentItem): { done: number; total: number } {
  const total = members.value.length;
  if (total === 0) {
    return { done: 0, total: 0 };
  }
  let done = 0;
  for (const m of members.value) {
    if (isExperimentCompleteForMember(ex, m)) {
      done++;
    }
  }
  return { done, total };
}

/** 实验列表：完成情况进度条宽度（0～100） */
function completionBarPercent(ex: ExperimentItem): number {
  const { done, total } = completionForExperiment(ex);
  if (total <= 0) {
    return 0;
  }
  return Math.round((done / total) * 100);
}

const selectedExpIndex = ref(0);
const selectedMemberId = ref<string | null>(null);

watch(
  [experiments, members, () => route.query.member],
  () => {
    selectedExpIndex.value = 0;
    const mid = route.query.member as string | undefined;
    if (mid && members.value.some((m) => m.id === mid)) {
      selectedMemberId.value = mid;
    } else {
      selectedMemberId.value = members.value[0]?.id ?? null;
    }
  },
  { immediate: true },
);

watch(
  () => route.fullPath,
  () => {
    loadTick.value++;
  },
);

const selectedExperiment = computed(
  () => experiments.value[selectedExpIndex.value] ?? null,
);

const selectedMember = computed(() =>
  members.value.find((m) => m.id === selectedMemberId.value) ?? null,
);

const completionCurrent = computed(() => {
  const ex = selectedExperiment.value;
  if (!ex) {
    return { done: 0, total: 0 };
  }
  return completionForExperiment(ex);
});

const activeReport = computed((): QuizReport | null => {
  const ex = selectedExperiment.value;
  const mem = selectedMember.value;
  if (!ex || !mem) {
    return null;
  }
  return reportFor(ex.id, mem.name) ?? null;
});

function quizDetailExplanation(d: QuizAnswerDetail): string {
  const r = activeReport.value;
  if (!r) {
    return "";
  }
  return resolveQuizExplanation(r.experimentId, d);
}

const activeExperimentResult = computed(() => {
  loadTick.value;
  const ex = selectedExperiment.value;
  const mem = selectedMember.value;
  if (!ex || !mem) {
    return undefined;
  }
  return findExperimentResultSubmit(ex.id, listHeading.value, mem.name);
});

/** 右侧详情：测验 | 实验提交 */
const statsDetailTab = ref<"quiz" | "submit">("quiz");

watch([selectedExpIndex, selectedMemberId], () => {
  statsDetailTab.value = "quiz";
});

function formatAttachmentSize(n: number) {
  if (n < 1024) {
    return `${n} B`;
  }
  if (n < 1024 * 1024) {
    return `${(n / 1024).toFixed(1)} KB`;
  }
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function memberTags(m: GroupMember): { key: string; label: string; class: string }[] {
  const tags: { key: string; label: string; class: string }[] = [];
  if (m.role === "admin") {
    tags.push({
      key: "admin",
      label: "管理员",
      class: "bg-blue-600 text-white",
    });
  }
  if (memberFirstLayout.value) {
    if (memberHasAnyCompletion(m)) {
      tags.push({
        key: "done",
        label: "已完成",
        class: "bg-sky-100 text-sky-800",
      });
    } else {
      tags.push({
        key: "pending",
        label: "未完成",
        class: "bg-slate-100 text-slate-600",
      });
    }
    return tags;
  }
  const ex = selectedExperiment.value;
  if (ex) {
    if (isExperimentCompleteForMember(ex, m)) {
      tags.push({
        key: "done",
        label: "已完成",
        class: "bg-sky-100 text-sky-800",
      });
    } else {
      tags.push({
        key: "pending",
        label: "未完成",
        class: "bg-slate-100 text-slate-600",
      });
    }
  }
  return tags;
}

function formatSubmitted(iso: string) {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function goBack() {
  if (route.query.from === "my-lab") {
    void router.push({ name: "my-lab" });
    return;
  }
  if (window.history.length > 1) {
    router.back();
    return;
  }
  void router.push({ name: "ai-lab" });
}

const pageSubtitle = computed(() => {
  const p = pkgOption.value;
  if (p) {
    return p.title;
  }
  return gradeLabel(gradeIndex.value);
});

/** 从「我的 AI 实验」进入时显示整体统计入口 */
const showClassOverviewEntry = computed(
  () => route.query.from === "my-lab",
);

const classOverviewOpen = ref(false);

/** 整体统计弹窗：固定模拟 50 人（与左侧真实成员/存档无关） */
const CLASS_OVERVIEW_SIM_TOTAL = 50;

function hashExperimentId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 模拟：全班范围内「各实验均完成」的人数（与年级标题、实验列表绑定，稳定可复现） */
function simulatedOverallFullyCompleted(
  experimentList: ExperimentItem[],
  heading: string,
  total: number,
): number {
  if (experimentList.length === 0 || total <= 0) {
    return 0;
  }
  let h = hashExperimentId(heading);
  for (const ex of experimentList) {
    h = (h ^ hashExperimentId(ex.id)) >>> 0;
  }
  const pct = 22 + (h % 58);
  return Math.min(total, Math.max(0, Math.round((total * pct) / 100)));
}

/** 按实验 id 生成稳定的模拟完成人数（约占全班 18%～95%） */
function simulatedClassCompletion(ex: ExperimentItem): {
  done: number;
  total: number;
} {
  const total = CLASS_OVERVIEW_SIM_TOTAL;
  const h = hashExperimentId(ex.id);
  const pct = 18 + (h % 78);
  const done = Math.min(total, Math.max(0, Math.round((total * pct) / 100)));
  return { done, total };
}

const packageCompletionRows = computed(() =>
  experiments.value.map((ex) => {
    const { done, total } = simulatedClassCompletion(ex);
    const barPct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { ex, done, total, barPct };
  }),
);

const packageCompletionSummary = computed(() => {
  const rows = packageCompletionRows.value;
  const memberCount = CLASS_OVERVIEW_SIM_TOTAL;
  const experimentCount = rows.length;
  const overallFullyDone = simulatedOverallFullyCompleted(
    experiments.value,
    listHeading.value,
    memberCount,
  );
  if (experimentCount === 0) {
    return { memberCount, experimentCount: 0, overallFullyDone: 0 };
  }
  return { memberCount, experimentCount, overallFullyDone };
});

watch(classOverviewOpen, (v) => {
  document.body.style.overflow = v ? "hidden" : "";
});

onUnmounted(() => {
  document.body.style.overflow = "";
});
</script>

<template>
  <!-- 上：页眉固定高度；下：三列同高且各自纵向滚动（不带动整页 main） -->
  <section
    class="-mx-5 -mt-2 flex min-h-0 flex-col gap-0 lg:-mx-7"
    :class="[
      /* 顶栏 + 外壳与 main 内边距，避免整块超出视口导致外层再滚动 */
      'h-[calc(100dvh-var(--header-height)-5rem)]',
      'max-h-[calc(100dvh-var(--header-height)-5rem)]',
    ]"
  >
    <header
      class="mb-4 shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-surface pb-3 pr-2 sm:pr-3"
    >
      <div class="flex min-w-0 items-center gap-3">
        <button
          type="button"
          class="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[15px] text-fg-soft transition hover:bg-card-inner hover:text-primary"
          @click="goBack"
        >
          <svg
            class="size-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 18l-6-6 6-6"
            />
          </svg>
          <span>返回</span>
        </button>
        <div class="min-w-0">
          <h1 class="text-[20px] font-semibold text-black">实验统计</h1>
          <p class="mt-0.5 truncate text-[13px] text-fg-muted">
            {{ pageSubtitle }} · {{ listHeading }}
          </p>
        </div>
      </div>
      <button
        v-if="showClassOverviewEntry"
        type="button"
        class="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border-subtle bg-white px-3 py-2 text-[13px] font-medium text-primary shadow-sm transition hover:bg-primary-muted"
        @click="classOverviewOpen = true"
      >
        <svg
          class="size-[18px] shrink-0 opacity-90"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 20V10M12 20V4M20 20v-7"
          />
        </svg>
        <span class="whitespace-nowrap">整体统计</span>
      </button>
    </header>

    <div
      class="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-card max-lg:auto-rows-fr max-lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] lg:grid-cols-[minmax(200px,280px)_minmax(200px,260px)_1fr] lg:grid-rows-1"
    >
      <!-- 列1：实验列表（默认）或学生（member-first 时通过 order 交换） -->
      <div
        class="flex min-h-0 flex-col overflow-hidden border-b border-border-subtle lg:border-b-0 lg:border-r"
        :class="
          memberFirstLayout
            ? 'order-2 lg:order-2'
            : 'order-1 lg:order-1'
        "
      >
        <div
          class="shrink-0 border-b border-border-subtle/80 bg-slate-50/80 px-3 py-2.5 text-[12px] text-fg-muted"
        >
          实验列表
          <span
            v-if="memberFirstLayout && selectedMember"
            class="text-fg-muted/80"
          > · {{ selectedMember.name }}</span>
        </div>
        <ul
          class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 [scrollbar-gutter:stable]"
        >
          <li
            v-for="(ex, i) in experiments"
            :key="ex.id"
          >
            <button
              type="button"
              class="mb-1 flex w-full gap-2 rounded-xl border px-2.5 py-2.5 text-left transition"
              :class="
                selectedExpIndex === i
                  ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                  : 'border-transparent hover:bg-slate-50'
              "
              @click="selectedExpIndex = i"
            >
              <div
                class="size-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-black/[0.06]"
              >
                <img
                  :src="ex.cover"
                  alt=""
                  class="size-full object-cover"
                  loading="lazy"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p
                  class="text-[13px] font-medium leading-snug"
                  :class="selectedExpIndex === i ? 'text-white' : 'text-black'"
                >
                  {{ i + 1 }}. {{ ex.title }}
                </p>
                <div
                  v-if="!memberFirstLayout"
                  class="mt-1.5 space-y-1"
                >
                  <div
                    class="flex items-center justify-between gap-2 text-[11px]"
                    :class="
                      selectedExpIndex === i ? 'text-white/90' : 'text-fg-muted'
                    "
                  >
                    <span>
                      完成{{ completionForExperiment(ex).done }}/{{
                        completionForExperiment(ex).total
                      }}人
                    </span>
                    <span
                      class="shrink-0 tabular-nums opacity-90"
                    >{{ completionBarPercent(ex) }}%</span>
                  </div>
                  <div
                    class="h-1.5 overflow-hidden rounded-full"
                    :class="
                      selectedExpIndex === i ? 'bg-white/25' : 'bg-slate-200/90'
                    "
                  >
                    <div
                      class="h-full max-w-full rounded-full transition-[width] duration-300"
                      :class="
                        selectedExpIndex === i
                          ? 'bg-white'
                          : 'bg-gradient-to-r from-primary to-[#4f9cf9]'
                      "
                      :style="{ width: `${completionBarPercent(ex)}%` }"
                    />
                  </div>
                </div>
                <div
                  v-else
                  class="mt-1.5 flex items-center justify-between gap-2"
                >
                  <span
                    class="text-[11px]"
                    :class="
                      selectedExpIndex === i ? 'text-white/80' : 'text-fg-muted'
                    "
                  >个人完成情况</span>
                  <span
                    class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
                    :class="
                      isExperimentCompleteForMember(ex, selectedMember)
                        ? selectedExpIndex === i
                          ? 'bg-white/25 text-white'
                          : 'bg-sky-100 text-sky-800'
                        : selectedExpIndex === i
                          ? 'bg-white/15 text-white/90'
                          : 'bg-slate-100 text-slate-600'
                    "
                  >
                    {{
                      isExperimentCompleteForMember(ex, selectedMember)
                        ? "已完成"
                        : "未完成"
                    }}
                  </span>
                </div>
              </div>
            </button>
          </li>
        </ul>
      </div>

      <!-- 列2：成员（默认）或学生优先 -->
      <div
        class="flex min-h-0 flex-col overflow-hidden border-b border-border-subtle lg:border-b-0 lg:border-r"
        :class="
          memberFirstLayout
            ? 'order-1 lg:order-1'
            : 'order-2 lg:order-2'
        "
      >
        <div
          class="shrink-0 border-b border-border-subtle/80 bg-slate-50/80 px-3 py-2.5 text-[12px] text-fg-muted"
        >
          <template v-if="memberFirstLayout">学生</template>
          <template v-else>
            完成{{ completionCurrent.done }}/{{
              completionCurrent.total
            }}人
          </template>
        </div>
        <ul
          class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 [scrollbar-gutter:stable]"
        >
          <li
            v-for="m in members"
            :key="m.id"
          >
            <button
              type="button"
              class="mb-1 flex w-full items-center gap-2 rounded-xl border px-2.5 py-2.5 text-left transition"
              :class="
                selectedMemberId === m.id
                  ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                  : 'border-transparent hover:bg-slate-50'
              "
              @click="selectedMemberId = m.id"
            >
              <img
                :src="m.avatar"
                alt=""
                width="40"
                height="40"
                class="size-10 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
                :class="selectedMemberId === m.id ? 'ring-2 ring-white/40' : ''"
              />
              <div class="min-w-0 flex-1">
                <p
                  class="truncate text-[14px] font-medium"
                  :class="selectedMemberId === m.id ? 'text-white' : 'text-black'"
                >
                  {{ m.name }}
                </p>
                <div class="mt-1 flex flex-wrap gap-1">
                  <span
                    v-for="t in memberTags(m)"
                    :key="t.key"
                    class="rounded px-1.5 py-0.5 text-[10px] font-medium"
                    :class="
                      selectedMemberId === m.id
                        ? 'bg-white/20 text-white'
                        : t.class
                    "
                  >
                    {{ t.label }}
                  </span>
                </div>
              </div>
            </button>
          </li>
        </ul>
      </div>

      <!-- 右：详情 -->
      <div
        class="order-3 flex min-h-0 min-w-0 flex-col overflow-hidden bg-slate-50/40"
      >
        <div
          class="shrink-0 border-b border-border-subtle/80 px-4 py-2.5 text-[12px] font-medium text-slate-600"
        >
          统计结果
        </div>

        <div
          v-if="!selectedExperiment || !selectedMember"
          class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto overscroll-contain px-6 py-8 text-center text-[14px] text-fg-muted"
        >
          <div
            class="flex size-24 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"
            aria-hidden="true"
          >
            <svg
              class="size-12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-width="1.25"
                stroke-linejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p>请选择实验与成员</p>
        </div>

        <div
          v-else
          class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        >
          <div
            class="flex shrink-0 gap-0 border-b border-border-subtle bg-white px-2 pt-2"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              class="min-w-0 flex-1 rounded-t-lg border border-b-0 px-3 py-2.5 text-[13px] font-medium transition"
              :class="
                statsDetailTab === 'quiz'
                  ? 'border-border-subtle bg-slate-50/40 text-blue-700'
                  : 'border-transparent text-fg-muted hover:bg-slate-50'
              "
              :aria-selected="statsDetailTab === 'quiz'"
              @click="statsDetailTab = 'quiz'"
            >
              测验
            </button>
            <button
              type="button"
              role="tab"
              class="min-w-0 flex-1 rounded-t-lg border border-b-0 px-3 py-2.5 text-[13px] font-medium transition"
              :class="
                statsDetailTab === 'submit'
                  ? 'border-border-subtle bg-slate-50/40 text-blue-700'
                  : 'border-transparent text-fg-muted hover:bg-slate-50'
              "
              :aria-selected="statsDetailTab === 'submit'"
              @click="statsDetailTab = 'submit'"
            >
              实验提交
            </button>
          </div>

          <!-- Tab：测验 -->
          <div
            v-if="statsDetailTab === 'quiz'"
            class="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"
          >
            <div
              v-if="!activeReport"
              class="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center"
            >
              <div
                class="flex size-24 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"
                aria-hidden="true"
              >
                <svg
                  class="size-12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    stroke-width="1.25"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <p class="text-[15px] font-medium text-slate-600">暂无测验记录</p>
            </div>
            <div
              v-else
              class="space-y-4 px-4 py-4"
            >
              <div
                class="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4"
              >
                <p class="text-[12px] text-blue-800/80">正确率</p>
                <p class="mt-1 text-3xl font-semibold tabular-nums text-blue-700">
                  {{
                    quizCorrectRatePercent(
                      activeReport.totalScore,
                      activeReport.maxScore,
                    )
                  }}%
                </p>
                <p class="mt-1 text-[12px] text-fg-muted">
                  提交于 {{ formatSubmitted(activeReport.submittedAt) }}
                </p>
              </div>

              <div>
                <h3 class="mb-2 text-[12px] font-semibold text-fg-muted">
                  AI 点评
                </h3>
                <p class="text-[14px] leading-relaxed text-slate-800">
                  {{ activeReport.aiComment }}
                </p>
              </div>

              <div>
                <h3 class="mb-2 text-[12px] font-semibold text-fg-muted">
                  学到知识
                </h3>
                <ol
                  class="list-decimal space-y-1 pl-5 text-[14px] leading-relaxed text-slate-800 marker:text-blue-600"
                >
                  <li
                    v-for="(line, ki) in normalizeKnowledgeLearned(
                      activeReport.knowledgeLearned,
                    )"
                    :key="ki"
                  >
                    {{ line }}
                  </li>
                </ol>
              </div>

              <div>
                <h3 class="mb-2 text-[12px] font-semibold text-fg-muted">
                  答题详情
                </h3>
                <ul class="space-y-3">
                  <li
                    v-for="(d, di) in activeReport.details"
                    :key="d.questionId"
                  >
                    <QuizAnswerDetailItem
                      variant="compact"
                      :detail="d"
                      :index="di"
                      :explanation="quizDetailExplanation(d)"
                    />
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Tab：实验提交 -->
          <div
            v-else
            class="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"
          >
            <div
              v-if="!activeExperimentResult"
              class="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center"
            >
              <div
                class="flex size-24 items-center justify-center rounded-2xl bg-slate-100 text-slate-300"
                aria-hidden="true"
              >
                <svg
                  class="size-12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    stroke-width="1.25"
                    stroke-linejoin="round"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p class="text-[15px] font-medium text-slate-600">暂无实验提交</p>
            </div>
            <div
              v-else
              class="space-y-4 px-4 py-4"
            >
              <div
                class="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/90 to-white p-4"
              >
                <p class="text-[12px] text-emerald-800/90">实验结果提交</p>
                <p class="mt-1 text-[12px] text-fg-muted">
                  提交于
                  {{ formatSubmitted(activeExperimentResult.submittedAt) }}
                </p>
              </div>

              <div v-if="activeExperimentResult.text">
                <h3 class="mb-2 text-[12px] font-semibold text-fg-muted">
                  文字说明
                </h3>
                <p
                  class="whitespace-pre-wrap rounded-xl border border-slate-100 bg-white p-3 text-[14px] leading-relaxed text-slate-800"
                >
                  {{ activeExperimentResult.text }}
                </p>
              </div>
              <div
                v-else
                class="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2 text-[13px] text-fg-muted"
              >
                未填写文字说明
              </div>

              <div>
                <h3 class="mb-2 text-[12px] font-semibold text-fg-muted">
                  图片
                  <span class="font-normal text-fg-muted/80"
                    >（{{ activeExperimentResult.images.length }} 张）</span
                  >
                </h3>
                <div
                  v-if="activeExperimentResult.images.length"
                  class="grid grid-cols-2 gap-2 sm:grid-cols-3"
                >
                  <a
                    v-for="(img, ii) in activeExperimentResult.images"
                    :key="ii"
                    :href="img.dataUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group relative aspect-square overflow-hidden rounded-lg bg-slate-100 ring-1 ring-black/[0.06]"
                  >
                    <img
                      :src="img.dataUrl"
                      :alt="img.name"
                      class="size-full object-cover transition group-hover:opacity-95"
                      loading="lazy"
                    />
                    <span
                      class="absolute bottom-0 left-0 right-0 truncate bg-black/50 px-1.5 py-1 text-[10px] text-white"
                    >{{ img.name }}</span
                    >
                  </a>
                </div>
                <p
                  v-else
                  class="text-[13px] text-fg-muted"
                >
                  未上传图片
                </p>
              </div>

              <div>
                <h3 class="mb-2 text-[12px] font-semibold text-fg-muted">
                  附件
                </h3>
                <div
                  v-if="activeExperimentResult.attachment"
                  class="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-[13px]"
                >
                  <span
                    class="max-w-[min(100%,240px)] truncate font-medium text-slate-800"
                  >{{ activeExperimentResult.attachment.name }}</span
                  >
                  <span class="text-fg-muted"
                  >{{ formatAttachmentSize(activeExperimentResult.attachment.size) }}</span
                  >
                </div>
                <p
                  v-else
                  class="text-[13px] text-fg-muted"
                >
                  未上传附件
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="classOverviewOpen"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="class-overview-title"
          @click.self="classOverviewOpen = false"
        >
          <div
            class="flex max-h-[min(560px,88vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-surface shadow-popover"
            @click.stop
          >
            <header
              class="flex shrink-0 items-start justify-between gap-3 border-b border-border-subtle px-5 py-4"
            >
              <div class="min-w-0">
                <h2
                  id="class-overview-title"
                  class="text-[17px] font-semibold text-black"
                >
                  整体统计
                </h2>
                <p class="mt-1 text-[13px] text-fg-muted">
                  {{ pageSubtitle }} · {{ listHeading }}
                </p>
              </div>
              <button
                type="button"
                class="flex size-9 shrink-0 items-center justify-center rounded-full text-fg-muted transition hover:bg-card-inner hover:text-black"
                aria-label="关闭"
                @click="classOverviewOpen = false"
              >
                <svg class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    d="M6 6l12 12M18 6L6 18"
                  />
                </svg>
              </button>
            </header>
            <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <p class="mb-4 text-[12px] leading-relaxed text-fg-muted">
                完成标准：每位学生需同时提交该实验的「测验」与「实验结果」。以下按模拟
                50 人展示各实验完成人数（演示数据，与左侧成员列表中的真实统计无关）。
              </p>
              <div
                class="mb-5 grid grid-cols-3 gap-2 rounded-xl border border-border-subtle/80 bg-slate-50/80 px-3 py-3 text-center"
              >
                <div>
                  <p class="text-[20px] font-semibold tabular-nums text-black">
                    {{ packageCompletionSummary.memberCount }}
                  </p>
                  <p class="mt-0.5 text-[11px] text-fg-muted">人数</p>
                </div>
                <div>
                  <p class="text-[20px] font-semibold tabular-nums text-black">
                    {{ packageCompletionSummary.experimentCount }}
                  </p>
                  <p class="mt-0.5 text-[11px] text-fg-muted">实验数</p>
                </div>
                <div>
                  <p
                    class="text-[18px] font-semibold tabular-nums leading-snug text-black sm:text-[20px]"
                  >
                    {{ packageCompletionSummary.overallFullyDone
                    }}<span class="text-fg-muted">/</span
                    >{{ packageCompletionSummary.memberCount }}
                  </p>
                  <p class="mt-0.5 text-[11px] text-fg-muted">全员进度</p>
                </div>
              </div>
              <ul class="space-y-4">
                <li
                  v-for="row in packageCompletionRows"
                  :key="row.ex.id"
                >
                  <div class="mb-1.5 flex items-start justify-between gap-2 text-[13px]">
                    <span class="min-w-0 font-medium leading-snug text-black">{{
                      row.ex.title
                    }}</span>
                    <span class="shrink-0 tabular-nums text-fg-muted">
                      完成{{ row.done }}/{{ row.total }}人
                    </span>
                  </div>
                  <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-primary to-[#4f9cf9] transition-[width] duration-300"
                      :style="{ width: `${row.barPct}%` }"
                    />
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>
