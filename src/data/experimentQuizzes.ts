/**
 * 各实验配套测验（演示数据）。未单独配置的实验使用通用题库。
 */

export type QuizQuestionType =
  | "single"
  | "multi"
  | "truefalse"
  | "fill"
  | "short";

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
  /** 正确选项下标 */
  correctIndices: number[];
}

export interface TrueFalseQuizQuestion extends QuizQuestionBase {
  type: "truefalse";
  correct: boolean;
}

export interface FillQuizQuestion extends QuizQuestionBase {
  type: "fill";
  /** 可接受的答案（忽略大小写与首尾空格） */
  acceptable: string[];
}

export interface ShortQuizQuestion extends QuizQuestionBase {
  type: "short";
  /** 演示评分：答案包含任一关键词即满分 */
  keywords: string[];
}

export type QuizQuestion =
  | SingleQuizQuestion
  | MultiQuizQuestion
  | TrueFalseQuizQuestion
  | FillQuizQuestion
  | ShortQuizQuestion;

const GENERIC_QUIZ: QuizQuestion[] = [
  {
    id: "g1",
    type: "single",
    prompt: "本实验中，AI 能力主要体现在哪一类任务？",
    points: 20,
    options: [
      "仅数据存储",
      "感知、理解与简单决策",
      "替代教师全部工作",
      "与实验无关",
    ],
    correctIndex: 1,
  },
  {
    id: "g2",
    type: "multi",
    prompt: "下列哪些属于负责任地使用 AI 的做法？（多选）",
    points: 20,
    options: [
      "核对关键结论",
      "保护个人隐私数据",
      "盲目相信模型输出",
      "在教师指导下完成实验",
    ],
    correctIndices: [0, 1, 3],
  },
  {
    id: "g3",
    type: "truefalse",
    prompt: "实验报告应如实记录操作步骤与现象。",
    points: 20,
    correct: true,
  },
  {
    id: "g4",
    type: "fill",
    prompt: "在实验记录中，对观察到的现象应进行____与归纳。",
    points: 20,
    acceptable: ["描述", "记录"],
  },
  {
    id: "g5",
    type: "short",
    prompt: "请用一句话说明你在本实验中最想巩固的一个知识点。",
    points: 20,
    keywords: ["理解", "掌握", "学会", "认识", "了解", "实验", "知识", "原理", "应用"],
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

/** 实验 id → 测验题；未列出的实验使用通用题 */
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
