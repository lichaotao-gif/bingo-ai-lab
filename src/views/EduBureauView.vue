<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import EduBureauLoginCard from "@/components/edu-bureau/EduBureauLoginCard.vue";
import EduBureauDashboard from "@/components/edu-bureau/EduBureauDashboard.vue";
import {
  clearEduBureauSession,
  getEduBureauSession,
  maskPhone,
  type EduBureauSession,
} from "@/utils/eduBureauAuth";

const router = useRouter();
const session = ref<EduBureauSession | null>(null);

function onCloseLogin() {
  void router.push({ name: "my-lab" });
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
    class="edu-page relative flex h-full min-h-0 flex-col overflow-hidden bg-[#020617] text-slate-200"
  >
    <div
      class="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(80%_55%_at_50%_-5%,rgba(6,182,212,0.12),transparent_60%),radial-gradient(50%_40%_at_100%_0%,rgba(59,130,246,0.1),transparent_55%)]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute inset-0 z-0 opacity-[0.5] [background-size:32px_32px] [background-image:linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      aria-hidden="true"
    >
      <div
        class="edu-hud-sweep h-full w-[200%] -translate-x-1/4 will-change-transform [background:linear-gradient(100deg,transparent_35%,rgb(34_211_238/0.22)_50%,rgb(99_102_241/0.1)_55%,transparent_70%)]"
        aria-hidden="true"
      />
    </div>
    <div
      class="pointer-events-none absolute inset-0 z-[1] [background:radial-gradient(65%_50%_at_50%_0%,rgb(6_182_212/0.2),transparent_60%)]"
      aria-hidden="true"
    />
    <header
      class="edu-command-header relative z-20 flex shrink-0 items-center justify-between gap-3 border-b border-cyan-500/25 bg-slate-900/60 px-4 py-3 shadow-[0_0_0_1px_rgb(6_182_212/0.2),0_8px_40px_-8px_rgb(0_0_0/0.5)] shadow-cyan-500/5 backdrop-blur-xl sm:px-6"
    >
      <RouterLink
        to="/"
        class="group flex min-w-0 flex-1 items-center gap-2 rounded-lg outline-none ring-cyan-500/30 focus-visible:ring-2 sm:gap-3"
      >
        <h1
          class="min-w-0 flex-1 truncate bg-gradient-to-r from-cyan-200 via-cyan-50 to-slate-200 bg-clip-text text-[15px] font-semibold tracking-tight text-transparent sm:text-[16px]"
        >
          人工智能教育综合看板
        </h1>
        <span
          class="hidden h-6 max-w-full shrink-0 items-center gap-1.5 rounded border border-cyan-400/45 bg-cyan-500/15 px-2.5 text-[10px] font-bold uppercase leading-none text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.35)] sm:inline-flex"
          title="本页已启用 Neo Command Center 皮肤"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-sm shadow-cyan-400" />
          指挥中心
        </span>
        <span
          class="shrink-0 select-none items-center justify-center gap-0.5 rounded border border-cyan-400/40 bg-slate-950/60 px-1.5 py-0.5 text-[8px] font-extrabold text-cyan-200 sm:hidden"
        >
          NOC
        </span>
      </RouterLink>
      <div
        v-if="session"
        class="flex shrink-0 items-center gap-2 sm:gap-3"
      >
        <p
          class="max-w-[min(42vw,200px)] truncate text-right text-[12px] text-slate-300 sm:max-w-none sm:text-[13px]"
          :title="`${session.displayName} ${maskPhone(session.phone)}`"
        >
          <span class="font-medium text-slate-100">{{ session.displayName }}</span>
          <span class="text-slate-500"> · </span>
          <span class="tabular-nums text-slate-400">{{ maskPhone(session.phone) }}</span>
        </p>
        <button
          type="button"
          class="rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-[12px] font-medium text-slate-200 shadow-sm transition hover:border-cyan-500/30 hover:bg-slate-800/90 sm:text-[13px]"
          @click="logout"
        >
          退出登录
        </button>
      </div>
    </header>

    <div
      class="relative z-10 min-h-0 flex-1 overflow-hidden"
    >
      <!-- 未登录：顶栏下遮罩 + 登录卡片 -->
      <Transition name="edu-login-fade">
        <div
          v-if="!session"
          class="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
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
        class="h-full overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 lg:px-10"
      >
        <EduBureauDashboard />
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
.edu-hud-sweep {
  animation: edu-hud-sweep 10s ease-in-out infinite;
}
.edu-command-header::after {
  content: "";
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: -1px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgb(34 211 238 / 0.55) 18%,
    rgb(56 189 248 / 0.7) 50%,
    rgb(34 211 238 / 0.55) 82%,
    transparent 100%
  );
  box-shadow: 0 0 24px rgb(34 211 238 / 0.2);
}
@keyframes edu-hud-sweep {
  0% {
    transform: translateX(-35%) skewX(-5deg);
  }
  50% {
    transform: translateX(5%) skewX(1deg);
  }
  100% {
    transform: translateX(40%) skewX(4deg);
  }
}
</style>
