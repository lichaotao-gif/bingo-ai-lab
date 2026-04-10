/** 学生提交的实验结果（文字、截图、附件元信息），用于统计页展示 */
export interface ExperimentResultSubmit {
  id: string;
  experimentId: string;
  /** 列表页年级/包标题，与测验报告 gradeLabel 对齐 */
  gradeLabel: string;
  studentName: string;
  submittedAt: string;
  text: string;
  images: { name: string; dataUrl: string }[];
  /** 附件仅存文件名与大小（演示），不持久化二进制 */
  attachment: { name: string; size: number } | null;
}
