<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from "vue";
import html2canvas from "html2canvas";
import type { QuizQuestion } from "@/data/experimentQuizzes";
import { getQuizForExperiment } from "@/data/experimentQuizzes";
import {
  normalizeKnowledgeLearned,
  type QuizReport,
} from "@/types/quizReport";
import { useCartoonAvatar } from "@/composables/useCartoonAvatar";
import {
  getLatestQuizReportForExperimentAndGrade,
  saveQuizReport,
} from "@/utils/quizReportStorage";
import { buildAiComment, gradeQuiz } from "@/utils/quizScore";

const { seed } = useCartoonAvatar();

/** PNG 头像便于生成分享图时跨域绘制 */
const resultAvatarUrl = computed(
  () =>
    `https://api.dicebear.com/9.x/adventurer/png?seed=${encodeURIComponent(seed)}&size=192&backgroundColor=b6e3f4`,
);

const knowledgePoints = computed(() =>
  report.value
    ? normalizeKnowledgeLearned(report.value.knowledgeLearned)
    : [],
);

const STUDENT_NAME = "李超涛";

const props = defineProps<{
  open: boolean;
  experimentId: string;
  experimentTitle: string;
  gradeLabel: string;
  /** 为 true 时若本地已有该实验测验记录则直接进入答题结果页 */
  openToResult?: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  "quiz-submitted": [payload: { experimentId: string; gradeLabel: string }];
}>();

const questions = ref<QuizQuestion[]>([]);
const answers = ref<Record<string, unknown>>({});
const phase = ref<"quiz" | "result">("quiz");
const report = ref<QuizReport | null>(null);
/** 当前题下标（逐题展示） */
const currentIndex = ref(0);

function resetAnswers(qs: QuizQuestion[]) {
  const next: Record<string, unknown> = {};
  for (const q of qs) {
    if (q.type === "multi") {
      next[q.id] = [] as number[];
    } else if (q.type === "truefalse") {
      next[q.id] = null as boolean | null;
    } else if (q.type === "single") {
      next[q.id] = null as number | null;
    } else {
      next[q.id] = "";
    }
  }
  answers.value = next;
}

function loadQuiz() {
  const qs = getQuizForExperiment(props.experimentId);
  questions.value = qs;
  resetAnswers(qs);
  currentIndex.value = 0;
  phase.value = "quiz";
  report.value = null;
}

/** 打开弹窗时：有存档则进入结果页 */
function tryShowSavedResult(): boolean {
  const saved = getLatestQuizReportForExperimentAndGrade(
    props.experimentId,
    props.gradeLabel,
  );
  if (!saved) {
    return false;
  }
  const qs = getQuizForExperiment(props.experimentId);
  questions.value = qs;
  resetAnswers(qs);
  currentIndex.value = 0;
  report.value = saved;
  phase.value = "result";
  return true;
}

function isAnswered(q: QuizQuestion): boolean {
  const a = answers.value[q.id];
  if (q.type === "single") {
    return typeof a === "number";
  }
  if (q.type === "multi") {
    return Array.isArray(a) && a.length > 0;
  }
  if (q.type === "truefalse") {
    return typeof a === "boolean";
  }
  if (q.type === "fill" || q.type === "short") {
    return String(a ?? "").trim().length > 0;
  }
  return false;
}

const currentQuestion = computed(() => questions.value[currentIndex.value] ?? null);

const totalSteps = computed(() => questions.value.length);

const answeredCount = computed(
  () => questions.value.filter((q) => isAnswered(q)).length,
);

const progressPercent = computed(() => {
  const t = totalSteps.value;
  if (t <= 0) {
    return 0;
  }
  return Math.round((answeredCount.value / t) * 100);
});

function goToQuestion(i: number) {
  if (i >= 0 && i < questions.value.length) {
    currentIndex.value = i;
  }
}

function prevQuestion() {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1;
  }
}

function nextQuestion() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value += 1;
  }
}

const isLastQuestion = computed(
  () => currentIndex.value >= totalSteps.value - 1 && totalSteps.value > 0,
);

function questionTypeLabel(q: QuizQuestion): string {
  if (q.type === "single") {
    return "单选题";
  }
  if (q.type === "multi") {
    return "多选题";
  }
  if (q.type === "truefalse") {
    return "判断题";
  }
  if (q.type === "fill") {
    return "填空题";
  }
  return "简答题";
}

watch(
  () => props.open,
  (v) => {
    if (v) {
      if (props.openToResult && tryShowSavedResult()) {
        /* 直接展示答题结果 */
      } else {
        loadQuiz();
      }
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  },
);

function close() {
  emit("update:open", false);
}

/** 清空答案并回到第一题（重新作答） */
function restartQuiz() {
  const qs = questions.value;
  if (!qs.length) {
    loadQuiz();
    return;
  }
  resetAnswers(qs);
  currentIndex.value = 0;
  phase.value = "quiz";
  report.value = null;
}

function toggleMulti(q: Extract<QuizQuestion, { type: "multi" }>, index: number) {
  const cur = [...((answers.value[q.id] as number[]) ?? [])];
  const pos = cur.indexOf(index);
  if (pos >= 0) {
    cur.splice(pos, 1);
  } else {
    cur.push(index);
  }
  answers.value[q.id] = cur.sort((a, b) => a - b);
}

function submitQuiz() {
  const qs = questions.value;
  const { details, totalScore, maxScore } = gradeQuiz(qs, answers.value);
  const { aiComment, knowledgeLearned } = buildAiComment(
    props.experimentTitle,
    totalScore,
    maxScore,
  );
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `r-${Date.now()}`;

  const submittedAt = new Date().toISOString();
  const rep: QuizReport = {
    id,
    experimentId: props.experimentId,
    experimentTitle: props.experimentTitle,
    gradeLabel: props.gradeLabel,
    studentName: STUDENT_NAME,
    submittedAt,
    totalScore,
    maxScore,
    aiComment,
    knowledgeLearned,
    details,
  };
  saveQuizReport(rep);
  report.value = rep;
  phase.value = "result";
  emit("quiz-submitted", {
    experimentId: props.experimentId,
    gradeLabel: props.gradeLabel,
  });
}

const submittedLocal = computed(() => {
  const r = report.value;
  if (!r) {
    return "";
  }
  const d = new Date(r.submittedAt);
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
});

/** 用于截图分享的卡片（仅含顶部信息条） */
const shareCardRef = ref<HTMLElement | null>(null);
const shareSaving = ref(false);

async function saveShareImage() {
  const r = report.value;
  if (!r) {
    return;
  }
  shareSaving.value = true;
  await nextTick();
  const el = shareCardRef.value;
  if (!el) {
    shareSaving.value = false;
    return;
  }
  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
    });
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `缤果AI实验室-测验结果-${r.studentName}-${r.totalScore}分.png`;
    a.click();
  } catch (e) {
    console.error(e);
    window.alert("生成图片失败，请稍后重试或检查网络。");
  } finally {
    shareSaving.value = false;
  }
}

onUnmounted(() => {
  document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <Transition name="quiz-popup">
      <div
        v-if="open"
        class="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5"
        role="presentation"
      >
        <div
          class="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
          aria-hidden="true"
          @click="close"
        ></div>
        <div
          class="quiz-modal-panel relative flex max-h-[min(88vh,820px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-popover"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quiz-dialog-title"
          @click.stop
        >
          <header
            class="flex shrink-0 items-start justify-between gap-2 border-b border-border-subtle px-4 pb-3 pt-4 sm:px-5"
          >
            <div class="min-w-0 flex-1">
              <h2
                id="quiz-dialog-title"
                class="text-[17px] font-semibold text-black"
              >
                {{ phase === "quiz" ? "实验测验" : "答题结果" }}
              </h2>
              <p class="mt-0.5 truncate text-[13px] text-fg-muted">
                {{ experimentTitle }} · {{ gradeLabel }}
              </p>
            </div>
            <button
              type="button"
              class="flex size-9 shrink-0 items-center justify-center rounded-full text-fg-muted transition hover:bg-card-inner hover:text-black"
              aria-label="关闭"
              @click="close"
            >
              <span class="text-xl leading-none">×</span>
            </button>
          </header>

          <!-- 答题：题目区居中 + 右侧进度 -->
          <div
            v-if="phase === 'quiz'"
            class="flex min-h-[min(360px,45vh)] flex-1 flex-col overflow-hidden lg:min-h-[400px] lg:flex-row"
          >
            <div
              class="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-4 py-5 sm:px-6 lg:min-w-0 lg:py-6"
            >
              <Transition
                mode="out-in"
                enter-active-class="transition duration-200 ease-out"
                leave-active-class="transition duration-150 ease-in"
                enter-from-class="opacity-0 translate-y-1"
                leave-to-class="opacity-0 -translate-y-1"
              >
                <div
                  v-if="currentQuestion"
                  :key="currentQuestion.id"
                  class="mx-auto w-full max-w-lg"
                >
                  <div
                    class="mb-4 flex flex-wrap items-center justify-center gap-2"
                  >
                    <span
                      class="rounded-md bg-primary-muted px-2 py-0.5 text-[11px] font-medium text-primary"
                    >
                      第 {{ currentIndex + 1 }} / {{ totalSteps }} 题 ·
                      {{ questionTypeLabel(currentQuestion) }}
                    </span>
                    <span class="text-[12px] text-fg-muted"
                      >{{ currentQuestion.points }} 分</span
                    >
                  </div>
                  <p
                    class="text-center text-[16px] font-medium leading-relaxed text-black"
                  >
                    {{ currentQuestion.prompt }}
                  </p>

                  <template v-if="currentQuestion.type === 'single'">
                    <ul class="mx-auto mt-5 max-w-md space-y-2 text-left">
                      <li
                        v-for="(opt, oi) in currentQuestion.options"
                        :key="oi"
                      >
                        <label
                          class="flex cursor-pointer items-start gap-2 rounded-lg border border-transparent px-2 py-2.5 transition hover:bg-slate-50"
                          :class="
                            answers[currentQuestion.id] === oi
                              ? 'border-blue-500 bg-blue-50'
                              : ''
                          "
                        >
                          <input
                            v-model.number="answers[currentQuestion.id]"
                            type="radio"
                            class="mt-1 accent-blue-600"
                            :name="`q-${currentQuestion.id}`"
                            :value="oi"
                          />
                          <span class="text-[14px] text-black/90">{{
                            opt
                          }}</span>
                        </label>
                      </li>
                    </ul>
                  </template>

                  <div
                    v-else-if="currentQuestion.type === 'multi'"
                    class="mx-auto mt-5 max-w-md space-y-2 text-left"
                  >
                    <label
                      v-for="(opt, oi) in currentQuestion.options"
                      :key="oi"
                      class="flex cursor-pointer items-start gap-2 rounded-lg border border-transparent px-2 py-2.5 transition hover:bg-slate-50"
                      :class="
                        (
                          (answers[currentQuestion.id] as number[]) ?? []
                        ).includes(oi)
                          ? 'border-blue-500 bg-blue-50'
                          : ''
                      "
                    >
                      <input
                        type="checkbox"
                        class="mt-1 rounded accent-blue-600"
                        :checked="
                          (
                            (answers[currentQuestion.id] as number[]) ?? []
                          ).includes(oi)
                        "
                        @change="toggleMulti(currentQuestion, oi)"
                      />
                      <span class="text-[14px] text-black/90">{{ opt }}</span>
                    </label>
                  </div>

                  <div
                    v-else-if="currentQuestion.type === 'truefalse'"
                    class="mx-auto mt-5 flex max-w-md flex-wrap justify-center gap-4 sm:gap-8"
                  >
                    <label
                      class="flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 transition"
                      :class="
                        answers[currentQuestion.id] === true
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-transparent hover:bg-slate-50'
                      "
                    >
                      <input
                        v-model="answers[currentQuestion.id]"
                        type="radio"
                        class="accent-blue-600"
                        :name="`tf-${currentQuestion.id}`"
                        :value="true"
                      />
                      <span class="text-[14px] text-slate-900">正确</span>
                    </label>
                    <label
                      class="flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 transition"
                      :class="
                        answers[currentQuestion.id] === false
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-transparent hover:bg-slate-50'
                      "
                    >
                      <input
                        v-model="answers[currentQuestion.id]"
                        type="radio"
                        class="accent-blue-600"
                        :name="`tf-${currentQuestion.id}`"
                        :value="false"
                      />
                      <span class="text-[14px] text-slate-900">错误</span>
                    </label>
                  </div>

                  <input
                    v-else-if="currentQuestion.type === 'fill'"
                    v-model="answers[currentQuestion.id] as string"
                    type="text"
                    class="mx-auto mt-5 block w-full max-w-md rounded-xl border border-border-subtle bg-white px-3 py-2.5 text-center text-[14px] outline-none ring-primary focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="请填写答案"
                  />

                  <textarea
                    v-else-if="currentQuestion.type === 'short'"
                    v-model="answers[currentQuestion.id] as string"
                    rows="4"
                    class="mx-auto mt-5 block w-full max-w-md resize-y rounded-xl border border-border-subtle bg-white px-3 py-2.5 text-[14px] leading-relaxed outline-none ring-primary focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="请简要作答"
                  />
                </div>
              </Transition>
            </div>

            <!-- 右侧：进度 + 题号状态 -->
            <aside
              class="flex w-full shrink-0 flex-col border-t border-border-subtle bg-card-inner/40 px-4 py-4 lg:w-[220px] lg:justify-center lg:border-l lg:border-t-0"
            >
              <h3 class="text-[13px] font-semibold text-black">
                答题进度
              </h3>
              <p class="mt-2 text-[20px] font-semibold tabular-nums text-primary">
                {{ answeredCount }} / {{ totalSteps }}
                <span class="text-[13px] font-normal text-fg-muted">题已答</span>
              </p>
              <div
                class="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/[0.06]"
                role="progressbar"
                :aria-valuenow="progressPercent"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  class="h-full rounded-full bg-primary transition-[width] duration-300"
                  :style="{ width: `${progressPercent}%` }"
                />
              </div>
              <p class="mt-1.5 text-[11px] text-fg-muted">
                完成度 {{ progressPercent }}%（按已作答题数）
              </p>

              <h3 class="mt-6 text-[13px] font-semibold text-black">
                答题状态
              </h3>
              <ul class="mt-2 flex max-h-40 flex-wrap gap-2 overflow-y-auto lg:max-h-52 lg:flex-col lg:gap-1.5">
                <li
                  v-for="(q, idx) in questions"
                  :key="q.id"
                >
                  <button
                    type="button"
                    class="flex w-full min-w-[7rem] items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left text-[13px] transition"
                    :class="
                      idx === currentIndex
                        ? 'border-primary bg-primary-muted shadow-sm ring-1 ring-primary/30'
                        : isAnswered(q)
                          ? 'border-emerald-200/80 bg-emerald-50/90 text-emerald-900'
                          : 'border-border-subtle bg-white/80 text-fg-muted hover:bg-card-inner'
                    "
                    @click="goToQuestion(idx)"
                  >
                    <span class="font-medium">第 {{ idx + 1 }} 题</span>
                    <span
                      class="shrink-0 text-[11px]"
                      :class="
                        idx === currentIndex
                          ? 'text-primary'
                          : isAnswered(q)
                            ? 'text-emerald-700'
                            : 'text-fg-muted'
                      "
                    >
                      {{
                        idx === currentIndex
                          ? "当前"
                          : isAnswered(q)
                            ? "已答"
                            : "未答"
                      }}
                    </span>
                  </button>
                </li>
              </ul>
            </aside>
          </div>

          <footer
            v-if="phase === 'quiz'"
            class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-4 py-4 sm:px-5"
          >
            <button
              type="button"
              class="rounded-xl border border-border-subtle px-5 py-2.5 text-[14px] text-fg-soft transition hover:bg-card-inner"
              @click="close"
            >
              取消
            </button>
            <div class="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                class="rounded-xl border border-border-subtle px-4 py-2.5 text-[14px] text-fg-soft transition hover:bg-card-inner disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="currentIndex <= 0"
                @click="prevQuestion"
              >
                上一题
              </button>
              <button
                v-if="!isLastQuestion"
                type="button"
                class="rounded-xl bg-primary px-5 py-2.5 text-[14px] font-medium text-white shadow-md shadow-primary/20 transition hover:opacity-95"
                @click="nextQuestion"
              >
                下一题
              </button>
              <button
                v-else
                type="button"
                class="rounded-xl bg-primary px-6 py-2.5 text-[14px] font-medium text-white shadow-md shadow-primary/20 transition hover:opacity-95"
                @click="submitQuiz"
              >
                提交测验
              </button>
            </div>
          </footer>

          <!-- 结果 -->
          <div
            v-if="phase === 'result' && report"
            class="quiz-result-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] px-4 py-5 sm:px-6"
          >
            <div class="mx-auto max-w-2xl space-y-5">
              <!-- 分享图区域：头像 + 姓名 + 分数（保存图片仅截取此块） -->
              <div
                ref="shareCardRef"
                class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2563eb] via-[#4f46e5] to-[#06b6d4] text-white shadow-[0_12px_40px_-8px_rgba(37,99,235,0.55)]"
              >
                <div
                  class="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/10 blur-2xl"
                  aria-hidden="true"
                />
                <div
                  class="pointer-events-none absolute -bottom-10 left-1/4 size-32 rounded-full bg-cyan-400/20 blur-xl"
                  aria-hidden="true"
                />
                <div
                  class="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6"
                >
                  <div class="flex shrink-0 items-center gap-4 sm:items-start">
                    <img
                      :src="resultAvatarUrl"
                      alt=""
                      width="96"
                      height="96"
                      crossorigin="anonymous"
                      referrerpolicy="no-referrer"
                      class="size-20 shrink-0 rounded-2xl border-4 border-white/25 bg-white/10 object-cover shadow-lg ring-2 ring-white/20 sm:size-24"
                    />
                    <div class="min-w-0 sm:hidden">
                      <p
                        class="text-[11px] font-medium uppercase tracking-wider text-white/70"
                      >
                        测验得分
                      </p>
                      <p class="mt-1 text-3xl font-bold tabular-nums leading-none">
                        {{ report.totalScore }}
                        <span class="text-lg font-semibold text-white/75"
                          >/ {{ report.maxScore }}</span
                        >
                      </p>
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-[18px] font-bold leading-tight text-white">
                      {{ report.studentName }}
                    </p>
                    <p
                      class="mt-1 line-clamp-2 text-[13px] leading-snug text-white/85"
                    >
                      {{ report.experimentTitle }} · {{ report.gradeLabel }}
                    </p>
                    <p
                      class="mt-2 hidden text-[12px] text-white/65 sm:block"
                    >
                      缤果AI实验室 · 实验测验
                    </p>
                  </div>
                  <div
                    class="hidden shrink-0 text-right sm:block"
                  >
                    <p
                      class="text-[11px] font-medium uppercase tracking-wider text-white/70"
                    >
                      测验得分
                    </p>
                    <div
                      class="mt-1 flex items-baseline justify-end gap-1"
                    >
                      <span
                        class="text-5xl font-bold tabular-nums tracking-tight text-white"
                        >{{ report.totalScore }}</span
                      >
                      <span class="text-xl font-medium text-white/75"
                        >/ {{ report.maxScore }}</span
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- AI 点评 -->
              <section
                class="rounded-2xl border border-violet-200/80 bg-white p-4 shadow-[0_2px_12px_-4px_rgba(91,33,182,0.12)] ring-1 ring-violet-100/80"
              >
                <div
                  class="mb-3 flex items-center gap-2 border-b border-violet-100 pb-2"
                >
                  <span
                    class="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[12px] text-white shadow-sm"
                    aria-hidden="true"
                    >✦</span
                  >
                  <h3 class="text-[13px] font-bold tracking-wide text-violet-700">
                    AI 点评
                  </h3>
                </div>
                <p class="text-[14px] leading-relaxed text-slate-700">
                  {{ report.aiComment }}
                </p>
              </section>

              <!-- 学到知识 -->
              <section
                class="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 to-white p-4 shadow-[0_2px_12px_-4px_rgba(5,150,105,0.15)]"
              >
                <div
                  class="mb-3 flex items-center gap-2 border-b border-emerald-100/90 pb-2"
                >
                  <span
                    class="flex size-8 items-center justify-center rounded-lg bg-emerald-500 text-[12px] text-white shadow-sm"
                    aria-hidden="true"
                    >📚</span
                  >
                  <h3 class="text-[13px] font-bold tracking-wide text-emerald-800">
                    学到知识
                  </h3>
                </div>
                <ol
                  class="list-decimal space-y-1.5 pl-5 text-[14px] leading-relaxed text-emerald-950/85 marker:text-emerald-700"
                >
                  <li
                    v-for="(line, ki) in knowledgePoints"
                    :key="ki"
                  >
                    {{ line }}
                  </li>
                </ol>
              </section>

              <!-- 答题详情 -->
              <section
                class="rounded-2xl border border-slate-200 bg-white p-4 pb-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.1)]"
              >
                <div
                  class="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3"
                >
                  <span
                    class="flex size-8 items-center justify-center rounded-lg bg-slate-800 text-[11px] font-bold text-white"
                    aria-hidden="true"
                    >Q</span
                  >
                  <h3 class="text-[13px] font-bold tracking-wide text-slate-700">
                    答题详情
                  </h3>
                </div>
                <ul class="space-y-4">
                  <li
                    v-for="(d, i) in report.details"
                    :key="d.questionId"
                    class="rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-slate-200 hover:bg-slate-50"
                  >
                    <div class="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        class="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 text-[12px] font-bold text-white"
                        >{{ i + 1 }}</span
                      >
                      <span
                        class="text-[12px] font-semibold text-slate-500"
                        >{{ d.typeLabel }}</span
                      >
                      <span
                        class="ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        :class="
                          d.isCorrect
                            ? 'bg-emerald-500/15 text-emerald-800 ring-1 ring-emerald-500/25'
                            : 'bg-amber-500/15 text-amber-900 ring-1 ring-amber-500/25'
                        "
                      >
                        {{ d.isCorrect ? "正确" : "有误" }} ·
                        {{ d.earnedPoints }}/{{ d.maxPoints }} 分
                      </span>
                    </div>
                    <p class="text-[14px] font-medium leading-snug text-slate-900">
                      {{ d.prompt }}
                    </p>
                    <div
                      class="mt-3 space-y-1.5 rounded-lg border border-dashed border-slate-200/90 bg-white/90 px-3 py-2.5 text-[12px]"
                    >
                      <p>
                        <span class="font-medium text-slate-500">你的答案</span>
                        <span class="text-slate-800">：{{ d.userAnswer }}</span>
                      </p>
                      <p>
                        <span class="font-medium text-slate-500">参考要点</span>
                        <span class="text-slate-600">：{{ d.correctAnswer }}</span>
                      </p>
                    </div>
                  </li>
                </ul>
              </section>

              <!-- 提交时间 -->
              <div
                class="flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-[12px] text-slate-500 shadow-sm"
              >
                <span aria-hidden="true">🕐</span>
                <span>提交时间：{{ submittedLocal }}</span>
              </div>
            </div>
          </div>

          <footer
            v-if="phase === 'result'"
            class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-4 py-3 sm:px-5"
          >
            <div
              class="flex flex-wrap items-center gap-2"
            >
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-card-inner px-3 py-2 text-[13px] font-medium text-fg-soft transition hover:border-primary/35 hover:bg-primary-muted/40 hover:text-primary disabled:opacity-50"
                :disabled="shareSaving"
                @click="saveShareImage"
              >
                <svg
                  class="size-4 shrink-0 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11"
                  />
                </svg>
                {{ shareSaving ? "生成中…" : "保存图片" }}
              </button>
            </div>
            <div
              class="flex flex-wrap items-center justify-end gap-2"
            >
              <button
                type="button"
                class="rounded-xl border border-border-subtle px-5 py-2.5 text-[14px] font-medium text-fg-soft transition hover:bg-card-inner"
                @click="restartQuiz"
              >
                重新作答
              </button>
              <button
                type="button"
                class="rounded-xl bg-primary px-6 py-2.5 text-[14px] font-medium text-white shadow-md shadow-primary/20 transition hover:opacity-95"
                @click="close"
              >
                关闭
              </button>
            </div>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.quiz-popup-enter-active,
.quiz-popup-leave-active {
  transition: opacity 0.26s ease;
}
.quiz-popup-enter-active .quiz-modal-panel,
.quiz-popup-leave-active .quiz-modal-panel {
  transition: transform 0.28s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.quiz-popup-enter-from,
.quiz-popup-leave-to {
  opacity: 0;
}
.quiz-popup-enter-from .quiz-modal-panel,
.quiz-popup-leave-to .quiz-modal-panel {
  transform: scale(0.96) translateY(10px);
}

.quiz-result-scroll {
  scrollbar-gutter: stable;
}
.quiz-result-scroll::-webkit-scrollbar {
  width: 8px;
}
.quiz-result-scroll::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  background: rgb(148 163 184 / 0.45);
}
.quiz-result-scroll::-webkit-scrollbar-track {
  background: transparent;
}
</style>
