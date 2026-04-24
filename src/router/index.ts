import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "@/layouts/MainLayout.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
      meta: { title: "登录" },
    },
    {
      path: "/experiment/gesture-snake",
      name: "experiment-gesture-snake",
      component: () =>
        import("@/views/experiments/GestureSnakeExperimentView.vue"),
      meta: { title: "手势贪吃蛇" },
    },
    {
      path: "/edu-bureau",
      name: "edu-bureau",
      component: () => import("@/views/EduBureauView.vue"),
      meta: { title: "人工智能教育综合看板" },
    },
    {
      path: "/",
      component: MainLayout,
      children: [
        {
          path: "",
          name: "my-lab",
          component: () => import("@/views/HomeLabView.vue"),
          meta: { title: "我的AI实验室" },
        },
        {
          path: "ai-lab/grade/:gradeId",
          name: "grade-experiments",
          component: () => import("@/views/GradeExperimentListView.vue"),
          meta: { title: "实验列表" },
        },
        {
          path: "ai-lab",
          name: "ai-lab",
          component: () => import("@/views/AiLabHallView.vue"),
          meta: { title: "AI实验室" },
        },
        {
          path: "stats",
          name: "stats",
          component: () => import("@/views/StatsView.vue"),
          meta: { title: "实验统计" },
        },
        {
          path: "redeem",
          name: "redeem",
          component: () => import("@/views/RedeemView.vue"),
          meta: { title: "兑换" },
        },
        {
          path: "settings",
          name: "settings",
          component: () => import("@/views/SettingsView.vue"),
          meta: { title: "设置" },
        },
        {
          path: "help",
          name: "help",
          component: () => import("@/views/HelpView.vue"),
          meta: { title: "使用帮助" },
        },
        {
          path: "quiz-reports",
          name: "quiz-reports",
          component: () => import("@/views/QuizReportsView.vue"),
          meta: { title: "学生测验报告" },
        },
      ],
    },
  ],
});

router.afterEach((to) => {
  // 年级实验列表页在视图内按年级设置 document.title
  if (to.name === "grade-experiments") {
    return;
  }
  if (to.name === "experiment-gesture-snake") {
    const t = (to.meta.title as string) ?? "实验";
    document.title = `${t} · 缤果AI实验室`;
    return;
  }
  if (to.name === "edu-bureau") {
    document.title = "人工智能教育综合看板";
    return;
  }
  const page = (to.meta.title as string) ?? "首页";
  document.title = `${page} · 缤果AI实验室`;
});

export default router;
