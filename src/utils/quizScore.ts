import type { QuizQuestion } from "@/data/experimentQuizzes";
import type { QuizAnswerDetail } from "@/types/quizReport";

function typeLabel(t: QuizQuestion["type"]): string {
  const m: Record<QuizQuestion["type"], string> = {
    single: "单选题",
    multi: "多选题",
    truefalse: "判断题",
    fill: "填空题",
    short: "简答题",
    match: "连线题",
    sort: "拖拽排序",
    image_pick: "选择题",
    image_stem: "选择题",
    text_figure_choice: "选择题",
  };
  return m[t];
}

function fmtUser(q: QuizQuestion, raw: unknown): string {
  if (raw === undefined || raw === null) {
    return "（未作答）";
  }
  if (q.type === "single" || q.type === "text_figure_choice") {
    return typeof raw === "number" ? q.options[raw] ?? String(raw) : String(raw);
  }
  if (q.type === "image_pick") {
    if (typeof raw !== "number") {
      return String(raw);
    }
    const lab = q.labels?.[raw] ?? String.fromCharCode(65 + raw);
    return `选项 ${lab}（图）`;
  }
  if (q.type === "image_stem") {
    return typeof raw === "number" ? q.options[raw] ?? String(raw) : String(raw);
  }
  if (q.type === "multi") {
    if (!Array.isArray(raw) || raw.length === 0) {
      return "（未选择）";
    }
    return (raw as number[])
      .slice()
      .sort((a, b) => a - b)
      .map((i) => q.options[i])
      .filter(Boolean)
      .join("、");
  }
  if (q.type === "truefalse") {
    if (typeof raw !== "boolean") {
      return String(raw);
    }
    return raw ? "是" : "否";
  }
  if (q.type === "fill" || q.type === "short") {
    return String(raw).trim() || "（未填写）";
  }
  if (q.type === "match") {
    if (!Array.isArray(raw)) {
      return "（未作答）";
    }
    const arr = raw as number[];
    return q.leftItems
      .map((l, i) => {
        const ri = arr[i];
        if (typeof ri !== "number" || ri < 0) {
          return `${l}→?`;
        }
        return `${l}→${q.rightItems[ri] ?? "?"}`;
      })
      .join("；");
  }
  if (q.type === "sort") {
    if (!Array.isArray(raw)) {
      return "（未作答）";
    }
    const ord = raw as number[];
    return ord.map((idx) => q.items[idx] ?? "?").join(" → ");
  }
  return String(raw);
}

function fmtCorrect(q: QuizQuestion): string {
  if (q.type === "single" || q.type === "text_figure_choice") {
    return q.options[q.correctIndex] ?? "";
  }
  if (q.type === "image_pick") {
    const lab =
      q.labels?.[q.correctIndex] ??
      String.fromCharCode(65 + q.correctIndex);
    return `选项 ${lab}（图）`;
  }
  if (q.type === "image_stem") {
    return q.options[q.correctIndex] ?? "";
  }
  if (q.type === "multi") {
    return q.correctIndices
      .slice()
      .sort((a, b) => a - b)
      .map((i) => q.options[i])
      .join("、");
  }
  if (q.type === "truefalse") {
    return q.correct ? "是" : "否";
  }
  if (q.type === "fill") {
    return q.acceptable.join(" 或 ");
  }
  if (q.type === "short") {
    return `需包含要点词：${q.keywords.slice(0, 4).join("、")}等`;
  }
  if (q.type === "match") {
    return q.leftItems
      .map(
        (l, i) =>
          `${l}→${q.rightItems[q.correctRightIndices[i]] ?? "?"}`,
      )
      .join("；");
  }
  if (q.type === "sort") {
    return q.correctOrder.map((idx) => q.items[idx]).join(" → ");
  }
  return "";
}

function isCorrect(
  q: QuizQuestion,
  raw: unknown,
): { ok: boolean; earned: number } {
  if (q.type === "single" || q.type === "text_figure_choice") {
    const ok = typeof raw === "number" && raw === q.correctIndex;
    return { ok, earned: ok ? q.points : 0 };
  }
  if (q.type === "image_pick" || q.type === "image_stem") {
    const ok = typeof raw === "number" && raw === q.correctIndex;
    return { ok, earned: ok ? q.points : 0 };
  }
  if (q.type === "multi") {
    const sel = Array.isArray(raw)
      ? [...(raw as number[])].sort((a, b) => a - b)
      : [];
    const exp = [...q.correctIndices].sort((a, b) => a - b);
    const ok =
      sel.length === exp.length && sel.every((v, i) => v === exp[i]);
    return { ok, earned: ok ? q.points : 0 };
  }
  if (q.type === "truefalse") {
    const ok = typeof raw === "boolean" && raw === q.correct;
    return { ok, earned: ok ? q.points : 0 };
  }
  if (q.type === "fill") {
    const s = String(raw ?? "")
      .trim()
      .toLowerCase();
    const ok = q.acceptable.some((a) => a.toLowerCase() === s);
    return { ok, earned: ok ? q.points : 0 };
  }
  if (q.type === "short") {
    const s = String(raw ?? "").trim();
    if (!s) {
      return { ok: false, earned: 0 };
    }
    const ok = q.keywords.some((k) => s.includes(k));
    return { ok, earned: ok ? q.points : 0 };
  }
  if (q.type === "match") {
    if (!Array.isArray(raw)) {
      return { ok: false, earned: 0 };
    }
    const sel = raw as number[];
    if (sel.length !== q.leftItems.length) {
      return { ok: false, earned: 0 };
    }
    const ok = q.correctRightIndices.every((ci, i) => sel[i] === ci);
    return { ok, earned: ok ? q.points : 0 };
  }
  if (q.type === "sort") {
    if (!Array.isArray(raw)) {
      return { ok: false, earned: 0 };
    }
    const sel = raw as number[];
    if (sel.length !== q.correctOrder.length) {
      return { ok: false, earned: 0 };
    }
    const ok = sel.every((v, i) => v === q.correctOrder[i]);
    return { ok, earned: ok ? q.points : 0 };
  }
  return { ok: false, earned: 0 };
}

export function gradeQuiz(
  questions: QuizQuestion[],
  answers: Record<string, unknown>,
): { details: QuizAnswerDetail[]; totalScore: number; maxScore: number } {
  let totalScore = 0;
  let maxScore = 0;
  const details: QuizAnswerDetail[] = [];

  for (const q of questions) {
    maxScore += q.points;
    const raw = answers[q.id];
    const { ok, earned } = isCorrect(q, raw);
    totalScore += earned;
    const explanation =
      "explanation" in q && typeof q.explanation === "string"
        ? q.explanation.trim() || undefined
        : undefined;
    details.push({
      questionId: q.id,
      prompt: q.prompt,
      typeLabel: typeLabel(q.type),
      userAnswer: fmtUser(q, raw),
      correctAnswer: fmtCorrect(q),
      explanation,
      isCorrect: ok,
      earnedPoints: earned,
      maxPoints: q.points,
    });
  }

  return { details, totalScore, maxScore };
}

export function buildAiComment(
  experimentTitle: string,
  total: number,
  max: number,
): { aiComment: string; knowledgeLearned: string[] } {
  const pct = max > 0 ? Math.round((total / max) * 100) : 0;
  let aiComment: string;
  if (pct >= 90) {
    aiComment = `你在「${experimentTitle}」配套测验中正确率达 ${pct}%，表现优秀，概念清晰、要点把握准确。建议继续保持实验记录习惯，并尝试在拓展题中联系生活应用。`;
  } else if (pct >= 70) {
    aiComment = `你在「${experimentTitle}」测验正确率为 ${pct}%，达到良好水平，整体理解到位。可针对错题回顾实验步骤与相关概念，巩固薄弱环节。`;
  } else if (pct >= 50) {
    aiComment = `你在「${experimentTitle}」测验正确率为 ${pct}%，已掌握部分要点。建议重温实验说明与课堂小结，多做同类题型训练。`;
  } else {
    aiComment = `本次「${experimentTitle}」测验正确率偏低（${pct}%），不必气馁。请结合实验演示与教材，从基础概念逐项梳理，可向教师提问澄清疑点。`;
  }

  const knowledgeLearned =
    pct >= 70
      ? [
          "已较好掌握实验目标与基本操作流程",
          "能区分常见概念（如输入/输出、观察与结论）",
          "建议在下一实验中主动记录异常现象并尝试解释",
        ]
      : [
          "建议重点巩固实验核心概念与关键术语",
          "完成教师指定的复习题",
          "在实验报告中用简短语句复述「观察—推理—结论」链条",
        ];

  return { aiComment, knowledgeLearned };
}
