/**
 * 测验题型（整体梳理）
 *
 * 1. 单选题 — single
 * 2. 多选题 — multi
 * 3. 判断题 — truefalse
 * 4. 填空题 — fill
 * 5. 连线题 — match
 * 6. 拖拽排序 — sort
 * 7. 选择题（题干文字 + 配图，选项为文字）— text_figure_choice
 * 8. 选择题（题干为图，选项为文字）— image_stem
 * 9. 选择题（题干文字 + 图选项）— image_pick（含 choiceHint，如「请选择」）
 *
 * 另保留简答题 short，供部分实验旧题兼容。
 */

export type QuizQuestionType =
  | "single"
  | "multi"
  | "truefalse"
  | "fill"
  | "short"
  | "match"
  | "sort"
  | "image_pick"
  | "image_stem"
  | "text_figure_choice";

export interface QuizQuestionBase {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  points: number;
}

export interface SingleQuizQuestion extends QuizQuestionBase {
  type: "single";
  options: string[];
  correctIndex: number;
}

export interface MultiQuizQuestion extends QuizQuestionBase {
  type: "multi";
  options: string[];
  correctIndices: number[];
}

export interface TrueFalseQuizQuestion extends QuizQuestionBase {
  type: "truefalse";
  correct: boolean;
}

export interface FillQuizQuestion extends QuizQuestionBase {
  type: "fill";
  acceptable: string[];
}

export interface ShortQuizQuestion extends QuizQuestionBase {
  type: "short";
  keywords: string[];
}

/** 连线题：左右一一对应，每列内不重复 */
export interface MatchQuizQuestion extends QuizQuestionBase {
  type: "match";
  leftItems: string[];
  rightItems: string[];
  /** leftItems[i] 对应 rightItems[correctRightIndices[i]] */
  correctRightIndices: number[];
}

/** 拖拽排序：将 items 排成正确顺序；correctOrder 为自上而下应为的下标序列 */
export interface SortQuizQuestion extends QuizQuestionBase {
  type: "sort";
  items: string[];
  correctOrder: number[];
}

/** 选择题：题干文字与配图，选项为文字 */
export interface TextFigureChoiceQuizQuestion extends QuizQuestionBase {
  type: "text_figure_choice";
  stemImage: string;
  options: string[];
  correctIndex: number;
}

/**
 * 图选项单选：题干为文字，选项为图片（演示用内联 SVG）
 * choiceHint：题型 9 时可为「请选择」等副文案
 */
export interface ImagePickQuizQuestion extends QuizQuestionBase {
  type: "image_pick";
  choiceHint?: string;
  optionImages: string[];
  labels?: string[];
  correctIndex: number;
}

/** 题干为图，选项为文字 */
export interface ImageStemQuizQuestion extends QuizQuestionBase {
  type: "image_stem";
  /** 题干图片；prompt 可作文案补充，可为空 */
  stemImage: string;
  options: string[];
  correctIndex: number;
}

export type QuizQuestion =
  | SingleQuizQuestion
  | MultiQuizQuestion
  | TrueFalseQuizQuestion
  | FillQuizQuestion
  | ShortQuizQuestion
  | MatchQuizQuestion
  | SortQuizQuestion
  | ImagePickQuizQuestion
  | ImageStemQuizQuestion
  | TextFigureChoiceQuizQuestion;

/** 演示用占位图（内联 SVG，不依赖外网） */
export function quizSvgPlaceholder(label: string, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100" viewBox="0 0 160 100"><rect fill="${bg}" width="160" height="100" rx="8"/><text x="80" y="58" text-anchor="middle" fill="#fff" font-size="20" font-family="system-ui,sans-serif">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const GENERIC_QUIZ: QuizQuestion[] = [
  {
    id: "t1",
    type: "single",
    prompt: "本实验中，AI 能力主要体现在哪一类任务？",
    points: 12,
    options: [
      "仅数据存储",
      "感知、理解与简单决策",
      "替代教师全部工作",
      "与实验无关",
    ],
    correctIndex: 1,
  },
  {
    id: "t2",
    type: "multi",
    prompt: "下列哪些属于负责任地使用 AI 的做法？（多选）",
    points: 11,
    options: [
      "核对关键结论",
      "保护个人隐私数据",
      "盲目相信模型输出",
      "在教师指导下完成实验",
    ],
    correctIndices: [0, 1, 3],
  },
  {
    id: "t3",
    type: "truefalse",
    prompt: "实验报告应如实记录操作步骤与现象。",
    points: 11,
    correct: true,
  },
  {
    id: "t4",
    type: "fill",
    prompt: "在实验记录中，对观察到的现象应进行____与归纳。",
    points: 11,
    acceptable: ["描述", "记录"],
  },
  {
    id: "t5",
    type: "match",
    prompt: "将左侧概念与右侧说明正确连线（先点左侧，再点右侧）。",
    points: 11,
    leftItems: ["输入", "输出", "模型"],
    rightItems: ["摄像头采集的数据", "屏幕或扬声器呈现的结果", "对数据进行推理的模块"],
    correctRightIndices: [0, 1, 2],
  },
  {
    id: "t6",
    type: "sort",
    prompt: "请拖拽下列步骤，按实验流程先后顺序排列（从先到后）。",
    points: 11,
    items: ["分析结果", "采集数据", "提出假设", "设计步骤"],
    correctOrder: [2, 1, 3, 0],
  },
  {
    id: "t7",
    type: "text_figure_choice",
    prompt: "下图表示某分类模型的一次推理输出，请选择最合理的解释。",
    points: 11,
    stemImage: quizSvgPlaceholder("示意图", "#2563eb"),
    options: [
      "输出为类别标签，置信度较高",
      "仅输出原始像素，未做分类",
      "输出为音频波形，与分类无关",
    ],
    correctIndex: 0,
  },
  {
    id: "t8",
    type: "image_stem",
    prompt: "请看上方场景图，选择最恰当的描述。",
    points: 11,
    stemImage: quizSvgPlaceholder("场景", "#4f46e5"),
    options: ["这是输入设备", "这是输出设备", "这是存储设备"],
    correctIndex: 0,
  },
  {
    id: "t9",
    type: "image_pick",
    prompt: "题目文字：下列哪张图表示「手势方向」被正确识别？",
    choiceHint: "请选择",
    points: 12,
    optionImages: [
      quizSvgPlaceholder("A图", "#0ea5e9"),
      quizSvgPlaceholder("B图", "#8b5cf6"),
      quizSvgPlaceholder("C图", "#f43f5e"),
    ],
    labels: ["A", "B", "C"],
    correctIndex: 0,
  },
];

const GESTURE_SNAKE_QUIZ: QuizQuestion[] = [
  {
    id: "gs1",
    type: "single",
    prompt: "手势贪吃蛇实验中，用于捕捉手部动作的常见输入设备是？",
    points: 20,
    options: ["打印机", "摄像头", "音箱", "有线鼠标"],
    correctIndex: 1,
  },
  {
    id: "gs2",
    type: "multi",
    prompt: "下列哪些属于人机交互中的「输入」环节？（多选）",
    points: 20,
    options: ["摄像头采集图像", "屏幕显示分数", "手势方向识别", "扬声器播放音乐"],
    correctIndices: [0, 2],
  },
  {
    id: "gs3",
    type: "truefalse",
    prompt: "食指指尖相对手腕的方向，可以用来近似表示上下左右控制意图。",
    points: 20,
    correct: true,
  },
  {
    id: "gs4",
    type: "fill",
    prompt: "当蛇撞到墙壁或自身时，游戏一般会____。",
    points: 20,
    acceptable: ["结束", "停止", "失败", "游戏结束"],
  },
  {
    id: "gs5",
    type: "short",
    prompt: "简述「慢速移动」对用手势控制贪吃蛇的帮助。",
    points: 20,
    keywords: ["反应", "对准", "稳定", "识别", "操作", "时间", "容易"],
  },
];

const QUIZ_BY_EXPERIMENT: Record<string, QuizQuestion[]> = {
  "gesture-snake": GESTURE_SNAKE_QUIZ,
  "graphical-programming": GENERIC_QUIZ,
  "rps-pk": GENERIC_QUIZ,
  "object-recognition": GENERIC_QUIZ,
  "plate-recognition": GENERIC_QUIZ,
  "face-compare": GENERIC_QUIZ,
  "image-segmentation": GENERIC_QUIZ,
  "face-tracking": GENERIC_QUIZ,
};

export function getQuizForExperiment(experimentId: string): QuizQuestion[] {
  return QUIZ_BY_EXPERIMENT[experimentId] ?? GENERIC_QUIZ;
}
