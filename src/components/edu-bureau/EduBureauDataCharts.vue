<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  experimentTrendPoints: { label: string; value: number }[];
  quizTrendPoints: { label: string; value: number }[];
  schoolLessonRows: {
    label: string;
    totalLessonHours: number;
    completedLessonHours: number;
    completionPct: number;
  }[];
  schoolLessonTitle: string;
}>();

const dualTrend = computed(() => {
  const exp = props.experimentTrendPoints;
  const quiz = props.quizTrendPoints;
  const W = 400;
  const H = 124;
  const padL = 42;
  const padR = 12;
  const padT = 12;
  const padB = 10;
  if (!exp.length || !quiz.length || exp.length !== quiz.length) {
    return {
      kind: "empty" as const,
      W,
      H,
    };
  }
  const maxY = Math.max(1, ...exp.map((p) => p.value), ...quiz.map((p) => p.value));
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = exp.length;
  function toCoords(pts: typeof exp) {
    return pts.map((p, i) => {
      const x =
        padL + (n === 1 ? innerW / 2 : (i / Math.max(1, n - 1)) * innerW);
      const y = padT + innerH - (p.value / maxY) * innerH;
      return { x, y };
    });
  }
  const expCoords = toCoords(exp);
  const quizCoords = toCoords(quiz);
  const lineD = (coords: { x: number; y: number }[]) =>
    coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  return {
    kind: "ok" as const,
    maxY,
    W,
    H,
    padL,
    padT,
    innerH,
    expLineD: lineD(expCoords),
    quizLineD: lineD(quizCoords),
    expCoords,
    quizCoords,
    weekLabels: exp.map((p) => p.label),
  };
});
</script>

<template>
  <section class="grid gap-4 lg:grid-cols-2">
    <div
      class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5"
    >
      <div class="mb-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h3 class="text-[14px] font-semibold text-slate-900">
          学生实验与测验完成人数
        </h3>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
          <span class="inline-flex items-center gap-1.5">
            <span
              class="size-2 shrink-0 rounded-full bg-sky-600"
              aria-hidden="true"
            />
            实验全完成人数
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span
              class="size-2 shrink-0 rounded-full bg-amber-600"
              aria-hidden="true"
            />
            测验全完成人数
          </span>
        </div>
      </div>
      <p class="mb-2 text-[11px] text-slate-400">
        按周次累计；折线终点为当前筛选下实验、测验分别「全完成」人数
      </p>
      <div
        v-if="dualTrend.kind === 'empty'"
        class="flex h-[200px] items-center justify-center text-[13px] text-slate-400"
      >
        暂无数据
      </div>
      <div v-else>
        <svg
          class="w-full text-slate-800"
          :viewBox="`0 0 ${dualTrend.W} ${dualTrend.H}`"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <text
            :x="dualTrend.padL - 6"
            :y="dualTrend.padT + 4"
            class="fill-slate-400 text-[9px]"
            text-anchor="end"
            >{{ dualTrend.maxY }}</text
          >
          <text
            :x="dualTrend.padL - 6"
            :y="dualTrend.padT + dualTrend.innerH / 2 + 4"
            class="fill-slate-400 text-[9px]"
            text-anchor="end"
            >{{ Math.round(dualTrend.maxY / 2) }}</text
          >
          <text
            :x="dualTrend.padL - 6"
            :y="dualTrend.padT + dualTrend.innerH + 4"
            class="fill-slate-400 text-[9px]"
            text-anchor="end"
            >0</text
          >
          <path
            :d="dualTrend.expLineD"
            fill="none"
            stroke="rgb(2 132 199)"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            :d="dualTrend.quizLineD"
            fill="none"
            stroke="rgb(217 119 6)"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle
            v-for="(c, i) in dualTrend.expCoords"
            :key="`e-${i}`"
            :cx="c.x"
            :cy="c.y"
            r="3.5"
            fill="white"
            stroke="rgb(2 132 199)"
            stroke-width="2"
          />
          <circle
            v-for="(c, i) in dualTrend.quizCoords"
            :key="`q-${i}`"
            :cx="c.x"
            :cy="c.y"
            r="3.5"
            fill="white"
            stroke="rgb(217 119 6)"
            stroke-width="2"
          />
        </svg>
        <div
          class="mt-1 flex justify-between gap-1 border-t border-slate-100 pt-2 text-[10px] text-slate-500"
        >
          <span
            v-for="(lab, i) in dualTrend.weekLabels"
            :key="i"
            class="min-w-0 flex-1 truncate text-center"
            :title="lab"
            >{{ lab }}</span
          >
        </div>
      </div>
    </div>

    <div
      class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5"
    >
      <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 class="text-[14px] font-semibold text-slate-900">
          {{ schoolLessonTitle }}
        </h3>
        <span class="text-[11px] text-slate-400">班 · 课时完成率</span>
      </div>
      <div
        v-if="schoolLessonRows.length === 0"
        class="flex h-[200px] items-center justify-center text-[13px] text-slate-400"
      >
        暂无数据
      </div>
      <ul
        v-else
        class="edu-bar-scroll max-h-[220px] space-y-3 overflow-y-auto pr-1"
      >
        <li
          v-for="(row, i) in schoolLessonRows"
          :key="i"
          class="min-w-0"
        >
          <div class="mb-1 flex items-center justify-between gap-2 text-[12px]">
            <span
              class="min-w-0 truncate font-medium text-slate-800"
              :title="row.label"
              >{{ row.label }}</span
            >
            <span
              class="shrink-0 tabular-nums text-[11px] text-slate-500"
            >
              总 {{ row.totalLessonHours }} 课时 · 已 {{ row.completedLessonHours }}
            </span>
          </div>
          <div class="h-2.5 w-full overflow-hidden rounded-full bg-amber-100/90">
            <div
              class="h-full rounded-full bg-gradient-to-r from-amber-500 to-teal-600 transition-[width] duration-500"
              :style="{ width: `${Math.min(100, row.completionPct)}%` }"
            />
          </div>
          <p class="mt-0.5 text-right text-[11px] tabular-nums text-slate-500">
            完成率 {{ row.completionPct }}%
          </p>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.edu-bar-scroll {
  scrollbar-gutter: stable;
}
</style>
