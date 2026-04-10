import { computed } from "vue";

const STORAGE_KEY = "bingo-lab-cartoon-avatar-seed";

function getOrCreateSeed(): string {
  try {
    let s = sessionStorage.getItem(STORAGE_KEY);
    if (!s) {
      s = Math.random().toString(36).slice(2, 14);
      sessionStorage.setItem(STORAGE_KEY, s);
    }
    return s;
  } catch {
    return "bingo-default";
  }
}

/**
 * 顶栏与侧栏共用的随机卡通头像（Dicebear，会话内固定）。
 */
export function useCartoonAvatar() {
  const seed = getOrCreateSeed();
  const avatarUrl = computed(
    () =>
      `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
  );
  return { avatarUrl, seed };
}
