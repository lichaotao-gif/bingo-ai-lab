import type { QuizReport } from "@/types/quizReport";

const KEY = "bingo-lab-quiz-reports";

export function loadQuizReports(): QuizReport[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as QuizReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveQuizReport(report: QuizReport): void {
  const list = loadQuizReports();
  list.unshift(report);
  localStorage.setItem(KEY, JSON.stringify(list));
}

/** 当前年级下列表中，该实验是否已有测验提交记录 */
export function hasQuizReportForExperimentAndGrade(
  experimentId: string,
  gradeLabel: string,
  studentName?: string,
): boolean {
  return loadQuizReports().some(
    (r) =>
      r.experimentId === experimentId &&
      r.gradeLabel === gradeLabel &&
      (studentName == null || r.studentName === studentName),
  );
}

/** 同一实验、同一年级下最新一条测验报告（按提交时间） */
export function getLatestQuizReportForExperimentAndGrade(
  experimentId: string,
  gradeLabel: string,
  studentName?: string,
): QuizReport | undefined {
  const list = loadQuizReports().filter(
    (r) =>
      r.experimentId === experimentId &&
      r.gradeLabel === gradeLabel &&
      (studentName == null || r.studentName === studentName),
  );
  if (list.length === 0) {
    return undefined;
  }
  list.sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
  return list[0];
}
