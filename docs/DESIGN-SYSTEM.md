# 缤果实验平台 · Web 设计规范

本文档依据 Figma 文件《数字教材 one》中 Section「人工智能实训平台」下的 **「我的AI实验室」** 画板（`node-id=25417-6271`）提炼，供 Web 端（React / Next.js + Tailwind 或 CSS 变量）长期迭代使用。

**Figma 源**：`https://www.figma.com/design/tbsFN4kxLMRKdTFUsI7ToO/`（文件 key：`tbsFN4kxLMRKdTFUsI7ToO`）

**维护约定**：视觉变更以 Figma 为准；每次大改版后更新本页与根目录 `design-tokens.css`，并在 PR 中注明对应画板 `node-id`。

---

## 1. 设计原则

| 原则 | 说明 |
|------|------|
| 清晰层级 | 页面背景 → 白底内容区 → 卡片/侧栏；主行动用品牌蓝，状态用绿色标签区分角色。 |
| 教育场景 | 中文主字体使用系统无衬线栈，保证 macOS / Windows 可读性；数据与英文可用 Roboto 补充。 |
| 密度适中 | 主内容区宽度围绕 **1280px** 画板；卡片栅格三列为主，间距统一用 4 的倍数。 |

---

## 2. 色彩

### 2.1 品牌与主色

| 语义 | 色值 | 用途 |
|------|------|------|
| Primary | `#2F80ED` | 链接、强调文案、图标主色、描边型按钮文字 |
| Primary / 浅底 | `rgba(47, 128, 237, 0.15)` | 筛选标签、顶部「群组成员」「更多」「添加实验」等浅底按钮 |
| 渐变（侧栏选中） | `#00D2FF` → `#3A7BD5`（约 112deg） | 侧栏当前项「我的AI实验」背景 |
| 渐变（Logo 区） | `#209CFF` → `#68E0CF`（约 -39deg） | 顶部方形 Logo 背景，勿随意用于大块面 |

### 2.2 背景与表面

| 语义 | 色值 | 用途 |
|------|------|------|
| Page | `#F1F7FF` | 整页铺底 |
| Surface | `#FFFFFF` | 顶栏、侧栏、主内容白底、弹层卡片 |
| Card inner | `#F5FAFF` | 实验卡片内层（缩略图+标题区域） |

### 2.3 文本

| 语义 | 色值 | 用途 |
|------|------|------|
| Primary | `#000000` | 标题、正文主色 |
| Secondary | `#4F4F4F` | 次要说明、侧栏「我的」、兑换/设置 |
| Tertiary | `#333333` | 部分导航项（如 AI 实验室） |
| On primary | `#FFFFFF` | 蓝底/绿底上的字 |

### 2.4 边框与分割

| 语义 | 色值 | 用途 |
|------|------|------|
| Border subtle | `rgba(0, 0, 0, 0.08)` | 大卡片外框 |
| Border UI | `#E5E7EB` | 小控件描边（如 Logo 容器） |

### 2.5 状态

| 语义 | 色值 | 用途 |
|------|------|------|
| Success | `#27AE60` | 「管理员」等角色胶囊标签背景 |

> 图表、统计页若未单独抽稿，沿用 Primary / 中性灰阶，避免再引入未定义荧光色。

---

## 3. 字体与排版

### 3.1 字体栈

```text
中文：PingFang SC, "Microsoft YaHei", "Noto Sans SC", sans-serif
西文 / 数字辅助：Roboto, system-ui, sans-serif
```

实现时可用 `font-sans` 并在 `globals.css` 中设好 `font-family`，避免在每个组件写死 `font-['PingFang_SC:xxx']`。

### 3.2 字号与字重（由稿反向归纳）

| Token | 尺寸 | 字重 | 典型用途 |
|-------|------|------|----------|
| `text-xs` | 10px | Medium | FAB 上短标签（如「实验组」） |
| `text-caption` | 12px | Regular | 角色标签字、兑换/设置 |
| `text-body` | 14px | Regular | 正文、按钮、侧栏导航、浅底按钮内文字 |
| `text-body-strong` | 14px | Medium | — |
| `text-nav-brand` | ~16px | Semibold | 顶栏「缤果实验平台」 |
| `text-card-title` | 17px | Medium | 实验卡片标题 |
| `text-section-title` | 20px | Regular | 「三年级二班」「我的AI实验室」区块标题 |

### 3.3 字距

稿中多次出现 **0.65px** 级跟踪；全局可设 `letter-spacing: 0.04em` 近似，不必逐像素拷贝。

---

## 4. 圆角

| Token | 值 | 用途 |
|-------|-----|------|
| `radius-sm` | 5px | 小按钮、筛选条 |
| `radius-md` | 8px | Logo 外框、部分控件 |
| `radius-lg` | 9px ~ 10px | 弹层菜单、缩略图 |
| `radius-xl` | 15px ~ 16px | 实验卡片容器 |
| `radius-pill` | 31px | 角色胶囊标签 |
| `radius-panel` | 10px | 侧栏与主内容大圆角容器 |

---

## 5. 阴影与 elevation

| 名称 | 值 | 用途 |
|------|-----|------|
| `shadow-card` | `0 4px 4px rgba(0,0,0,0.04)` | 白色大卡片（班级实验列表外框） |
| `shadow-popover` | `0 4px 4px rgba(0,0,0,0.25)` | 「加入实验组 / 创建实验组」浮层 |

---

## 6. 布局与间距

| 项 | 数值 | 说明 |
|----|------|------|
| 设计基准宽度 | 1280px | 整页 Frame 宽度，开发可用 `max-w-[1280px] mx-auto` 或全宽背景 + 内层限宽 |
| 顶栏高度 | 70px | 含 Logo + 标题 + 右侧入口 |
| 侧栏宽度 | 182px | 白底圆角列 |
| 主内容左偏移 | 约 200px（自画板左边） | 实现时用 flex/grid，不必绝对像素对齐设计坐标 |
| 卡片内边距 | 14px | 单张实验卡内容区 |
| 栅格间隙 | 12px | 多列卡片之间 |

间距优先使用 **4 的倍数**（4 / 8 / 12 / 14 / 16 / 21 / 30），与稿中结构一致即可。

---

## 7. 组件命名（建议）

与实现层对齐的命名，便于跨页面复用：

| 组件 | 职责 |
|------|------|
| `AppHeader` | 顶栏：Logo、产品名、兑换、设置、用户头像 |
| `AppSidebar` | 用户信息、主导航、当前态渐变项 |
| `LabCard` | 单套实验：封面 169px 高、标题 17px Medium |
| `SectionHeader` | 班级/实验室区块左侧图标 + 标题 + 右侧操作 |
| `FilterChip` | 浅蓝底 + Primary 字（群组成员、更多、添加实验） |
| `RoleBadge` | 绿底白字小胶囊 |
| `FabGroup` | 右下角实验组入口 |

---

## 8. 与代码的衔接

1. **单一事实来源**：颜色、圆角、阴影以根目录 **`design-tokens.css`** 中的 CSS 变量为准。  
2. **Tailwind**：`tailwind.config.js` 已映射常用 token（如 `bg-page`、`text-fg-muted`、`border-border-subtle`）；禁止在业务组件中散落未约定的十六进制。  
3. **工程栈**：当前为 **Vue 3 + Vite**，入口样式为 `src/style.css`（已 `@import` 设计令牌）。  
4. **Figma MCP**：新页面实现前对目标 Frame 执行 `get_design_context`，再映射到已有 token，缺失时再增补 token 与本页。

---

## 9. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-04-10 | 初版：基于「我的AI实验室」25417:6271 抽取 |
