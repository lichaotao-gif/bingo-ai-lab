export interface QuizAnswerDetail {
  questionId: string;
  prompt: string;
  typeLabel: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  earnedPoints: number;
  maxPoints: number;
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
