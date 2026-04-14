<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ExperimentItem } from "@/data/gradeExperiments";

const props = withDefaults(
  defineProps<{
    item: ExperimentItem;
    /** 本年级下该实验测验已提交 */
    quizCompleted?: boolean;
    /**
     * 本年级下该实验结果已提交；未传时沿用 item.completed（演示静态数据）
     */
    experimentSubmitCompleted?: boolean;
  }>(),
  { quizCompleted: false },
);

const emit = defineEmits<{
  start: [];
  /** showResult 为 true 表示已做过测验，应直接打开结果页 */
  quiz: [payload: { showResult: boolean }];
}>();

const coverSrc = ref(props.item.cover);
const coverFallback = `${(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/")}covers/photo-01.jpg`;

watch(
  () => props.item.cover,
  (v) => {
    coverSrc.value = v;
  },
);

function onCoverError() {
  if (coverSrc.value !== coverFallback) {
    coverSrc.value = coverFallback;
  }
}

/** 测验与实验结果均已提交时显示角标（与统计页「完成」定义一致） */
const overallCompleted = computed(
  () =>
    props.quizCompleted &&
    (props.experimentSubmitCompleted ?? props.item.completed),
);
</script>

<template>
  <article
    class="relative flex gap-4 overflow-hidden rounded-xl border border-border-subtle bg-white p-4 shadow-card transition hover:shadow-md"
  >
    <!-- 单实验：测验 + AI 实验均完成 → 右上角斜角「完成」 -->
    <div
      v-if="overallCompleted"
      class="pointer-events-none absolute right-0 top-0 z-10 h-[4.75rem] w-[4.75rem] overflow-hidden rounded-tr-xl"
      title="测验与 AI 实验均已完成"
      aria-hidden="true"
    >
      <div
        class="absolute right-[-38%] top-[22%] w-[140%] rotate-45 bg-gradient-to-br from-primary to-[#4f9cf9] py-1.5 text-center text-[10px] font-bold tracking-wider text-white shadow-sm"
      >
        完成
      </div>
    </div>

    <div
      class="size-[104px] shrink-0 overflow-hidden rounded-lg bg-card-inner ring-1 ring-black/[0.04]"
    >
      <img
        :src="coverSrc"
        :alt="item.title"
        class="size-full object-cover"
        loading="lazy"
        decoding="async"
        referrerpolicy="no-referrer"
        @error="onCoverError"
      />
    </div>

    <div class="flex min-w-0 flex-1 flex-col justify-between gap-2 pr-1 pt-0.5">
      <div class="min-w-0">
        <h3 class="text-[16px] font-semibold leading-snug text-black">
          {{ item.title }}
        </h3>
        <p class="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-fg-muted">
          {{ item.description }}
        </p>
      </div>
      <div class="flex flex-wrap justify-end gap-2 pt-1">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-1 rounded-lg border border-border-subtle bg-white px-4 py-2 text-[13px] font-medium text-primary shadow-sm transition hover:bg-primary-muted active:scale-[0.98]"
          :aria-label="quizCompleted ? '测验（已完成）' : '测验'"
          @click="emit('quiz', { showResult: quizCompleted })"
        >
          <span>测验</span>
          <svg
            v-if="quizCompleted"
            class="size-2 shrink-0 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M20 6L9 17l-5-5"
            />
          </svg>
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white shadow-sm shadow-primary/25 transition hover:opacity-95 active:scale-[0.98]"
          :aria-label="
            (experimentSubmitCompleted ?? item.completed)
              ? 'AI 实验（已完成）'
              : 'AI 实验'
          "
          @click="emit('start')"
        >
          <span>AI 实验</span>
          <svg
            v-if="experimentSubmitCompleted ?? item.completed"
            class="size-2 shrink-0 text-white"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M20 6L9 17l-5-5"
            />
          </svg>
        </button>
      </div>
    </div>
  </article>
</template>
