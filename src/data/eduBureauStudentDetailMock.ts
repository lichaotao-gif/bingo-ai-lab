import type { BureauStudent } from "@/data/eduBureauMock";
import { getExperimentsForGrade, gradeLabel } from "@/data/gradeExperiments";
import { LAB_PACKAGE_OPTIONS } from "@/data/labPackages";

function hash(seed: string): number {
  let x = 0;
  for (let i = 0; i < seed.length; i++) {
    x = (x * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(x);
}

export interface BureauStudentExperimentStat {
  id: string;
  title: string;
  experimentPct: number;
  quizPct: number;
  quizSubmitted: boolean;
  resultSubmitted: boolean;
}

export interface BureauStudentQuizReportBrief {
  experimentId: string;
  experimentTitle: string;
  gradeLabel: string;
  totalScore: number;
  maxScore: number;
  submittedAt: string;
  aiComment: string;
}

export interface BureauStudentSubmitBrief {
  experimentId: string;
  experimentTitle: string;
  gradeLabel: string;
  submittedAt: string;
  text: string;
  imageCount: number;
  attachmentName: string | null;
}

/** 单个实验包及其下属实验统计、测验报告、实验提交（按包展开查看） */
export interface BureauStudentPackageBundle {
  id: string;
  title: string;
  cover: string;
  gradeLabel: string;
  gradeRouteIndex: number;
  experimentStats: BureauStudentExperimentStat[];
  quizReports: BureauStudentQuizReportBrief[];
  submissions: BureauStudentSubmitBrief[];
}

export interface BureauStudentDetail {
  packageBundles: BureauStudentPackageBundle[];
}

/**
 * 按关联实验包分组生成演示数据；每个包内实验列表对应该包年级（gradeRouteIndex）。
 */
export function buildBureauStudentDetail(student: BureauStudent): BureauStudentDetail {
  const seed = student.id;
  const h0 = hash(seed);

  const pkgCount = 2 + (h0 % 2);
  const start = h0 % LAB_PACKAGE_OPTIONS.length;

  const packageBundles: BureauStudentPackageBundle[] = [];

  for (let i = 0; i < pkgCount; i++) {
    const p = LAB_PACKAGE_OPTIONS[(start + i) % LAB_PACKAGE_OPTIONS.length]!;
    const gradeLabelStr = p.detailTitle ?? gradeLabel(p.gradeRouteIndex);
    const experiments = getExperimentsForGrade(p.gradeRouteIndex);

    const experimentStats: BureauStudentExperimentStat[] = experiments.map(
      (ex) => {
        const s = hash(seed + p.id + ex.id);
        const expPct = 42 + (s % 56);
        const quizPct = 38 + (hash(seed + p.id + ex.id + "q") % 58);
        return {
          id: ex.id,
          title: ex.title,
          experimentPct: Math.min(100, expPct),
          quizPct: Math.min(100, quizPct),
          quizSubmitted: s % 6 !== 0,
          resultSubmitted: s % 5 !== 0,
        };
      },
    );

    const quizReports: BureauStudentQuizReportBrief[] = experimentStats
      .filter((x) => x.quizSubmitted)
      .map((x) => {
        const s = hash(seed + p.id + x.id + "quiz");
        const max = 100;
        const total = Math.min(
          max,
          Math.round((x.quizPct / 100) * max * (0.85 + (s % 15) / 100)),
        );
        return {
          experimentId: x.id,
          experimentTitle: x.title,
          gradeLabel: gradeLabelStr,
          totalScore: total,
          maxScore: max,
          submittedAt: new Date(
            Date.now() - (s % 14) * 86400000 - (s % 24) * 3600000,
          ).toISOString(),
          aiComment:
            s % 2 === 0
              ? "基础概念掌握较好，建议在真实场景中多练习推理步骤。"
              : "完成度良好，可尝试拓展题以巩固迁移能力。",
        };
      });

    const submissions: BureauStudentSubmitBrief[] = experimentStats
      .filter((x) => x.resultSubmitted)
      .map((x) => {
        const s = hash(seed + p.id + x.id + "sub");
        return {
          experimentId: x.id,
          experimentTitle: x.title,
          gradeLabel: gradeLabelStr,
          submittedAt: new Date(
            Date.now() - (s % 20) * 86400000 - (s % 20) * 3600000,
          ).toISOString(),
          text:
            s % 3 === 0
              ? "已完成本实验操作与记录，详见截图与附件说明。"
              : "实验过程记录完整，对模型输出结果进行了简要分析。",
          imageCount: 1 + (s % 3),
          attachmentName:
            s % 4 === 0 ? null : `实验记录-${x.id.slice(-4)}.docx`,
        };
      });

    packageBundles.push({
      id: p.id,
      title: p.title,
      cover: p.cover,
      gradeLabel: gradeLabelStr,
      gradeRouteIndex: p.gradeRouteIndex,
      experimentStats,
      quizReports,
      submissions,
    });
  }

  return { packageBundles };
}

export function formatDetailTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
