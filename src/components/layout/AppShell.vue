<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import LogoMark from "@/components/brand/LogoMark.vue";
import HeaderNavIcon from "@/components/nav/HeaderNavIcon.vue";
import HeaderNavLink from "@/components/nav/HeaderNavLink.vue";
import UserFeedbackModal from "@/components/feedback/UserFeedbackModal.vue";
import UserAvatarMenu from "@/components/nav/UserAvatarMenu.vue";
import IconRefresh from "@/components/icons/IconRefresh.vue";
import IconGift from "@/components/icons/IconGift.vue";
import IconRobot from "@/components/icons/IconRobot.vue";
import IconChip from "@/components/icons/IconChip.vue";
import { useCartoonAvatar } from "@/composables/useCartoonAvatar";

const route = useRoute();
const router = useRouter();
const { avatarUrl } = useCartoonAvatar();

/** 新标签页打开区域统计（独立看板页） */
const eduBureauHref = router.resolve({ name: "edu-bureau" }).href;

/** 从首页「我的 AI 实验」进入实验列表 / 统计时携带，用于侧栏保持「我的AI实验」高亮 */
const fromMyLabFlow = computed(() => route.query.from === "my-lab");

const isMyLab = computed(() => {
  if (route.name === "my-lab") {
    return true;
  }
  if (
    fromMyLabFlow.value &&
    (route.name === "grade-experiments" || route.name === "stats")
  ) {
    return true;
  }
  return false;
});

const isAiLab = computed(() => {
  if (route.name === "ai-lab") {
    return true;
  }
  if (
    !fromMyLabFlow.value &&
    (route.name === "grade-experiments" || route.name === "stats")
  ) {
    return true;
  }
  return false;
});

function refresh() {
  window.location.reload();
}

/** 友情链接：双师AI课 · 缤果AI实验室（外站 lab.bingoai.cn） */
const BINGO_AI_LAB_EXTERNAL_URL = "https://lab.bingoai.cn";
const friendLinkModalOpen = ref(false);
const friendLinkCopied = ref(false);
const feedbackModalOpen = ref(false);

async function copyBingoAiLabUrl() {
  try {
    await navigator.clipboard.writeText(BINGO_AI_LAB_EXTERNAL_URL);
    friendLinkCopied.value = true;
    window.setTimeout(() => {
      friendLinkCopied.value = false;
    }, 2600);
  } catch {
    window.prompt("请手动复制以下网址：", BINGO_AI_LAB_EXTERNAL_URL);
  }
}

function openBingoAiLab() {
  window.open(BINGO_AI_LAB_EXTERNAL_URL, "_blank", "noopener,noreferrer");
}
</script>

<template>
  <div
    class="flex h-full min-h-0 flex-col overflow-hidden bg-page text-black"
  >
    <!-- 顶栏全宽贴齐视口左右，高度固定 -->
    <header
      class="w-full shrink-0 border-b border-border-subtle/60 bg-surface"
    >
      <div
        class="flex h-header items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        <RouterLink
          to="/"
          class="flex items-center gap-2.5 rounded-md outline-none ring-primary focus-visible:ring-2"
        >
          <div class="size-9 shrink-0">
            <LogoMark />
          </div>
          <span class="text-[17px] font-semibold tracking-tight text-black/85">
            缤果AI实验室
          </span>
        </RouterLink>

        <nav class="flex items-center gap-2 md:gap-3">
          <HeaderNavIcon label="刷新" @click="refresh">
            <IconRefresh />
          </HeaderNavIcon>
          <HeaderNavLink to="/redeem" label="兑换">
            <IconGift />
          </HeaderNavLink>
          <HeaderNavIcon
            label="用户反馈"
            @click="feedbackModalOpen = true"
          >
            <svg
              class="size-[19px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path
                d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
              />
            </svg>
          </HeaderNavIcon>

          <div
            class="hidden h-9 w-px shrink-0 bg-border-subtle sm:block"
            aria-hidden="true"
          />

          <UserAvatarMenu />
        </nav>
      </div>
    </header>

    <!-- 占满顶栏以下剩余高度；仅右侧 main 纵向滚动 -->
    <div
      class="mx-auto flex min-h-0 w-full max-w-layout flex-1 gap-3 overflow-hidden px-3 pb-3 pt-3"
    >
      <aside
        class="flex min-h-0 w-sidebar shrink-0 flex-col gap-0 overflow-hidden rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm"
      >
        <div class="flex flex-col items-center gap-2.5 text-[14px]">
          <img
            :src="avatarUrl"
            alt=""
            width="44"
            height="44"
            class="size-11 shrink-0 rounded-full border border-border-subtle bg-card-inner object-cover"
          />
          <p class="text-center text-[13px] text-fg-soft">
            下午好，李超涛
          </p>
        </div>

        <nav class="mt-5 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-0.5">
          <RouterLink
            v-slot="{ navigate }"
            to="/ai-lab"
            custom
          >
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[14px] transition"
              :class="
                isAiLab
                  ? 'bg-primary-muted font-medium text-primary shadow-sm'
                  : 'text-fg-soft hover:bg-card-inner'
              "
              @click="navigate"
            >
              <span
                class="flex size-7 items-center justify-center rounded-lg bg-white/80 text-primary shadow-sm"
              >
                <IconRobot />
              </span>
              AI实验室
            </button>
          </RouterLink>

          <div>
            <p class="mb-2 pl-1 text-[13px] text-fg-muted">我的</p>
            <RouterLink
              v-slot="{ navigate }"
              to="/"
              custom
            >
              <button
                type="button"
                class="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[14px] transition"
                :class="
                  isMyLab
                    ? 'bg-gradient-to-r from-[#2f80ed] to-[#56ccf2] font-medium text-white shadow-md'
                    : 'text-fg-soft hover:bg-card-inner'
                "
                @click="navigate"
              >
                <span
                  class="flex size-7 items-center justify-center rounded-lg"
                  :class="
                    isMyLab
                      ? 'bg-white/25 text-white'
                      : 'bg-primary/10 text-primary'
                  "
                >
                  <IconRobot />
                </span>
                我的AI实验
              </button>
            </RouterLink>
          </div>
        </nav>

        <div class="mt-4 shrink-0 space-y-4">
          <div>
            <p class="mb-2 pl-1 text-[13px] text-fg-muted">
              友情链接（在人工智能双师AI课堂上增加）
            </p>
            <button
              type="button"
              class="flex w-full flex-nowrap items-center gap-1.5 rounded-xl px-2.5 py-2 text-left text-[13px] text-fg-soft transition hover:bg-card-inner"
              @click="friendLinkModalOpen = true"
            >
              <span
                class="flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-primary"
                aria-hidden="true"
              >
                <IconChip />
              </span>
              <span
                class="min-w-0 whitespace-nowrap font-medium text-primary"
              >
                缤果AI实验室
              </span>
            </button>
          </div>

          <div class="border-t border-border-subtle pt-4">
            <a
              :href="eduBureauHref"
              target="_blank"
              rel="noopener noreferrer"
              class="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[14px] text-fg-soft transition hover:bg-slate-100"
            >
              <span
                class="flex size-7 items-center justify-center rounded-lg bg-slate-200/80 text-slate-700"
              >
                <svg
                  class="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    d="M4 19V5M10 19v-6M16 19V9M22 19V12"
                  />
                </svg>
              </span>
              区域统计
            </a>
          </div>
        </div>
      </aside>

      <main
        class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl border border-border-subtle bg-surface shadow-card [scrollbar-gutter:stable]"
      >
        <div class="p-5 lg:p-7">
          <slot />
        </div>
      </main>
    </div>

    <UserFeedbackModal v-model:open="feedbackModalOpen" />

    <Teleport to="body">
      <Transition name="friend-link-fade">
        <div
          v-if="friendLinkModalOpen"
          class="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="friend-link-dialog-title"
        >
          <div
            class="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            aria-hidden="true"
            @click="friendLinkModalOpen = false"
          />
          <div
            class="relative z-10 w-full max-w-lg rounded-2xl border border-border-subtle bg-surface p-6 shadow-popover sm:p-8"
            @click.stop
          >
            <h2
              id="friend-link-dialog-title"
              class="text-center text-[20px] font-semibold text-black sm:text-[22px]"
            >
              缤果AI实验室
            </h2>
            <div
              class="mt-6 rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-4 py-4 sm:px-5 sm:py-5"
            >
              <div
                class="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-3 sm:gap-y-2"
              >
                <p
                  class="min-w-0 flex-1 break-all text-left font-mono text-[clamp(1rem,2.6vw,1.25rem)] font-semibold leading-snug tracking-tight text-emerald-950 sm:text-[22px]"
                >
                  {{ BINGO_AI_LAB_EXTERNAL_URL }}
                </p>
                <button
                  type="button"
                  class="group inline-flex shrink-0 items-center gap-1 self-start rounded-md px-1.5 py-0.5 text-[13px] font-medium text-emerald-800/85 transition hover:bg-emerald-200/40 hover:text-emerald-950 active:opacity-80 sm:self-auto"
                  @click="copyBingoAiLabUrl"
                >
                  <svg
                    class="size-3.5 shrink-0 opacity-80 transition group-hover:opacity-100"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span class="border-b border-transparent pb-px group-hover:border-emerald-600/50">{{
                    friendLinkCopied ? "已复制" : "复制"
                  }}</span>
                </button>
              </div>
            </div>
            <p
              class="mt-5 text-center text-[14px] leading-relaxed text-fg-soft"
            >
              点击下方按钮在新标签页打开外站；也可使用上方「复制」仅复制网址。
            </p>
            <div class="mt-6 flex justify-center">
              <button
                type="button"
                class="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-[15px] font-medium text-white shadow-md shadow-primary/25 transition hover:opacity-95 sm:w-auto sm:min-w-[200px]"
                @click="openBingoAiLab"
              >
                <svg
                  class="size-[18px] shrink-0 opacity-95"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                打开缤果AI实验室
              </button>
            </div>
            <button
              type="button"
              class="mt-4 w-full rounded-xl py-2.5 text-[14px] text-fg-muted transition hover:text-black"
              @click="friendLinkModalOpen = false"
            >
              关闭
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.friend-link-fade-enter-active,
.friend-link-fade-leave-active {
  transition: opacity 0.2s ease;
}
.friend-link-fade-enter-active .relative.z-10,
.friend-link-fade-leave-active .relative.z-10 {
  transition:
    transform 0.22s cubic-bezier(0.34, 1.1, 0.64, 1),
    opacity 0.2s ease;
}
.friend-link-fade-enter-from,
.friend-link-fade-leave-to {
  opacity: 0;
}
.friend-link-fade-enter-from .relative.z-10,
.friend-link-fade-leave-to .relative.z-10 {
  transform: scale(0.96) translateY(8px);
  opacity: 0.9;
}
</style>
