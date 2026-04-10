/**
 * 实验包封面：人工智能 / 科技 / 机器人等主题（Unsplash，需联网）。
 * 每次进入列表可 shuffle 后分配，实现随机感。
 */
export const AI_COVER_IMAGES = [
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=720&q=80",
  "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=720&q=80",
  "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=720&q=80",
  "https://images.unsplash.com/photo-1531746797555-5f810ec60b7e?auto=format&fit=crop&w=720&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=720&q=80",
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=720&q=80",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=720&q=80",
  "https://images.unsplash.com/photo-1507146153580-69f1c024656b?auto=format&fit=crop&w=720&q=80",
  "https://images.unsplash.com/photo-1675375505649-249087d6148e?auto=format&fit=crop&w=720&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=720&q=80",
] as const;

export function shuffleCovers<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
