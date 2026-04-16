import { AI_COVER_IMAGES } from "@/constants/aiCoverImages";

/** 可添加到班级的实验包（演示数据） */
export interface LabPackageOption {
  id: string;
  title: string;
  cover: string;
  /**
   * 与 AI 实验室大厅 `/ai-lab/grade/:gradeId` 一致：0～5 对应一年级（上）～六年级（上）。
   * 用于进入同一路由下的实验列表（演示数据各年级条目结构相同）。
   */
  gradeRouteIndex: number;
  /**
   * 详情页主标题：当实验包学段与大厅六个年级标签不完全一致时（如初中），用于覆盖页眉中的年级名。
   */
  detailTitle?: string;
}

export const LAB_PACKAGE_OPTIONS: LabPackageOption[] = [
  {
    id: "pkg-g8-up",
    title: "八年级（上）",
    cover: AI_COVER_IMAGES[8]!,
    gradeRouteIndex: 5,
    detailTitle: "八年级（上）",
  },
  {
    id: "pkg-demo-g2",
    title: "中小学人工智能实验（二年级上）",
    cover: AI_COVER_IMAGES[1]!,
    gradeRouteIndex: 1,
  },
  {
    id: "pkg-g3-up",
    title: "三年级（上）",
    cover: AI_COVER_IMAGES[3]!,
    gradeRouteIndex: 2,
  },
  {
    id: "pkg-g5-up",
    title: "五年级（上）",
    cover: AI_COVER_IMAGES[5]!,
    gradeRouteIndex: 4,
  },
];

/** 向实验组添加实验包时可选的应用时间（演示，可对接接口）。跳过添加视为「不限」。 */
export type PackageApplicationTimeId =
  | "unlimited"
  | "2025-s1-sep"
  | "2026-s2-feb";

export type PackageApplicationTimeSelectId = PackageApplicationTimeId;

export interface PackageApplicationTimeOption {
  id: PackageApplicationTimeSelectId;
  label: string;
}

export const PACKAGE_APPLICATION_TIME_OPTIONS: PackageApplicationTimeOption[] =
  [
    { id: "unlimited", label: "不限" },
    { id: "2025-s1-sep", label: "2025年上学期9月" },
    { id: "2026-s2-feb", label: "2026年下学期2月" },
  ];

export function packageApplicationTimeLabel(
  id: PackageApplicationTimeId,
): string {
  return (
    PACKAGE_APPLICATION_TIME_OPTIONS.find((o) => o.id === id)?.label ?? "不限"
  );
}
