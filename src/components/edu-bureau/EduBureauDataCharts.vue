<script setup lang="ts">
import { computed } from "vue";

type BureauTrendPoint = {
  label: string;
  value: number;
  hint?: string;
};

type BureauSchoolLessonDayPoint = {
  completed: number;
  total: number;
};

const props = defineProps<{
  experimentTrendPoints: BureauTrendPoint[];
  quizTrendPoints: BureauTrendPoint[];
  schoolLessonDailyRows: {
    label: string;
    completionPct: number;
    series: BureauSchoolLessonDayPoint[];
  }[];
  schoolLessonTitle: string;
}>();

/** 已完课时折线 */
const DONE_STROKE_PALETTE = [
  "rgb(2 132 199)",
  "rgb(16 185 129)",
  "rgb(245 158 11)",
  "rgb(168 85 247)",
  "rgb(236 72 153)",
  "rgb(249 115 22)",
  "rgb(99 102 241)",
];

/** 应开总课时水平线（与已完同色族区分、均为高饱和色） */
const TOTAL_STROKE_PALETTE = [
  "rgb(14 165 233)",
  "rgb(52 211 153)",
  "rgb(251 191 36)",
  "rgb(192 132 252)",
  "rgb(251 113 133)",
  "rgb(251 146 60)",
  "rgb(129 140 248)",
];

/** 与 schoolLessonDailyChart 画布高度、上下留白一致，左右两图比例对齐 */
const CHART_VIEW_H = 196;
const CHART_PAD_T = 16;
const CHART_PAD_B = 36;

const dualTrend = computed(() => {
  const exp = props.experimentTrendPoints;
  const quiz = props.quizTrendPoints;
  const W = 440;
  const H = CHART_VIEW_H;
  const padL = 42;
  const padR = 12;
  const padT = CHART_PAD_T;
  const padB = CHART_PAD_B;
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
  function toCoords(pts: BureauTrendPoint[]) {
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
    xLabels: exp.map((p) => p.label),
    xHints: exp.map((p) => p.hint ?? `第 ${p.label} 天`),
  };
});

/** 各校（班）开课：14 天；曲线末端标注校名；整条线可悬停查看说明 */
const schoolLessonDailyChart = computed(() => {
  const rows = props.schoolLessonDailyRows;
  const D = rows[0]?.series.length ?? 0;
  const padL = 46;
  const padR = 10;
  const padT = CHART_PAD_T;
  const padB = CHART_PAD_B;
  const labelColumn = 102;
  const H = CHART_VIEW_H;
  if (!rows.length || D === 0) {
    return { kind: "empty" as const, W: 440, H: CHART_VIEW_H };
  }
  const plotInnerW = Math.max(200, (D - 1) * 22);
  const plotRight = padL + plotInnerW;
  const W = plotRight + labelColumn + padR;
  let maxY = 1;
  for (const r of rows) {
    for (const p of r.series) {
      maxY = Math.max(maxY, p.total, p.completed);
    }
  }
  const innerH = H - padT - padB;
  function toX(dayIndex: number) {
    return (
      padL +
      (D === 1 ? plotInnerW / 2 : (dayIndex / Math.max(1, D - 1)) * plotInnerW)
    );
  }
  function toY(v: number) {
    return padT + innerH - (v / maxY) * innerH;
  }
  const lineD = (coords: { x: number; y: number }[]) =>
    coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  type Sch = {
    label: string;
    totalLineD: string;
    doneLineD: string;
    strokeDone: string;
    strokeTotal: string;
    lastCoord: { x: number; y: number };
    doneCoords: { x: number; y: number }[];
    dayPointTitles: string[];
    hoverTitleDone: string;
    hoverTitleTotal: string;
    labelX: number;
    labelY: number;
    leaderX2: number;
  };
  const schools: Sch[] = rows.map((row, si) => {
    const totalCoords = row.series.map((p, i) => ({
      x: toX(i),
      y: toY(p.total),
    }));
    const doneCoords = row.series.map((p, i) => ({
      x: toX(i),
      y: toY(p.completed),
    }));
    const lastPt = row.series[D - 1]!;
    const lastCoord = doneCoords[D - 1]!;
    const dayPointTitles = row.series.map((p, di) => {
      const dn = di + 1;
      return `${row.label} · 第 ${dn} 天｜已完 ${p.completed} 课时，应开 ${p.total} 课时，完成率 ${row.completionPct}%`;
    });
    const hoverTitleDone = `${row.label}（已完课时走势）｜第 ${D} 天已完 ${lastPt.completed}、应开 ${lastPt.total} 课时，完成率 ${row.completionPct}%`;
    const hoverTitleTotal = `${row.label}（应开总课时计划）｜${lastPt.total} 课时（14 天内为水平计划线）`;
    return {
      label: row.label,
      totalLineD: lineD(totalCoords),
      doneLineD: lineD(doneCoords),
      strokeDone: DONE_STROKE_PALETTE[si % DONE_STROKE_PALETTE.length]!,
      strokeTotal: TOTAL_STROKE_PALETTE[si % TOTAL_STROKE_PALETTE.length]!,
      lastCoord,
      doneCoords,
      dayPointTitles,
      hoverTitleDone,
      hoverTitleTotal,
      labelX: W - padR - 4,
      labelY: lastCoord.y,
      leaderX2: W - padR - labelColumn + 4,
    };
  });
  /** 末端校名纵坐标避让，避免重叠 */
  const order = schools
    .map((s, i) => ({ i, y: s.lastCoord.y }))
    .sort((a, b) => a.y - b.y);
  const minGap = Math.max(11, Math.min(14, Math.floor(innerH / (schools.length + 2))));
  let prev = padT + 4;
  const labelYByI = new Map<number, number>();
  for (const { i, y } of order) {
    let ly = Math.max(y, prev + minGap * 0.35);
    if (ly < prev + minGap) {
      ly = prev + minGap;
    }
    labelYByI.set(i, ly);
    prev = ly;
  }
  const yMax = H - padB - 6;
  let maxLabelY = 0;
  for (const { i } of order) {
    maxLabelY = Math.max(maxLabelY, labelYByI.get(i) ?? 0);
  }
  const overflow = maxLabelY - yMax;
  if (overflow > 0) {
    for (const { i } of order) {
      labelYByI.set(i, (labelYByI.get(i) ?? 0) - overflow);
    }
  }
  for (let si = 0; si < schools.length; si++) {
    const s = schools[si]!;
    s.labelY = labelYByI.get(si) ?? s.lastCoord.y;
    s.leaderX2 = Math.min(s.lastCoord.x + 28, s.labelX - 14);
  }
  const dayLabels = Array.from({ length: D }, (_, i) => `${i + 1}`);
  const dayHints = Array.from({ length: D }, (_, i) => `第 ${i + 1} 天`);
  return {
    kind: "ok" as const,
    maxY,
    W,
    H,
    padL,
    padT,
    padB,
    innerH,
    plotRight,
    schools,
    dayLabels,
    dayHints,
  };
});
</script>

<template>
  <section class="grid gap-4 lg:grid-cols-2 lg:items-stretch">
    <!-- 左：各校开课 14 天 -->
    <div
      class="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5"
    >
      <div
        class="mb-3 flex min-h-[6.75rem] shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between"
      >
        <h3 class="shrink-0 text-[14px] font-semibold text-slate-900">
          {{ schoolLessonTitle }}
        </h3>
        <p class="min-w-0 flex-1 text-[11px] leading-snug text-slate-500">
          横轴 1–14 为最近 14 天；右侧为校名。虚线＝应开总课时，实线＝已完课时。将鼠标移到<strong>彩色折线</strong>上可查看该校与课时说明；移到<strong>圆点</strong>上可查看对应天数。
        </p>
      </div>
      <div
        v-if="schoolLessonDailyChart.kind === 'empty'"
        class="chart-panel-skeleton flex items-center justify-center text-[13px] text-slate-400"
      >
        暂无数据
      </div>
      <div
        v-else
        class="flex min-h-0 flex-1 flex-col"
      >
        <div class="chart-viewbox-slot w-full shrink-0">
          <svg
            class="h-full w-full text-slate-800"
            :viewBox="`0 0 ${schoolLessonDailyChart.W} ${schoolLessonDailyChart.H}`"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            :aria-label="schoolLessonTitle + '，最近 14 天，各校折线末端为校名'"
          >
          <text
            :x="schoolLessonDailyChart.padL - 6"
            :y="schoolLessonDailyChart.padT + 4"
            class="fill-slate-400 text-[9px]"
            text-anchor="end"
            >{{ schoolLessonDailyChart.maxY }}</text
          >
          <text
            :x="schoolLessonDailyChart.padL - 6"
            :y="schoolLessonDailyChart.padT + schoolLessonDailyChart.innerH / 2 + 4"
            class="fill-slate-400 text-[9px]"
            text-anchor="end"
            >{{ Math.round(schoolLessonDailyChart.maxY / 2) }}</text
          >
          <text
            :x="schoolLessonDailyChart.padL - 6"
            :y="schoolLessonDailyChart.padT + schoolLessonDailyChart.innerH + 4"
            class="fill-slate-400 text-[9px]"
            text-anchor="end"
            >0</text
          >
          <line
            :x1="schoolLessonDailyChart.plotRight"
            :y1="schoolLessonDailyChart.padT"
            :x2="schoolLessonDailyChart.plotRight"
            :y2="schoolLessonDailyChart.padT + schoolLessonDailyChart.innerH"
            class="stroke-slate-200/90"
            stroke-width="1"
            stroke-dasharray="3 3"
            pointer-events="none"
          />
          <!-- 可见折线 -->
          <g
            v-for="(sch, si) in schoolLessonDailyChart.schools"
            :key="`line-${si}`"
          >
            <path
              :d="sch.totalLineD"
              fill="none"
              :stroke="sch.strokeTotal"
              stroke-width="2.25"
              stroke-dasharray="6 4"
              stroke-linecap="round"
              stroke-linejoin="round"
              pointer-events="none"
            />
            <path
              :d="sch.doneLineD"
              fill="none"
              :stroke="sch.strokeDone"
              stroke-width="2.25"
              stroke-linecap="round"
              stroke-linejoin="round"
              pointer-events="none"
            />
          </g>
          <!-- 宽透明描边：整条线悬停即显示该校说明（圆点叠在上面时显示「第 n 天」） -->
          <g
            v-for="(sch, si) in schoolLessonDailyChart.schools"
            :key="`hit-${si}`"
          >
            <path
              :d="sch.doneLineD"
              fill="none"
              stroke="transparent"
              stroke-width="14"
              stroke-linecap="round"
              stroke-linejoin="round"
              pointer-events="stroke"
            >
              <title>{{ sch.hoverTitleDone }}</title>
            </path>
            <path
              :d="sch.totalLineD"
              fill="none"
              stroke="transparent"
              stroke-width="14"
              stroke-linecap="round"
              stroke-linejoin="round"
              pointer-events="stroke"
            >
              <title>{{ sch.hoverTitleTotal }}</title>
            </path>
          </g>
          <!-- 已完折线节点 + 末端校名 -->
          <g
            v-for="(sch, si) in schoolLessonDailyChart.schools"
            :key="`mark-${si}`"
          >
            <circle
              v-for="(dc, di) in sch.doneCoords"
              :key="`dc-${si}-${di}`"
              :cx="dc.x"
              :cy="dc.y"
              r="3.25"
              fill="white"
              :stroke="sch.strokeDone"
              stroke-width="1.75"
              pointer-events="auto"
            >
              <title>{{ sch.dayPointTitles[di] }}</title>
            </circle>
            <line
              :x1="sch.lastCoord.x + 3"
              :y1="sch.lastCoord.y"
              :x2="sch.leaderX2"
              :y2="sch.labelY"
              fill="none"
              :stroke="sch.strokeDone"
              stroke-opacity="0.4"
              stroke-width="1"
              stroke-dasharray="3 2"
              pointer-events="none"
            />
            <text
              :x="sch.labelX"
              :y="sch.labelY"
              dominant-baseline="middle"
              text-anchor="end"
              class="text-[9px] font-semibold"
              :fill="sch.strokeDone"
              stroke="white"
              stroke-width="3.5"
              paint-order="stroke fill"
              pointer-events="none"
            >
              {{ sch.label }}
            </text>
          </g>
          </svg>
        </div>
        <div
          class="mt-1 flex justify-between gap-0 border-t border-slate-100 pt-2 text-[9px] text-slate-500"
        >
          <span
            v-for="(lab, i) in schoolLessonDailyChart.dayLabels"
            :key="i"
            class="min-w-0 flex-1 text-center tabular-nums"
            :title="schoolLessonDailyChart.dayHints[i]"
            >{{ lab }}</span
          >
        </div>
      </div>
    </div>

    <!-- 右：实验 / 测验 14 天 -->
    <div
      class="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5"
    >
      <div
        class="mb-3 flex min-h-[6.75rem] shrink-0 flex-col gap-2"
      >
        <div
          class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
        >
          <h3 class="text-[14px] font-semibold text-slate-900">
            学生实验与测验完成人数
          </h3>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
            <span class="inline-flex items-center gap-1.5">
              <span
                class="size-2 shrink-0 rounded-full bg-[rgb(14,165,233)]"
                aria-hidden="true"
              />
              实验全完成人数
            </span>
            <span class="inline-flex items-center gap-1.5">
              <span
                class="size-2 shrink-0 rounded-full bg-[rgb(251,146,60)]"
                aria-hidden="true"
              />
              测验全完成人数
            </span>
          </div>
        </div>
        <p class="text-[11px] leading-snug text-slate-400">
          最近 14 天、每日一点；折线终点为当前筛选下实验、测验分别「全完成」人数
        </p>
      </div>
      <div
        v-if="dualTrend.kind === 'empty'"
        class="chart-panel-skeleton flex items-center justify-center text-[13px] text-slate-400"
      >
        暂无数据
      </div>
      <div
        v-else
        class="flex min-h-0 flex-1 flex-col"
      >
        <div class="chart-viewbox-slot w-full shrink-0">
          <svg
            class="h-full w-full text-slate-800"
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
            stroke="rgb(14 165 233)"
            stroke-width="2.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            :d="dualTrend.quizLineD"
            fill="none"
            stroke="rgb(251 146 60)"
            stroke-width="2.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle
            v-for="(c, i) in dualTrend.expCoords"
            :key="`e-${i}`"
            :cx="c.x"
            :cy="c.y"
            r="2.5"
            fill="white"
            stroke="rgb(14 165 233)"
            stroke-width="1.75"
          >
            <title>{{ dualTrend.xHints[i] }} · 实验全完成 {{ experimentTrendPoints[i]?.value ?? 0 }} 人</title>
          </circle>
          <circle
            v-for="(c, i) in dualTrend.quizCoords"
            :key="`q-${i}`"
            :cx="c.x"
            :cy="c.y"
            r="2.5"
            fill="white"
            stroke="rgb(251 146 60)"
            stroke-width="1.75"
          >
            <title>{{ dualTrend.xHints[i] }} · 测验全完成 {{ quizTrendPoints[i]?.value }} 人</title>
          </circle>
          </svg>
        </div>
        <div
          class="mt-1 flex justify-between gap-0 border-t border-slate-100 pt-2 text-[9px] text-slate-500"
        >
          <span
            v-for="(lab, i) in dualTrend.xLabels"
            :key="i"
            class="min-w-0 flex-1 text-center tabular-nums"
            :title="dualTrend.xHints[i]"
            >{{ lab }}</span
          >
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* 左右图表区域统一外框比例（与右侧 viewBox 440×196 一致），画布垂直对齐 */
.chart-viewbox-slot {
  aspect-ratio: 440 / 196;
}
.chart-panel-skeleton {
  aspect-ratio: 440 / 196;
}
</style>
