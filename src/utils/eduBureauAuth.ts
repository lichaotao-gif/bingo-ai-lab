/** 教育局统计专属登录会话（演示：sessionStorage） */

const KEY = "bingo-lab-edu-bureau-session";

export interface EduBureauSession {
  phone: string;
  /** 展示用称呼 */
  displayName: string;
  loggedInAt: string;
}

export function getEduBureauSession(): EduBureauSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) {
      return null;
    }
    const o = JSON.parse(raw) as EduBureauSession;
    if (!o?.phone || !o?.displayName) {
      return null;
    }
    return o;
  } catch {
    return null;
  }
}

export function setEduBureauSession(session: EduBureauSession): void {
  sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function clearEduBureauSession(): void {
  sessionStorage.removeItem(KEY);
}

const PHONE_RE = /^1[3-9]\d{9}$/;

/** 演示环境默认账号（登录窗预填） */
export const EDU_BUREAU_DEMO_PHONE = "13800138000";
export const EDU_BUREAU_DEMO_PASSWORD = "EduBureau2026";
export const EDU_BUREAU_DEMO_CODE = "888888";

/** 演示：合法大陆手机号 + 演示密码 */
export function validatePasswordLogin(phone: string, password: string): boolean {
  if (!PHONE_RE.test(phone.trim())) {
    return false;
  }
  return password === EDU_BUREAU_DEMO_PASSWORD;
}

/** 演示：合法手机号 + 演示验证码 */
export function validateCodeLogin(phone: string, code: string): boolean {
  if (!PHONE_RE.test(phone.trim())) {
    return false;
  }
  return code.trim() === EDU_BUREAU_DEMO_CODE;
}

export function maskPhone(phone: string): string {
  const p = phone.trim();
  if (p.length < 11) {
    return p;
  }
  return `${p.slice(0, 3)}****${p.slice(7)}`;
}
