# 缤果AI实验室（Web）

Vue 3 + Vite + TypeScript + Tailwind CSS，设计令牌见根目录 `design-tokens.css` 与 `docs/DESIGN-SYSTEM.md`。

## 命令

```bash
npm install
npm run dev      # 开发
npm run build    # 构建
npm run preview  # 预览构建结果
```

## 路由（可点击导航）

| 路径 | 说明 |
|------|------|
| `/` | 我的AI实验室 |
| `/ai-lab` | AI实验室（年级实验包大厅） |
| `/ai-lab/grade/:gradeId` | 某年级实验列表（`gradeId` 为 `0`～`5`） |
| `/stats` | 统计 |
| `/redeem` | 兑换（顶栏） |
| `/settings` | 设置（顶栏） |
| `/help` | 使用帮助（仅路由保留，侧栏已移除入口） |
| `/login` | 登录（演示；直接访问 URL） |

顶栏 Logo +「缤果AI实验室」可点击回 `/`（我的AI实验）。**Logo 矢量**：`public/logo.svg`。侧栏与顶栏右侧 **共用同一随机卡通头像**（`useCartoonAvatar`，Dicebear，会话内固定）。**设置** 为下拉菜单：设备检测、下载PC端、用户反馈，并可进入「账号与偏好」页。

## 目录说明

- `src/components/brand/LogoMark.vue`：品牌 Logo（`public/logo.png`）
- `src/components/course/CourseCard.vue`：实验包卡片
- `src/components/lab/GroupPanel.vue`：班级/实验组区块（标题、管理员、工具按钮）
- `src/components/lab/ExperimentFab.vue`：右下角「实验组」悬浮按钮
- `src/components/layout/AppShell.vue`：顶栏（刷新/兑换/设置/头像）+ 侧栏 + 主内容
- `src/layouts/MainLayout.vue`：带侧栏的布局，内嵌 `<router-view />`
- `src/views/`：页面级视图
- `src/router/`：Vue Router 配置
