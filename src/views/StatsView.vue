<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { LAB_PACKAGE_OPTIONS } from "@/data/labPackages";
import {
  getExperimentsForGrade,
  gradeLabel,
  parseGradeId,
} from "@/data/gradeExperiments";
import type { ExperimentItem } from "@/data/gradeExperiments";
import { INITIAL_MEMBERS_BY_GROUP } from "@/data/groupMembers";
import type { GroupMember } from "@/data/groupMembers";
import type { QuizReport } from "@/types/quizReport";
import { normalizeKnowledgeLearned } from "@/types/quizReport";
import { loadQuizReports } from "@/utils/quizReportStorage";
import { findExperimentResultSubmit } from "@/utils/experimentResultStorage";

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
  return (
    INITIAL_MEMBERS_BY_GROUP[groupId.value] ??
    INITIAL_MEMBERS_BY_GROUP["ai-group"] ??
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

function isExperimentCompleteForMember(
  ex: ExperimentItem,
  m: GroupMember | null,
): boolean {
  if (!m) {
    return false;
  }
  if (reportFor(ex.id, m.name)) {
    return true;
  }
  return !!findExperimentResultSubmit(ex.id, listHeading.value, m.name);
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
    if (reportFor(ex.id, m.name)) {
      done++;
    }
  }
  return { done, total };
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
    if (reportFor(ex.id, m.name)) {
      tags.push({
        key: "done",
        label: "已完成",
        class: "bg-sky-100 text-sky-800",
      });
    } else {
      tags.push({
        key: "pending",
        label: "未测验",
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
</script>

<template>
  <section class="-mx-5 -mt-2 flex min-h-[min(640px,75vh)] flex-col gap-0 lg:-mx-7">
    <header
      class="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3"
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
    </header>

    <div
      class="grid min-h-0 flex-1 gap-0 overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-card lg:grid-cols-[minmax(200px,280px)_minmax(200px,260px)_1fr]"
    >
      <!-- 列1：实验列表（默认）或学生（member-first 时通过 order 交换） -->
      <div
        class="flex max-h-[40vh] min-h-0 flex-col border-b border-border-subtle lg:max-h-none lg:border-b-0 lg:border-r"
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
        <ul class="min-h-0 flex-1 overflow-y-auto p-2">
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
                <p
                  v-if="!memberFirstLayout"
                  class="mt-1 text-[11px]"
                  :class="
                    selectedExpIndex === i ? 'text-white/85' : 'text-fg-muted'
                  "
                >
                  完成情况: {{ completionForExperiment(ex).done }}/{{
                    completionForExperiment(ex).total
                  }}
                </p>
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
        class="flex max-h-[36vh] min-h-0 flex-col border-b border-border-subtle lg:max-h-none lg:border-b-0 lg:border-r"
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
            完成情况: {{ completionCurrent.done }}/{{
              completionCurrent.total
            }}
          </template>
        </div>
        <ul class="min-h-0 flex-1 overflow-y-auto p-2">
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
        class="order-3 flex min-h-[280px] min-w-0 flex-col bg-slate-50/40 lg:min-h-0"
      >
        <div
          class="shrink-0 border-b border-border-subtle/80 px-4 py-2.5 text-[12px] font-medium text-slate-600"
        >
          统计结果
        </div>

        <div
          v-if="!selectedExperiment || !selectedMember"
          class="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center text-[14px] text-fg-muted"
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
          class="flex min-h-0 min-w-0 flex-1 flex-col"
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
            class="min-h-0 flex-1 overflow-y-auto"
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
              <p class="max-w-xs text-[13px] leading-relaxed text-fg-muted">
                「{{ selectedMember.name }}」在「{{ selectedExperiment.title }}」下尚未提交测验。
              </p>
            </div>
            <div
              v-else
              class="space-y-4 px-4 py-4"
            >
              <div
                class="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4"
              >
                <p class="text-[12px] text-blue-800/80">测验得分</p>
                <p class="mt-1 text-3xl font-semibold text-blue-700">
                  {{ activeReport.totalScore
                  }}<span class="text-lg font-normal text-blue-600/80"
                    >/ {{ activeReport.maxScore }}</span
                  >
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
                  答题摘要
                </h3>
                <ul class="space-y-2">
                  <li
                    v-for="d in activeReport.details"
                    :key="d.questionId"
                    class="rounded-lg border border-slate-100 bg-white px-3 py-2 text-[13px]"
                  >
                    <div class="flex flex-wrap items-center gap-2">
                      <span
                        class="font-medium text-slate-800"
                      >{{ d.typeLabel }}</span
                      >
                      <span
                        class="rounded px-1.5 py-0.5 text-[11px]"
                        :class="
                          d.isCorrect
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        "
                      >
                        {{ d.earnedPoints }}/{{ d.maxPoints }} 分
                      </span>
                    </div>
                    <p class="mt-1 line-clamp-2 text-[12px] text-fg-muted">
                      {{ d.prompt }}
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Tab：实验提交 -->
          <div
            v-else
            class="min-h-0 flex-1 overflow-y-auto"
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
  </section>
</template>
