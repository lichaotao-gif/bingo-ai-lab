<script setup lang="ts">
import { computed, ref } from "vue";

type BureauTrendPoint = {
  label: string;
  value: number;
  hint?: string;
};

type BureauSchoolLessonDayPoint = {
  completed: number;
  total: number;
};

type SchoolLessonTooltip = {
  x: number;
  y: number;
  label: string;
  title: string;
  dayText: string;
  completed: number;
  total: number;
  completionPct: number;
  color: string;
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

const schoolLessonTooltip = ref<SchoolLessonTooltip | null>(null);

function showSchoolLessonTooltip(
  event: MouseEvent,
  payload: Omit<SchoolLessonTooltip, "x" | "y">,
) {
  const target = event.currentTarget as SVGElement | null;
  const svg = target?.ownerSVGElement;
  const wrapper = svg?.parentElement;
  const rect = wrapper?.getBoundingClientRect();
  if (!rect) {
    return;
  }
  schoolLessonTooltip.value = {
    ...payload,
    x: Math.min(rect.width - 12, Math.max(12, event.clientX - rect.left + 12)),
    y: Math.min(rect.height - 12, Math.max(12, event.clientY - rect.top + 12)),
  };
}

function hideSchoolLessonTooltip() {
  schoolLessonTooltip.value = null;
}

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

/** 各校（班）开课：14 天；校名通过 hover 浮层显示，不常驻占用曲线区域 */
const schoolLessonDailyChart = computed(() => {
  const rows = props.schoolLessonDailyRows;
  const D = rows[0]?.series.length ?? 0;
  const padL = 46;
  const padR = 16;
  const padT = CHART_PAD_T;
  const padB = CHART_PAD_B;
  const H = CHART_VIEW_H;
  const W = 440;
  if (!rows.length || D === 0) {
    return { kind: "empty" as const, W, H: CHART_VIEW_H };
  }
  const plotInnerW = W - padL - padR;
  const plotRight = padL + plotInnerW;
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
    donePoints: {
      x: number;
      y: number;
      dayText: string;
      completed: number;
      total: number;
    }[];
    hoverTitleDone: string;
    hoverTitleTotal: string;
    lastCompleted: number;
    lastTotal: number;
    completionPct: number;
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
    const donePoints = row.series.map((p, di) => {
      const dn = di + 1;
      const c = doneCoords[di]!;
      return {
        x: c.x,
        y: c.y,
        dayText: `第 ${dn} 天`,
        completed: p.completed,
        total: p.total,
      };
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
      donePoints,
      hoverTitleDone,
      hoverTitleTotal,
      lastCompleted: lastPt.completed,
      lastTotal: lastPt.total,
      completionPct: row.completionPct,
    };
  });
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
      class="chart-command-shell flex h-full min-h-0 flex-col rounded-2xl border border-cyan-500/30 bg-slate-900/50 p-4 shadow-[inset_5px_0_0_0_rgb(6_182_212/0.6),0_0_0_1px_rgb(6_182_212/0.2)] shadow-cyan-500/5 ring-1 ring-cyan-500/20 backdrop-blur-sm sm:p-5"
    >
      <div
        class="mb-3 flex min-h-[6.75rem] shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between"
      >
        <h3 class="shrink-0 text-[14px] font-semibold text-slate-100">
          {{ schoolLessonTitle }}
        </h3>
        <p class="min-w-0 flex-1 text-[11px] leading-snug text-slate-400">
          横轴 1–14 为最近 14 天；虚线＝应开总课时，实线＝已完课时。将鼠标移到<strong>彩色折线或圆点</strong>上，浮层展示学校名称与课时数据。
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
          <div
            v-if="schoolLessonTooltip"
            class="pointer-events-none absolute z-10 max-w-[220px] rounded-xl border border-cyan-500/25 bg-slate-900/95 px-3 py-2 text-[11px] text-slate-200 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/20 backdrop-blur"
            :style="{
              left: `${schoolLessonTooltip.x}px`,
              top: `${schoolLessonTooltip.y}px`,
              transform:
                schoolLessonTooltip.x > 260
                  ? 'translate(-100%, -50%)'
                  : 'translate(0, -50%)',
            }"
          >
            <div class="mb-1 flex items-center gap-1.5">
              <span
                class="size-2 shrink-0 rounded-full"
                :style="{ backgroundColor: schoolLessonTooltip.color }"
                aria-hidden="true"
              />
              <p class="truncate font-semibold text-slate-100">
                {{ schoolLessonTooltip.label }}
              </p>
            </div>
            <p class="font-medium text-slate-300">
              {{ schoolLessonTooltip.title }}
            </p>
            <p class="mt-1 tabular-nums text-slate-400">
              {{ schoolLessonTooltip.dayText }} · 已完
              <span class="font-semibold text-cyan-200">{{ schoolLessonTooltip.completed }}</span>
              / 应开
              <span class="font-semibold text-cyan-200">{{ schoolLessonTooltip.total }}</span>
              课时
            </p>
            <p class="mt-0.5 tabular-nums text-slate-400">
              完成率
              <span class="font-semibold text-cyan-300">{{ schoolLessonTooltip.completionPct }}%</span>
            </p>
          </div>
          <svg
            class="h-full w-full text-slate-300"
            :viewBox="`0 0 ${schoolLessonDailyChart.W} ${schoolLessonDailyChart.H}`"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            :aria-label="schoolLessonTitle + '，最近 14 天，鼠标悬停折线显示学校数据'"
            @mouseleave="hideSchoolLessonTooltip"
          >
          <defs>
            <pattern id="chartGridA" width="22" height="22" patternUnits="userSpaceOnUse">
              <path d="M 22 0 L 0 0 0 22" fill="none" stroke="rgb(148 163 184 / 0.12)" stroke-width="0.65" />
            </pattern>
          </defs>
          <rect
            :x="schoolLessonDailyChart.padL"
            :y="schoolLessonDailyChart.padT"
            :width="schoolLessonDailyChart.plotRight - schoolLessonDailyChart.padL"
            :height="schoolLessonDailyChart.innerH"
            fill="url(#chartGridA)"
            opacity="0.6"
          />
          <line
            :x1="schoolLessonDailyChart.padL"
            :x2="schoolLessonDailyChart.plotRight"
            :y1="schoolLessonDailyChart.padT"
            :y2="schoolLessonDailyChart.padT"
            stroke="rgb(34 211 238 / 0.2)"
            stroke-width="1"
          />
          <line
            :x1="schoolLessonDailyChart.padL"
            :x2="schoolLessonDailyChart.plotRight"
            :y1="schoolLessonDailyChart.padT + schoolLessonDailyChart.innerH / 2"
            :y2="schoolLessonDailyChart.padT + schoolLessonDailyChart.innerH / 2"
            stroke="rgb(71 85 105 / 0.5)"
            stroke-width="1"
            stroke-dasharray="4 6"
          />
          <line
            :x1="schoolLessonDailyChart.padL"
            :x2="schoolLessonDailyChart.plotRight"
            :y1="schoolLessonDailyChart.padT + schoolLessonDailyChart.innerH"
            :y2="schoolLessonDailyChart.padT + schoolLessonDailyChart.innerH"
            stroke="rgb(71 85 105 / 0.55)"
            stroke-width="1"
          />
          <text
            :x="schoolLessonDailyChart.padL - 6"
            :y="schoolLessonDailyChart.padT + 4"
            class="fill-slate-500 text-[9px]"
            text-anchor="end"
            >{{ schoolLessonDailyChart.maxY }}</text
          >
          <text
            :x="schoolLessonDailyChart.padL - 6"
            :y="schoolLessonDailyChart.padT + schoolLessonDailyChart.innerH / 2 + 4"
            class="fill-slate-500 text-[9px]"
            text-anchor="end"
            >{{ Math.round(schoolLessonDailyChart.maxY / 2) }}</text
          >
          <text
            :x="schoolLessonDailyChart.padL - 6"
            :y="schoolLessonDailyChart.padT + schoolLessonDailyChart.innerH + 4"
            class="fill-slate-500 text-[9px]"
            text-anchor="end"
            >0</text
          >
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
              @mouseenter="
                showSchoolLessonTooltip($event, {
                  label: sch.label,
                  title: '已完课时走势',
                  dayText: '第 14 天',
                  completed: sch.lastCompleted,
                  total: sch.lastTotal,
                  completionPct: sch.completionPct,
                  color: sch.strokeDone,
                })
              "
              @mousemove="
                showSchoolLessonTooltip($event, {
                  label: sch.label,
                  title: '已完课时走势',
                  dayText: '第 14 天',
                  completed: sch.lastCompleted,
                  total: sch.lastTotal,
                  completionPct: sch.completionPct,
                  color: sch.strokeDone,
                })
              "
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
              @mouseenter="
                showSchoolLessonTooltip($event, {
                  label: sch.label,
                  title: '应开总课时计划',
                  dayText: '最近 14 天',
                  completed: sch.lastCompleted,
                  total: sch.lastTotal,
                  completionPct: sch.completionPct,
                  color: sch.strokeTotal,
                })
              "
              @mousemove="
                showSchoolLessonTooltip($event, {
                  label: sch.label,
                  title: '应开总课时计划',
                  dayText: '最近 14 天',
                  completed: sch.lastCompleted,
                  total: sch.lastTotal,
                  completionPct: sch.completionPct,
                  color: sch.strokeTotal,
                })
              "
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
              v-for="(dc, di) in sch.donePoints"
              :key="`dc-${si}-${di}`"
              :cx="dc.x"
              :cy="dc.y"
              r="3.25"
              fill="rgb(15 23 42)"
              :stroke="sch.strokeDone"
              stroke-width="1.75"
              pointer-events="auto"
              @mouseenter="
                showSchoolLessonTooltip($event, {
                  label: sch.label,
                  title: '已完课时',
                  dayText: dc.dayText,
                  completed: dc.completed,
                  total: dc.total,
                  completionPct: sch.completionPct,
                  color: sch.strokeDone,
                })
              "
              @mousemove="
                showSchoolLessonTooltip($event, {
                  label: sch.label,
                  title: '已完课时',
                  dayText: dc.dayText,
                  completed: dc.completed,
                  total: dc.total,
                  completionPct: sch.completionPct,
                  color: sch.strokeDone,
                })
              "
            >
              <title>{{ sch.label }} · {{ dc.dayText }}｜已完 {{ dc.completed }} 课时，应开 {{ dc.total }} 课时，完成率 {{ sch.completionPct }}%</title>
            </circle>
          </g>
          </svg>
        </div>
        <div
          class="mt-1 flex justify-between gap-0 border-t border-white/10 pt-2 text-[9px] text-slate-400"
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
      class="chart-command-shell flex h-full min-h-0 flex-col rounded-2xl border border-cyan-500/30 bg-slate-900/50 p-4 shadow-[inset_5px_0_0_0_rgb(6_182_212/0.6),0_0_0_1px_rgb(6_182_212/0.2)] shadow-cyan-500/5 ring-1 ring-cyan-500/20 backdrop-blur-sm sm:p-5"
    >
      <div
        class="mb-3 flex min-h-[6.75rem] shrink-0 flex-col gap-2"
      >
        <div
          class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
        >
          <h3 class="text-[14px] font-semibold text-slate-100">
            学生实验与测验完成人数
          </h3>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-300">
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
        <p class="text-[11px] leading-snug text-slate-500">
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
            class="h-full w-full text-slate-300"
            :viewBox="`0 0 ${dualTrend.W} ${dualTrend.H}`"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
          <defs>
            <pattern id="chartGridB" width="22" height="22" patternUnits="userSpaceOnUse">
              <path d="M 22 0 L 0 0 0 22" fill="none" stroke="rgb(148 163 184 / 0.12)" stroke-width="0.65" />
            </pattern>
          </defs>
          <rect
            :x="dualTrend.padL"
            :y="dualTrend.padT"
            :width="dualTrend.W - dualTrend.padL - 12"
            :height="dualTrend.innerH"
            fill="url(#chartGridB)"
            opacity="0.6"
          />
          <line
            :x1="dualTrend.padL"
            :x2="dualTrend.W - 12"
            :y1="dualTrend.padT"
            :y2="dualTrend.padT"
            stroke="rgb(34 211 238 / 0.2)"
            stroke-width="1"
          />
          <line
            :x1="dualTrend.padL"
            :x2="dualTrend.W - 12"
            :y1="dualTrend.padT + dualTrend.innerH / 2"
            :y2="dualTrend.padT + dualTrend.innerH / 2"
            stroke="rgb(71 85 105 / 0.5)"
            stroke-width="1"
            stroke-dasharray="4 6"
          />
          <line
            :x1="dualTrend.padL"
            :x2="dualTrend.W - 12"
            :y1="dualTrend.padT + dualTrend.innerH"
            :y2="dualTrend.padT + dualTrend.innerH"
            stroke="rgb(71 85 105 / 0.55)"
            stroke-width="1"
          />
          <text
            :x="dualTrend.padL - 6"
            :y="dualTrend.padT + 4"
            class="fill-slate-500 text-[9px]"
            text-anchor="end"
            >{{ dualTrend.maxY }}</text
          >
          <text
            :x="dualTrend.padL - 6"
            :y="dualTrend.padT + dualTrend.innerH / 2 + 4"
            class="fill-slate-500 text-[9px]"
            text-anchor="end"
            >{{ Math.round(dualTrend.maxY / 2) }}</text
          >
          <text
            :x="dualTrend.padL - 6"
            :y="dualTrend.padT + dualTrend.innerH + 4"
            class="fill-slate-500 text-[9px]"
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
            fill="rgb(15 23 42)"
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
            fill="rgb(15 23 42)"
            stroke="rgb(251 146 60)"
            stroke-width="1.75"
          >
            <title>{{ dualTrend.xHints[i] }} · 测验全完成 {{ quizTrendPoints[i]?.value }} 人</title>
          </circle>
          </svg>
        </div>
        <div
          class="mt-1 flex justify-between gap-0 border-t border-white/10 pt-2 text-[9px] text-slate-400"
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
  position: relative;
}
.chart-panel-skeleton {
  aspect-ratio: 440 / 196;
}
.chart-command-shell {
  position: relative;
  overflow: hidden;
}
.chart-command-shell::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgb(34 211 238 / 0.04) 0%,
    transparent 22%,
    transparent 75%,
    rgb(56 189 248 / 0.03) 100%
  );
}
.chart-command-shell::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    110deg,
    transparent 0%,
    transparent 4%,
    rgb(34 211 238 / 0.35) 47%,
    rgb(99 102 241 / 0.16) 54%,
    transparent 64%,
    transparent 100%
  );
  mix-blend-mode: screen;
  transform: translateX(-130%);
  animation: chart-scan 6.5s ease-in-out infinite;
}
@keyframes chart-scan {
  0% {
    transform: translateX(-130%);
  }
  100% {
    transform: translateX(130%);
  }
}
</style>
