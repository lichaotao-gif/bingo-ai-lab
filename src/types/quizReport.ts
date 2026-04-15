export interface QuizAnswerDetail {
  questionId: string;
  prompt: string;
  typeLabel: string;
  userAnswer: string;
  correctAnswer: string;
  /** 题解析（来自题库；旧存档可能为空） */
  explanation?: string;
  isCorrect: boolean;
  earnedPoints: number;
  maxPoints: number;
  /** 选择题类：题干配图（部分题型） */
  stemImageUrl?: string;
  /** 文字选项行，如「A. xxx」；图选项题可能为空，见 imageOptionUrls */
  optionLines?: string[];
  /** 图选项（image_pick）：选项图 URL */
  imageOptionUrls?: string[];
  /** 与 imageOptionUrls 对应的选项字母，如 A、B */
  imageOptionLabels?: string[];
  /**
   * 选择题类：参考答案在选项中的下标（0-based），与 optionLines / imageOptionUrls 对齐。
   * 旧存档可能无此字段。
   */
  correctOptionIndices?: number[];
  /**
   * 用户作答对应的选项下标；未作答或主观题通常为空。
   * 与 correctOptionIndices 对照可标出「错选」与「正确选项」。
   */
  userOptionIndices?: number[];
}

export interface QuizReport {
  id: string;
  experimentId: string;
  experimentTitle: string;
  gradeLabel: string;
  studentName: string;
  submittedAt: string;
  totalScore: number;
  maxScore: number;
  aiComment: string;
  /** 学到的知识点，按序号逐条展示 */
  knowledgeLearned: string[];
  details: QuizAnswerDetail[];
}

/** 由得分折算正确率（0～100），用于界面去分数化展示 */
export function quizCorrectRatePercent(
  totalScore: number,
  maxScore: number,
): number {
  if (maxScore <= 0) {
    return 0;
  }
  return Math.round((totalScore / maxScore) * 100);
}

/** 兼容本地旧数据：曾为单行字符串 */
export function normalizeKnowledgeLearned(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0,
    );
  }
  if (typeof raw === "string" && raw.trim()) {
    return [raw.trim()];
  }
  return [];
}
