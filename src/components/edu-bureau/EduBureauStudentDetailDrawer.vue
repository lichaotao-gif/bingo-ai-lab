<script setup lang="ts">
import { computed, onUnmounted, watch } from "vue";
import type { BureauStudent } from "@/data/eduBureauMock";
import {
  buildBureauStudentDetail,
  formatDetailTime,
} from "@/data/eduBureauStudentDetailMock";
import { quizCorrectRatePercent } from "@/types/quizReport";

const props = defineProps<{
  open: boolean;
  student: BureauStudent | null;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const detail = computed(() =>
  props.student ? buildBureauStudentDetail(props.student) : null,
);

const titleName = computed(() => props.student?.name ?? "");

watch(
  () => props.open,
  (v) => {
    document.body.style.overflow = v ? "hidden" : "";
  },
);

onUnmounted(() => {
  document.body.style.overflow = "";
});

function close() {
  emit("update:open", false);
}

function quizRatePct(r: { totalScore: number; maxScore: number }) {
  return quizCorrectRatePercent(r.totalScore, r.maxScore);
}
</script>

<template>
  <Teleport to="body">
    <Transition name="edu-drawer">
      <div
        v-if="open && student && detail"
        class="fixed inset-0 z-[400] flex justify-end"
      >
        <div
          class="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]"
          aria-hidden="true"
          @click="close"
        />
        <aside
          class="relative flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="stu-detail-title"
          @click.stop
        >
          <header
            class="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4"
          >
            <div class="min-w-0">
              <p class="text-[12px] text-slate-500">学生档案</p>
              <h2
                id="stu-detail-title"
                class="mt-0.5 truncate text-lg font-semibold text-slate-900"
              >
                {{ titleName }}
              </h2>
              <p class="mt-1 text-[12px] text-slate-500">
                点击实验包标题展开，查看该包下实验完成与测验报告
              </p>
            </div>
            <button
              type="button"
              class="flex size-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="关闭"
              @click="close"
            >
              <span class="text-2xl leading-none">×</span>
            </button>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            <section>
              <h3 class="mb-3 text-[13px] font-semibold text-slate-800">
                已关联实验包
              </h3>
              <ul class="space-y-2">
                <li
                  v-for="(bundle, i) in detail.packageBundles"
                  :key="bundle.id"
                >
                  <details
                    class="group rounded-xl border border-slate-200 bg-slate-50/50 open:bg-white open:shadow-md"
                    :open="i === 0"
                  >
                    <summary
                      class="edu-pkg-summary flex cursor-pointer list-none items-center gap-3 rounded-xl p-3 transition hover:bg-white/80"
                    >
                      <div
                        class="size-11 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-black/[0.06]"
                      >
                        <img
                          :src="bundle.cover"
                          alt=""
                          class="size-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div class="min-w-0 flex-1 text-left">
                        <p class="text-[14px] font-medium leading-snug text-slate-900">
                          {{ bundle.title }}
                        </p>
                        <p class="mt-0.5 text-[12px] text-slate-500">
                          {{ bundle.gradeLabel }} ·
                          {{ bundle.experimentStats.length }} 个实验
                        </p>
                      </div>
                      <span
                        class="shrink-0 text-slate-400 transition group-open:rotate-180"
                        aria-hidden="true"
                      >
                        <svg
                          class="size-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M6 9l6 6 6-6"
                          />
                        </svg>
                      </span>
                    </summary>

                    <div
                      class="space-y-4 border-t border-slate-100 px-3 pb-4 pt-3"
                    >
                      <!-- 该包：实验完成情况 -->
                      <div>
                        <h4 class="mb-2 text-[12px] font-semibold text-slate-700">
                          实验完成情况
                        </h4>
                        <div class="overflow-x-auto rounded-lg border border-slate-100 bg-white">
                          <table class="w-full min-w-[280px] text-left text-[11px]">
                            <thead>
                              <tr class="border-b border-slate-100 bg-slate-50 text-slate-500">
                                <th class="px-2 py-1.5 font-medium">实验</th>
                                <th class="px-2 py-1.5 font-medium tabular-nums">
                                  完成
                                </th>
                                <th class="px-2 py-1.5 font-medium tabular-nums">
                                  测验
                                </th>
                                <th class="px-2 py-1.5 font-medium">测验</th>
                                <th class="px-2 py-1.5 font-medium">结果</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr
                                v-for="ex in bundle.experimentStats"
                                :key="ex.id"
                                class="border-b border-slate-50 last:border-0"
                              >
                                <td class="px-2 py-1.5 text-slate-800">
                                  {{ ex.title }}
                                </td>
                                <td class="px-2 py-1.5 tabular-nums text-sky-700">
                                  {{ ex.experimentPct }}%
                                </td>
                                <td class="px-2 py-1.5 tabular-nums text-violet-700">
                                  {{ ex.quizPct }}%
                                </td>
                                <td class="px-2 py-1.5">
                                  <span
                                    class="rounded px-1 py-0.5 text-[10px]"
                                    :class="
                                      ex.quizSubmitted
                                        ? 'bg-emerald-50 text-emerald-800'
                                        : 'bg-slate-100 text-slate-500'
                                    "
                                  >{{ ex.quizSubmitted ? "已交" : "未交" }}</span>
                                </td>
                                <td class="px-2 py-1.5">
                                  <span
                                    class="rounded px-1 py-0.5 text-[10px]"
                                    :class="
                                      ex.resultSubmitted
                                        ? 'bg-emerald-50 text-emerald-800'
                                        : 'bg-slate-100 text-slate-500'
                                    "
                                  >{{ ex.resultSubmitted ? "已交" : "未交" }}</span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <!-- 该包：测验报告 -->
                      <div>
                        <h4 class="mb-2 text-[12px] font-semibold text-slate-700">
                          测验报告
                        </h4>
                        <ul
                          v-if="bundle.quizReports.length"
                          class="space-y-2"
                        >
                          <li
                            v-for="(r, ri) in bundle.quizReports"
                            :key="ri"
                            class="rounded-lg border border-slate-100 bg-white p-2.5 shadow-sm"
                          >
                            <div
                              class="flex flex-wrap items-baseline justify-between gap-1"
                            >
                              <span class="text-[12px] font-medium text-slate-900">{{
                                r.experimentTitle
                              }}</span>
                              <span
                                class="text-[11px] font-semibold tabular-nums text-indigo-700"
                              >正确率 {{ quizRatePct(r) }}%</span>
                            </div>
                            <p class="mt-0.5 text-[10px] text-slate-500">
                              {{ formatDetailTime(r.submittedAt) }}
                            </p>
                            <p class="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                              <span class="font-medium text-slate-700">AI 点评：</span
                              >{{ r.aiComment }}
                            </p>
                          </li>
                        </ul>
                        <p
                          v-else
                          class="rounded-lg bg-slate-100/80 px-2.5 py-2 text-[11px] text-slate-500"
                        >
                          该包下暂无测验报告
                        </p>
                      </div>

                      <!-- 该包：实验结果提交 -->
                      <div>
                        <h4 class="mb-2 text-[12px] font-semibold text-slate-700">
                          实验结果提交
                        </h4>
                        <ul
                          v-if="bundle.submissions.length"
                          class="space-y-2"
                        >
                          <li
                            v-for="(s, si) in bundle.submissions"
                            :key="si"
                            class="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5"
                          >
                            <div
                              class="flex flex-wrap items-baseline justify-between gap-1"
                            >
                              <span class="text-[12px] font-medium text-slate-900">{{
                                s.experimentTitle
                              }}</span>
                              <span class="text-[10px] text-slate-500">{{
                                formatDetailTime(s.submittedAt)
                              }}</span>
                            </div>
                            <p class="mt-1 text-[11px] leading-relaxed text-slate-700">
                              {{ s.text }}
                            </p>
                            <p class="mt-1 text-[10px] text-slate-500">
                              截图 {{ s.imageCount }} 张
                              <template v-if="s.attachmentName">
                                · {{ s.attachmentName }}
                              </template>
                              <template v-else> · 无附件</template>
                            </p>
                          </li>
                        </ul>
                        <p
                          v-else
                          class="rounded-lg bg-slate-100/80 px-2.5 py-2 text-[11px] text-slate-500"
                        >
                          该包下暂无实验结果提交
                        </p>
                      </div>
                    </div>
                  </details>
                </li>
              </ul>
            </section>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.edu-pkg-summary::-webkit-details-marker {
  display: none;
}
.edu-drawer-enter-active,
.edu-drawer-leave-active {
  transition: opacity 0.2s ease;
}
.edu-drawer-enter-active aside,
.edu-drawer-leave-active aside {
  transition: transform 0.25s ease;
}
.edu-drawer-enter-from,
.edu-drawer-leave-to {
  opacity: 0;
}
.edu-drawer-enter-from aside,
.edu-drawer-leave-to aside {
  transform: translateX(100%);
}
</style>
