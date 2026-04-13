<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import LogoMark from "@/components/brand/LogoMark.vue";
import EduBureauLoginCard from "@/components/edu-bureau/EduBureauLoginCard.vue";
import EduBureauDashboard from "@/components/edu-bureau/EduBureauDashboard.vue";
import {
  clearEduBureauSession,
  getEduBureauSession,
  type EduBureauSession,
} from "@/utils/eduBureauAuth";

const router = useRouter();
const session = ref<EduBureauSession | null>(null);

function goBackToLab() {
  void router.push({ name: "my-lab" });
}

function onCloseLogin() {
  goBackToLab();
}

onMounted(() => {
  session.value = getEduBureauSession();
});

function onLoginSuccess() {
  session.value = getEduBureauSession();
}

function logout() {
  clearEduBureauSession();
  session.value = null;
}
</script>

<template>
  <div
    class="edu-page flex h-full min-h-0 flex-col overflow-hidden bg-[#f0f4f9] text-slate-800"
  >
    <header
      class="z-20 flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/90 bg-white px-4 py-3 shadow-sm sm:px-6"
    >
      <div class="flex min-w-0 items-center gap-3">
        <RouterLink
          to="/"
          class="flex items-center gap-2 rounded-lg outline-none ring-primary/30 focus-visible:ring-2"
        >
          <div class="size-8 shrink-0">
            <LogoMark />
          </div>
          <span class="hidden text-[15px] font-semibold text-slate-900 sm:inline"
            >缤果AI实验室</span
          >
        </RouterLink>
        <span
          class="hidden h-6 w-px shrink-0 bg-slate-200 sm:block"
          aria-hidden="true"
        />
        <h1 class="truncate text-[15px] font-semibold text-slate-800 sm:text-[16px]">
          教育局统计
        </h1>
      </div>
      <button
        type="button"
        class="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
        @click="goBackToLab"
      >
        返回实验平台
      </button>
    </header>

    <div class="relative min-h-0 flex-1 overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#f0f4f9_100%)]">
      <!-- 未登录：顶栏下遮罩 + 登录卡片 -->
      <Transition name="edu-login-fade">
        <div
          v-if="!session"
          class="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edu-bureau-login-heading"
          @click.self="onCloseLogin"
        >
          <EduBureauLoginCard
            @success="onLoginSuccess"
            @close="onCloseLogin"
          />
        </div>
      </Transition>

      <!-- 已登录：整区滚动看板 -->
      <div
        v-if="session"
        class="h-full overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 lg:px-10"
      >
        <EduBureauDashboard
          :session="session"
          @logout="logout"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.edu-login-fade-enter-active,
.edu-login-fade-leave-active {
  transition: opacity 0.2s ease;
}
.edu-login-fade-enter-from,
.edu-login-fade-leave-to {
  opacity: 0;
}
</style>
