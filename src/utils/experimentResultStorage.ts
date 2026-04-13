import type { ExperimentResultSubmit } from "@/types/experimentResultSubmit";
import { getDemoGestureSnakeResultIfApplicable } from "@/data/demoGestureSnakeExperimentResult";

const KEY = "bingo-lab-experiment-results";

export function loadExperimentResults(): ExperimentResultSubmit[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ExperimentResultSubmit[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 同一学生、同年级、同一实验只保留最新一次提交 */
export function saveExperimentResultSubmit(
  report: ExperimentResultSubmit,
): void {
  const rest = loadExperimentResults().filter(
    (x) =>
      !(
        x.experimentId === report.experimentId &&
        x.gradeLabel === report.gradeLabel &&
        x.studentName === report.studentName
      ),
  );
  rest.unshift(report);
  localStorage.setItem(KEY, JSON.stringify(rest));
}

export function findExperimentResultSubmit(
  experimentId: string,
  gradeLabel: string,
  studentName: string,
): ExperimentResultSubmit | undefined {
  const stored = loadExperimentResults().find(
    (r) =>
      r.experimentId === experimentId &&
      r.gradeLabel === gradeLabel &&
      r.studentName === studentName,
  );
  if (stored) {
    return stored;
  }
  return getDemoGestureSnakeResultIfApplicable(
    experimentId,
    gradeLabel,
    studentName,
  );
}
