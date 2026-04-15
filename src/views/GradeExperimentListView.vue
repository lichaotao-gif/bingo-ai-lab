<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ExperimentRowCard from "@/components/experiment/ExperimentRowCard.vue";
import ExperimentQuizModal from "@/components/experiment/ExperimentQuizModal.vue";
import {
  getExperimentsForGrade,
  gradeLabel,
  parseGradeId,
} from "@/data/gradeExperiments";
import { LAB_PACKAGE_OPTIONS } from "@/data/labPackages";
import { hasQuizReportForExperimentAndGrade } from "@/utils/quizReportStorage";
import { findExperimentResultSubmit } from "@/utils/experimentResultStorage";

/** 与测验弹窗、实验提交中使用的演示学生名一致 */
const CURRENT_STUDENT_NAME = "李超涛";

const route = useRoute();
const router = useRouter();

const gradeIndex = computed(() => parseGradeId(route.params.gradeId as string));

const gradeTitle = computed(() => gradeLabel(gradeIndex.value));

/** 从「我的AI实验室」带 pkg 时，可用实验包配置的 detailTitle 覆盖年级标签（如初中包） */
const listHeading = computed(() => {
  const pkgId = route.query.pkg as string | undefined;
  if (pkgId) {
    const opt = LAB_PACKAGE_OPTIONS.find((p) => p.id === pkgId);
    if (opt?.detailTitle) {
      return opt.detailTitle;
    }
  }
  return gradeTitle.value;
});

const experiments = computed(() => getExperimentsForGrade(gradeIndex.value));

function goBack() {
  if (route.query.from === "my-lab") {
    void router.push({ name: "my-lab" });
    return;
  }
  void router.push({ name: "ai-lab" });
}

function goStats() {
  const q: Record<string, string> = { grade: String(gradeIndex.value) };
  const pkgId = route.query.pkg as string | undefined;
  if (pkgId) {
    q.pkg = pkgId;
  }
  const gid = route.query.group as string | undefined;
  if (gid) {
    q.group = gid;
  }
  const from = route.query.from as string | undefined;
  if (from) {
    q.from = from;
  }
  void router.push({ name: "stats", query: q });
}

const quizOpen = ref(false);
const quizExperimentId = ref("");
const quizExperimentTitle = ref("");
/** 为 true 时弹窗打开本地存档直接进入答题结果 */
const quizOpenToResult = ref(false);
/** 与本地测验 / 实验提交记录同步，刷新角标 */
const labDataRev = ref(0);

function isQuizCompletedForRow(experimentId: string): boolean {
  void labDataRev.value;
  return hasQuizReportForExperimentAndGrade(
    experimentId,
    listHeading.value,
    CURRENT_STUDENT_NAME,
  );
}

function isExperimentSubmitCompletedForRow(experimentId: string): boolean {
  void labDataRev.value;
  return !!findExperimentResultSubmit(
    experimentId,
    listHeading.value,
    CURRENT_STUDENT_NAME,
  );
}

function onStartExperiment(id: string) {
  if (id === "gesture-snake") {
    void router.push({
      name: "experiment-gesture-snake",
      query: {
        return: route.fullPath,
        gradeLabel: listHeading.value,
        experimentId: "gesture-snake",
      },
    });
    return;
  }
  window.alert(`进入实验「${id}」（演示）`);
}

function onOpenQuiz(
  ex: { id: string; title: string },
  payload?: { showResult?: boolean },
) {
  quizExperimentId.value = ex.id;
  quizExperimentTitle.value = ex.title;
  quizOpenToResult.value = payload?.showResult ?? false;
  quizOpen.value = true;
}

function onQuizSubmitted() {
  labDataRev.value += 1;
}

watch(
  () => route.fullPath,
  () => {
    labDataRev.value += 1;
  },
);

function setDocTitle() {
  document.title = `${listHeading.value} · 实验列表 · 缤果AI实验室`;
}

onMounted(setDocTitle);
watch(listHeading, setDocTitle);
</script>

<template>
  <section class="-mt-2 flex flex-col gap-4 lg:-mt-2.5">
    <!-- 与 main 内边距对齐：整体上移；滚动时吸顶 -->
    <header
      class="sticky top-0 z-20 -mx-5 mb-1 flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle/70 bg-surface/95 px-5 py-2 backdrop-blur-sm lg:-mx-7 lg:px-7"
    >
      <button
        type="button"
        class="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[15px] text-fg-soft transition hover:bg-card-inner hover:text-primary"
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
        <span class="whitespace-nowrap">返回</span>
      </button>

      <button
        type="button"
        class="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2 text-[14px] font-medium text-white shadow-md shadow-primary/20 transition hover:opacity-95"
        @click="goStats"
      >
        <svg
          class="size-[18px] shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            d="M12 20V10M18 20V4M6 20v-4"
          />
        </svg>
        <span class="whitespace-nowrap">AI 实验统计</span>
      </button>
    </header>

    <h1 class="text-[20px] font-normal text-black">
      {{ listHeading }} · 实验列表
    </h1>

    <div
      class="grid gap-4 sm:grid-cols-2"
    >
      <ExperimentRowCard
        v-for="ex in experiments"
        :key="ex.id"
        :item="ex"
        :quiz-completed="isQuizCompletedForRow(ex.id)"
        :experiment-submit-completed="isExperimentSubmitCompletedForRow(ex.id)"
        @start="onStartExperiment(ex.id)"
        @quiz="(p) => onOpenQuiz(ex, p)"
      />
    </div>

    <ExperimentQuizModal
      :open="quizOpen"
      :open-to-result="quizOpenToResult"
      :experiment-id="quizExperimentId"
      :experiment-title="quizExperimentTitle"
      :grade-label="listHeading"
      @update:open="quizOpen = $event"
      @quiz-submitted="onQuizSubmitted"
    />
  </section>
</template>
