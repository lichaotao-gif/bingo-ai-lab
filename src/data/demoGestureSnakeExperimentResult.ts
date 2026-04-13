import type { ExperimentResultSubmit } from "@/types/experimentResultSubmit";

const DEMO_ID = "demo-gesture-snake-submit-v1";

/** 与实验页画布风格一致的「完成局」示意截图（SVG → data URL，便于离线展示） */
function gestureSnakeCompletedScreenshotDataUrl(): string {
  const cell = 20;
  const grid = 18;
  const w = 360;
  const h = 360;
  const snake: [number, number][] = [
    [5, 9],
    [6, 9],
    [7, 9],
    [8, 9],
    [9, 9],
    [10, 9],
    [11, 9],
    [12, 9],
  ];
  const food: [number, number] = [14, 6];

  let gridLines = "";
  for (let i = 0; i <= grid; i++) {
    const p = i * cell;
    gridLines += `<path d="M${p} 0V${h}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
    gridLines += `<path d="M0 ${p}H${w}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
  }

  let body = "";
  for (const [gx, gy] of snake) {
    const pad = 3;
    body += `<rect x="${gx * cell + pad}" y="${gy * cell + pad}" width="${cell - pad * 2}" height="${cell - pad * 2}" fill="#fb923c" rx="2"/>`;
  }
  const [fx, fy] = food;
  body += `<rect x="${fx * cell + 1}" y="${fy * cell + 1}" width="${cell - 2}" height="${cell - 2}" fill="#34d399" rx="2"/>`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#141824"/>${gridLines}${body}<text x="180" y="26" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="13" font-family="system-ui,sans-serif">手势贪吃蛇 · 游戏结束</text><text x="180" y="345" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-size="12" font-family="system-ui,sans-serif">得分 12 · 演示截图</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const DEMO_TEXT = `本次「手势贪吃蛇」实验已完成。

使用摄像头识别食指相对手腕的方向控制蛇的移动，本局得分 12 分，蛇身长度达到 8 节，未发生撞墙或自咬。操作过程中方向识别较为稳定，建议在光线均匀、背景简洁的环境下进行，以便提高识别准确率。

以下为游戏结束时的画面截图，并附实验过程简要记录（文本附件）供查阅。`;

/**
 * 当本地尚无真实提交时，为演示账号返回一条完整的模拟记录（文字 + 截图 + 附件元信息）。
 * 若用户在同一年级下真实提交过，仍以 localStorage 为准。
 */
export function getDemoGestureSnakeResultIfApplicable(
  experimentId: string,
  gradeLabel: string,
  studentName: string,
): ExperimentResultSubmit | undefined {
  if (
    experimentId !== "gesture-snake" ||
    gradeLabel !== "二年级（上）" ||
    studentName !== "李超涛"
  ) {
    return undefined;
  }
  return {
    id: DEMO_ID,
    experimentId: "gesture-snake",
    gradeLabel: "二年级（上）",
    studentName: "李超涛",
    submittedAt: "2026-02-10T06:16:00.000Z",
    text: DEMO_TEXT,
    images: [
      {
        name: "gesture-snake-完成画面.png",
        dataUrl: gestureSnakeCompletedScreenshotDataUrl(),
      },
    ],
    attachment: {
      name: "贪吃蛇实验记录.txt",
      size: 1536,
    },
  };
}
