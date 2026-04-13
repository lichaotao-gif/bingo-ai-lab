<script setup lang="ts">
import { ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    title: string;
    imageSrc: string;
    imageAlt?: string;
    /**
     * 该年级下至少有一个实验「测验 + AI 实验」均完成（与实验列表行角标一致）
     */
    overallCompleted?: boolean;
    /** 有测验记录但尚无任一实验双完成时，展示「测验已完成」提示 */
    quizCompleted?: boolean;
  }>(),
  { overallCompleted: false, quizCompleted: false },
);

const emit = defineEmits<{
  click: [];
}>();

const displaySrc = ref(props.imageSrc);
const fallbackCover = `${(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/")}covers/photo-01.jpg`;

watch(
  () => props.imageSrc,
  (v) => {
    displaySrc.value = v;
  },
);

function onImgError() {
  if (displaySrc.value !== fallbackCover) {
    displaySrc.value = fallbackCover;
  }
}
</script>

<template>
  <article
    class="group relative cursor-pointer rounded-2xl border border-border-subtle bg-card-inner p-3.5 shadow-card transition hover:shadow-md"
    role="button"
    tabindex="0"
    @click="emit('click')"
    @keydown.enter="emit('click')"
  >
    <!-- 至少一个实验双完成：与实验列表行「完成」角标同款 -->
    <div
      v-if="overallCompleted"
      class="pointer-events-none absolute right-0 top-0 z-20 h-[4.25rem] w-[4.25rem] overflow-hidden rounded-tr-2xl"
      title="已有实验完成测验与 AI 实验"
      aria-hidden="true"
    >
      <div
        class="absolute right-[-38%] top-[20%] w-[140%] rotate-45 bg-gradient-to-br from-primary to-[#4f9cf9] py-1.5 text-center text-[10px] font-bold tracking-wider text-white shadow-sm"
      >
        完成
      </div>
    </div>
    <template v-else>
      <div
        v-if="quizCompleted"
        class="pointer-events-none absolute right-2 top-2 z-20 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-white shadow-md ring-2 ring-white/90"
        aria-hidden="true"
      >
        测验已完成
      </div>
    </template>
    <div class="relative overflow-hidden rounded-xl bg-white">
      <img
        :src="displaySrc"
        :alt="imageAlt ?? title"
        class="aspect-[300/169] w-full object-cover bg-slate-100"
        loading="lazy"
        decoding="async"
        referrerpolicy="no-referrer"
        @error="onImgError"
      />
      <div
        v-if="quizCompleted && !overallCompleted"
        class="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-1.5 bg-gradient-to-r from-primary to-[#4f9cf9] py-2 text-[12px] font-semibold tracking-wide text-white shadow-md"
        aria-hidden="true"
      >
        <svg
          class="size-4 shrink-0 opacity-95"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            stroke="currentColor"
            stroke-width="2.25"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M20 6L9 17l-5-5"
          />
        </svg>
        测验已完成
      </div>
    </div>
    <h3
      class="mt-3 text-[17px] font-medium leading-snug text-black group-hover:text-primary"
    >
      {{ title }}
    </h3>
  </article>
</template>
