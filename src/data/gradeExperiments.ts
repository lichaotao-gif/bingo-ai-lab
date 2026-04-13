import { AI_COVER_IMAGES } from "@/constants/aiCoverImages";

/** 与 AI 实验室大厅年级顺序一致：0～5 */
export const GRADE_LABELS = [
  "一年级（上）",
  "二年级（上）",
  "三年级（上）",
  "四年级（上）",
  "五年级（上）",
  "六年级（上）",
] as const;

export interface ExperimentItem {
  id: string;
  title: string;
  description: string;
  cover: string;
  completed?: boolean;
}

const BASE_LIST: Omit<ExperimentItem, "cover">[] = [
  {
    id: "graphical-programming",
    title: "图形化编程实践",
    description: "通过拖拽积木完成简单逻辑，理解程序顺序与循环。",
    completed: false,
  },
  {
    id: "gesture-snake",
    title: "手势贪吃蛇",
    description: "用手势控制方向，体验人机交互与实时识别。",
    completed: true,
  },
  {
    id: "rps-pk",
    title: "剪刀石头布 PK",
    description: "摄像头捕捉手势，与机器进行对战并记录胜负。",
    completed: false,
  },
  {
    id: "object-recognition",
    title: "物体识别实践",
    description: "调用分类模型识别常见物体，理解置信度与标签。",
    completed: true,
  },
  {
    id: "plate-recognition",
    title: "车牌识别",
    description: "从场景图中定位车牌区域并识别字符（演示数据）。",
    completed: false,
  },
  {
    id: "face-compare",
    title: "人脸比对",
    description: "提取人脸特征向量，计算相似度并给出匹配结果。",
    completed: false,
  },
  {
    id: "image-segmentation",
    title: "图像分割",
    description: "区分前景与背景，了解语义分割的基本输出形式。",
    completed: false,
  },
  {
    id: "face-tracking",
    title: "人脸追踪",
    description: "在视频流中持续框定人脸，观察跟踪稳定性。",
    completed: false,
  },
];

/** 每个实验固定一张不同的 AI 主题封面，避免同页重复或「看起来都一样」。 */
const EXPERIMENT_COVER_INDEX: Record<string, number> = {
  "graphical-programming": 0,
  "gesture-snake": 1,
  "rps-pk": 2,
  "object-recognition": 3,
  "plate-recognition": 4,
  "face-compare": 5,
  "image-segmentation": 6,
  "face-tracking": 7,
};

/**
 * 某年级下的全部实验（演示数据：各年级条目相同；封面按实验 id 固定，各实验互不相同）。
 */
export function getExperimentsForGrade(_gradeIndex: number): ExperimentItem[] {
  return BASE_LIST.map((item) => ({
    ...item,
    cover: AI_COVER_IMAGES[EXPERIMENT_COVER_INDEX[item.id] ?? 0]!,
  }));
}

export function parseGradeId(param: string | undefined): number {
  const n = parseInt(String(param), 10);
  if (Number.isNaN(n) || n < 0 || n >= GRADE_LABELS.length) {
    return 0;
  }
  return n;
}

export function gradeLabel(gradeIndex: number): string {
  return GRADE_LABELS[gradeIndex] ?? GRADE_LABELS[0]!;
}
