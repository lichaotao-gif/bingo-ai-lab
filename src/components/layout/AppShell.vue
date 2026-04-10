<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import LogoMark from "@/components/brand/LogoMark.vue";
import HeaderNavIcon from "@/components/nav/HeaderNavIcon.vue";
import HeaderNavLink from "@/components/nav/HeaderNavLink.vue";
import SettingsMenu from "@/components/nav/SettingsMenu.vue";
import UserAvatarMenu from "@/components/nav/UserAvatarMenu.vue";
import IconRefresh from "@/components/icons/IconRefresh.vue";
import IconGift from "@/components/icons/IconGift.vue";
import IconRobot from "@/components/icons/IconRobot.vue";
import { useCartoonAvatar } from "@/composables/useCartoonAvatar";

const route = useRoute();
const { avatarUrl } = useCartoonAvatar();

const isMyLab = computed(() => route.name === "my-lab");
const isAiLab = computed(
  () => route.name === "ai-lab" || route.name === "grade-experiments",
);
function refresh() {
  window.location.reload();
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
          <SettingsMenu />

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
        class="flex min-h-0 w-sidebar shrink-0 flex-col gap-5 overflow-y-auto rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm"
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

        <nav class="flex flex-col gap-4">
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
      </aside>

      <main
        class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl border border-border-subtle bg-surface shadow-card [scrollbar-gutter:stable]"
      >
        <div class="p-5 lg:p-7">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
