/**
 * 实验包 / 实验列表封面：人工智能主题矢量图，放在 public/covers，离线可用、不依赖外网图片站。
 */
const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");

export const AI_COVER_IMAGES = Array.from({ length: 10 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return `${base}covers/ai-${n}.svg`;
}) as readonly string[];

export function shuffleCovers<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]!];
  }
  return arr;
}
