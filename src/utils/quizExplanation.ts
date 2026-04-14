import { getQuizForExperiment } from "@/data/experimentQuizzes";
import type { QuizAnswerDetail } from "@/types/quizReport";

/** 题解析：优先存档字段，否则从题库定义补全（旧报告也可显示） */
export function resolveQuizExplanation(
  experimentId: string,
  d: QuizAnswerDetail,
): string {
  if (d.explanation?.trim()) {
    return d.explanation.trim();
  }
  const qs = getQuizForExperiment(experimentId);
  const q = qs.find((x) => x.id === d.questionId);
  return q?.explanation?.trim() ?? "";
}
