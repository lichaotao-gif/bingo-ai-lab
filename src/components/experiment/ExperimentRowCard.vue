<script setup lang="ts">
import { ref, watch } from "vue";
import type { ExperimentItem } from "@/data/gradeExperiments";

const props = withDefaults(
  defineProps<{
    item: ExperimentItem;
    /** 本年级下该实验测验已提交 */
    quizCompleted?: boolean;
  }>(),
  { quizCompleted: false },
);

const emit = defineEmits<{
  start: [];
  /** showResult 为 true 表示已做过测验，应直接打开结果页 */
  quiz: [payload: { showResult: boolean }];
}>();

const coverSrc = ref(props.item.cover);
const coverFallback = `${(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/")}covers/ai-01.svg`;

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
</script>

<template>
  <article
    class="relative flex gap-4 overflow-hidden rounded-xl border border-border-subtle bg-white p-4 shadow-card transition hover:shadow-md"
  >
    <!-- 斜角「已完成」：小方块 overflow 裁切，不伸出卡片，避免被 main 裁掉 -->
    <div
      v-if="item.completed"
      class="pointer-events-none absolute right-0 top-0 z-10 h-[4.75rem] w-[4.75rem] overflow-hidden rounded-tr-xl"
      aria-hidden="true"
    >
      <div
        class="absolute right-[-38%] top-[22%] w-[140%] rotate-45 bg-gradient-to-br from-primary to-[#4f9cf9] py-1.5 text-center text-[10px] font-bold tracking-wider text-white shadow-sm"
      >
        已完成
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
          class="rounded-lg border px-4 py-2 text-[13px] font-medium shadow-sm transition active:scale-[0.98]"
          :class="
            quizCompleted
              ? 'border-emerald-200/90 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/90'
              : 'border-border-subtle bg-white text-primary hover:bg-primary-muted'
          "
          @click="emit('quiz', { showResult: quizCompleted })"
        >
          {{ quizCompleted ? "完成测验" : "测验" }}
        </button>
        <button
          type="button"
          class="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white shadow-sm shadow-primary/25 transition hover:opacity-95 active:scale-[0.98]"
          @click="emit('start')"
        >
          AI 实验
        </button>
      </div>
    </div>
  </article>
</template>
