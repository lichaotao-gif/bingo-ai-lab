<script setup lang="ts">
import { computed, ref } from "vue";
import {
  normalizeKnowledgeLearned,
  quizCorrectRatePercent,
  type QuizReport,
} from "@/types/quizReport";
import { loadQuizReports } from "@/utils/quizReportStorage";

const reports = ref<QuizReport[]>([]);
const expandedId = ref<string | null>(null);

function refresh() {
  reports.value = loadQuizReports();
}

refresh();

const sorted = computed(() =>
  [...reports.value].sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  ),
);

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toggle(id: string) {
  expandedId.value = expandedId.value === id ? null : id;
}

function correctRate(r: QuizReport) {
  return quizCorrectRatePercent(r.totalScore, r.maxScore);
}

function knowledgePoints(r: QuizReport) {
  return normalizeKnowledgeLearned(r.knowledgeLearned);
}
</script>

<template>
  <section class="-mt-2 flex flex-col gap-4 lg:-mt-2.5">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-[20px] font-normal text-black">学生测验报告</h1>
        <p class="mt-1 text-[13px] text-fg-muted">
          教师可查看学生提交记录（演示：数据保存在本浏览器本地）
        </p>
      </div>
      <button
        type="button"
        class="rounded-lg border border-border-subtle px-4 py-2 text-[13px] text-fg-soft transition hover:bg-card-inner"
        @click="refresh"
      >
        刷新列表
      </button>
    </header>

    <p
      v-if="sorted.length === 0"
      class="rounded-xl border border-dashed border-border-subtle bg-card-inner/60 py-12 text-center text-[14px] text-fg-muted"
    >
      暂无测验提交。请学生在「实验列表」中点击「测验」完成答题后，此处将显示报告。
    </p>

    <ul
      v-else
      class="space-y-3"
    >
      <li
        v-for="r in sorted"
        :key="r.id"
        class="overflow-hidden rounded-xl border border-border-subtle bg-white shadow-card"
      >
        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-card-inner/80"
          @click="toggle(r.id)"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate text-[15px] font-semibold text-black">
              {{ r.studentName }}
              <span class="font-normal text-fg-muted">· {{ r.experimentTitle }}</span>
            </p>
            <p class="mt-0.5 text-[12px] text-fg-muted">
              {{ r.gradeLabel }} · {{ formatTime(r.submittedAt) }}
            </p>
          </div>
          <div class="shrink-0 text-right">
            <p class="text-[11px] text-fg-muted">正确率</p>
            <p class="text-[16px] font-semibold tabular-nums text-primary">
              {{ correctRate(r) }}%
            </p>
          </div>
          <span
            class="shrink-0 text-fg-muted transition"
            :class="expandedId === r.id ? 'rotate-180' : ''"
            aria-hidden="true"
          >▼</span>
        </button>

        <div
          v-if="expandedId === r.id"
          class="border-t border-border-subtle bg-card-inner/50 px-4 py-4 text-[14px]"
        >
          <div class="space-y-4">
            <div>
              <h3 class="mb-1 text-[12px] font-semibold uppercase tracking-wide text-fg-muted">
                AI 点评
              </h3>
              <p class="leading-relaxed text-black/85">{{ r.aiComment }}</p>
            </div>
            <div>
              <h3 class="mb-1 text-[12px] font-semibold uppercase tracking-wide text-fg-muted">
                学到知识
              </h3>
              <ol
                class="list-decimal space-y-1 pl-5 leading-relaxed text-black/85 marker:text-black/50"
              >
                <li
                  v-for="(line, ki) in knowledgePoints(r)"
                  :key="ki"
                >
                  {{ line }}
                </li>
              </ol>
            </div>
            <div>
              <h3 class="mb-2 text-[12px] font-semibold uppercase tracking-wide text-fg-muted">
                答题详情
              </h3>
              <ul class="space-y-2">
                <li
                  v-for="(d, i) in r.details"
                  :key="d.questionId"
                  class="rounded-lg border border-border-subtle bg-white p-3 text-[13px]"
                >
                  <div class="mb-1 flex flex-wrap items-center gap-2">
                    <span class="font-medium text-black/80"
                      >{{ i + 1 }}. {{ d.typeLabel }}</span
                    >
                    <span
                      class="rounded px-1.5 py-0.5 text-[11px]"
                      :class="
                        d.isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      "
                    >
                      {{ d.isCorrect ? "正确" : "有误" }}
                    </span>
                  </div>
                  <p class="text-black/90">{{ d.prompt }}</p>
                  <p class="mt-1 text-fg-muted">
                    学生答案：{{ d.userAnswer }}
                  </p>
                  <p class="text-fg-muted">参考要点：{{ d.correctAnswer }}</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>
