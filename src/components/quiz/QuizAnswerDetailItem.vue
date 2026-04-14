<script setup lang="ts">
import { computed } from "vue";
import type { QuizAnswerDetail } from "@/types/quizReport";

const props = withDefaults(
  defineProps<{
    detail: QuizAnswerDetail;
    index: number;
    /** 题解析全文（已由父组件从存档/题库解析） */
    explanation?: string;
    /** full：测验结果页；compact：统计侧栏等窄布局 */
    variant?: "full" | "compact";
    /** 作答者标签，如「你的答案」「学生答案」 */
    answerLabel?: string;
  }>(),
  { variant: "full", answerLabel: "你的答案" },
);

const isCompact = computed(() => props.variant === "compact");

const stemClass = computed(() =>
  isCompact.value ? "max-h-36 w-full rounded-lg object-contain" : "max-h-52 w-full rounded-xl object-contain",
);

const showTextOptions = computed(
  () =>
    (props.detail.optionLines?.length ?? 0) > 0 &&
    !(props.detail.imageOptionUrls?.length ?? 0),
);
</script>

<template>
  <div
    class="rounded-xl border border-slate-100 bg-slate-50/80 text-[13px] transition hover:border-slate-200 hover:bg-slate-50"
    :class="isCompact ? 'p-3' : 'p-4'"
  >
    <div
      class="mb-2 flex flex-wrap items-center gap-2"
      :class="isCompact ? '' : 'mb-3'"
    >
      <span
        class="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[#4f9cf9] text-[12px] font-bold text-white shadow-sm"
        >{{ index + 1 }}</span
      >
      <span
        class="text-[12px] font-semibold text-slate-500"
        >{{ detail.typeLabel }}</span
      >
      <span
        class="ml-auto inline-flex shrink-0 items-center justify-center"
        :class="detail.isCorrect ? '-rotate-[5deg]' : 'rotate-[6deg]'"
        :title="detail.isCorrect ? '正确' : '有误'"
        role="img"
        :aria-label="detail.isCorrect ? '正确' : '有误'"
      >
        <!-- 仿手写批阅：粗线勾 / 叉，非系统 emoji -->
        <svg
          v-if="detail.isCorrect"
          class="h-9 w-11 text-[#0d9488]"
          viewBox="0 0 44 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <!-- 两段折线勾，略歪，仿钢笔批「对」 -->
          <path
            d="M7.5 20.5 L14.2 28.8 L36.5 9"
            stroke="currentColor"
            stroke-width="3.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <svg
          v-else
          class="h-9 w-9 text-[#dc2626]"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <!-- 两笔交叉，线略弯，仿红笔打叉 -->
          <path
            d="M10 11 Q20.5 20.5 30.5 30"
            stroke="currentColor"
            stroke-width="3.2"
            stroke-linecap="round"
            fill="none"
          />
          <path
            d="M30 10 Q20 20.5 10 31"
            stroke="currentColor"
            stroke-width="3.2"
            stroke-linecap="round"
            fill="none"
          />
        </svg>
      </span>
    </div>

    <div v-if="detail.stemImageUrl" class="mb-2 overflow-hidden rounded-lg bg-white">
      <img
        :src="detail.stemImageUrl"
        alt=""
        class="mx-auto bg-slate-50"
        :class="stemClass"
        loading="lazy"
        decoding="async"
        referrerpolicy="no-referrer"
      />
    </div>

    <p
      v-if="detail.prompt?.trim()"
      class="font-medium leading-snug text-slate-900"
      :class="isCompact ? 'text-[13px]' : 'text-[14px]'"
    >
      {{ detail.prompt }}
    </p>
    <p
      v-else-if="detail.stemImageUrl"
      class="text-[12px] text-fg-muted"
    >
      （题干见配图）
    </p>

    <div v-if="showTextOptions" class="mt-3 space-y-1.5">
      <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        选项
      </p>
      <ul class="space-y-1 rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2">
        <li
          v-for="(line, oi) in detail.optionLines"
          :key="oi"
          class="text-[13px] leading-snug text-slate-800"
        >
          {{ line }}
        </li>
      </ul>
    </div>

    <div
      v-if="detail.imageOptionUrls?.length"
      class="mt-3"
    >
      <p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        选项（图）
      </p>
      <ul
        class="grid gap-2"
        :class="
          isCompact
            ? 'grid-cols-2 sm:grid-cols-3'
            : 'grid-cols-2 sm:grid-cols-4'
        "
      >
        <li
          v-for="(url, ii) in detail.imageOptionUrls"
          :key="`${url}-${ii}`"
          class="overflow-hidden rounded-lg border border-slate-200 bg-white"
        >
          <div
            class="flex aspect-square items-center justify-center bg-slate-50 p-1"
          >
            <img
              :src="url"
              alt=""
              class="max-h-full max-w-full object-contain"
              loading="lazy"
              decoding="async"
              referrerpolicy="no-referrer"
            />
          </div>
          <p
            class="border-t border-slate-100 bg-white py-1 text-center text-[11px] font-medium text-slate-600"
          >
            选项 {{ detail.imageOptionLabels?.[ii] ?? String.fromCharCode(65 + ii) }}
          </p>
        </li>
      </ul>
    </div>

    <div
      class="mt-3 space-y-1.5 rounded-lg border border-dashed border-slate-200/90 bg-white/90 px-3 py-2.5 text-[12px]"
    >
      <p>
        <span class="font-medium text-slate-500">{{ answerLabel }}</span>
        <span class="text-slate-800">：{{ detail.userAnswer }}</span>
      </p>
      <p>
        <span class="font-medium text-slate-500">参考答案</span>
        <span class="text-slate-800">：{{ detail.correctAnswer }}</span>
      </p>
      <p v-if="explanation?.trim()">
        <span class="font-medium text-slate-500">题解析</span>
        <span class="text-slate-700">：{{ explanation.trim() }}</span>
      </p>
    </div>
  </div>
</template>
