<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  trendPoints: { label: string; value: number }[];
  barRows: { label: string; pct: number; sub: string }[];
  barTitle: string;
}>();

const trend = computed(() => {
  const pts = props.trendPoints;
  const W = 400;
  const H = 112;
  const padL = 40;
  const padR = 16;
  const padT = 12;
  const padB = 8;
  if (!pts.length) {
    return {
      lineD: "",
      areaD: "",
      coords: [] as { x: number; y: number }[],
      maxY: 1,
      W,
      H,
      padL,
      padT,
      innerW: W - padL - padR,
      innerH: H - padT - padB,
    };
  }
  const maxY = Math.max(1, ...pts.map((p) => p.value));
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = pts.length;
  const coords = pts.map((p, i) => {
    const x = padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = padT + innerH - (p.value / maxY) * innerH;
    return { x, y };
  });
  const lineD = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
    .join(" ");
  const first = coords[0]!;
  const last = coords[coords.length - 1]!;
  const areaD = `${lineD} L ${last.x} ${padT + innerH} L ${first.x} ${padT + innerH} Z`;
  return {
    lineD,
    areaD,
    coords,
    maxY,
    W,
    H,
    padL,
    padT,
    innerW,
    innerH,
  };
});
</script>

<template>
  <section class="grid gap-4 lg:grid-cols-2">
    <div
      class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5"
    >
      <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 class="text-[14px] font-semibold text-slate-900">
          学生双项完成人数趋势
        </h3>
        <span class="text-[11px] text-slate-400">演示 · 按周次累计</span>
      </div>
      <div
        v-if="trendPoints.length === 0"
        class="flex h-[200px] items-center justify-center text-[13px] text-slate-400"
      >
        暂无数据
      </div>
      <div v-else>
        <svg
          class="w-full text-slate-800"
          :viewBox="`0 0 ${trend.W} ${trend.H}`"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="edu-trend-fill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stop-color="rgb(14 165 233)" stop-opacity="0.32" />
              <stop offset="100%" stop-color="rgb(14 165 233)" stop-opacity="0.02" />
            </linearGradient>
          </defs>
          <text
            :x="trend.padL - 6"
            :y="trend.padT + 4"
            class="fill-slate-400 text-[9px]"
            text-anchor="end"
            >{{ trend.maxY }}</text
          >
          <text
            :x="trend.padL - 6"
            :y="trend.padT + trend.innerH / 2 + 4"
            class="fill-slate-400 text-[9px]"
            text-anchor="end"
            >{{ Math.round(trend.maxY / 2) }}</text
          >
          <text
            :x="trend.padL - 6"
            :y="trend.padT + trend.innerH + 4"
            class="fill-slate-400 text-[9px]"
            text-anchor="end"
            >0</text
          >
          <path
            :d="trend.areaD"
            fill="url(#edu-trend-fill)"
          />
          <path
            :d="trend.lineD"
            fill="none"
            stroke="rgb(2 132 199)"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle
            v-for="(c, i) in trend.coords"
            :key="i"
            :cx="c.x"
            :cy="c.y"
            r="3.5"
            fill="white"
            stroke="rgb(2 132 199)"
            stroke-width="2"
          />
        </svg>
        <div
          class="mt-1 flex justify-between gap-1 border-t border-slate-100 pt-2 text-[10px] text-slate-500"
        >
          <span
            v-for="(p, i) in trendPoints"
            :key="i"
            class="min-w-0 flex-1 truncate text-center"
            :title="p.label"
            >{{ p.label }}</span
          >
        </div>
      </div>
    </div>

    <div
      class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5"
    >
      <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 class="text-[14px] font-semibold text-slate-900">
          {{ barTitle }}
        </h3>
        <span class="text-[11px] text-slate-400">双项均满人数占比</span>
      </div>
      <div
        v-if="barRows.length === 0"
        class="flex h-[200px] items-center justify-center text-[13px] text-slate-400"
      >
        暂无数据
      </div>
      <ul
        v-else
        class="edu-bar-scroll max-h-[220px] space-y-3 overflow-y-auto pr-1"
      >
        <li
          v-for="(row, i) in barRows"
          :key="i"
          class="min-w-0"
        >
          <div class="mb-1 flex items-center justify-between gap-2 text-[12px]">
            <span
              class="min-w-0 truncate font-medium text-slate-800"
              :title="row.label"
              >{{ row.label }}</span
            >
            <span class="shrink-0 tabular-nums text-slate-500">{{ row.sub }}</span>
          </div>
          <div class="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-[width] duration-500"
              :style="{ width: `${Math.min(100, row.pct)}%` }"
            />
          </div>
          <p class="mt-0.5 text-right text-[11px] tabular-nums text-slate-400">
            {{ row.pct }}%
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
