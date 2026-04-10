<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useCartoonAvatar } from "@/composables/useCartoonAvatar";

const router = useRouter();
const { avatarUrl } = useCartoonAvatar();

const open = ref(false);
const root = ref<HTMLElement | null>(null);

function toggle() {
  open.value = !open.value;
}

function close() {
  open.value = false;
}

function onDocClick(e: MouseEvent) {
  const el = root.value;
  if (el && !el.contains(e.target as Node)) {
    close();
  }
}

onMounted(() => {
  document.addEventListener("click", onDocClick, true);
});

onUnmounted(() => {
  document.removeEventListener("click", onDocClick, true);
});

function demo(msg: string) {
  close();
  window.alert(`${msg}（演示）`);
}

function onLogout() {
  close();
  void router.push({ name: "login" });
}
</script>

<template>
  <div
    ref="root"
    class="relative shrink-0"
  >
    <button
      type="button"
      class="rounded-full outline-none ring-primary/0 transition hover:ring-2 hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-primary/50"
      aria-haspopup="dialog"
      :aria-expanded="open"
      aria-label="用户菜单"
      @click.stop="toggle"
    >
      <img
        :src="avatarUrl"
        alt=""
        width="40"
        height="40"
        class="size-10 rounded-full border-2 border-white object-cover shadow-md ring-1 ring-black/[0.06]"
      />
    </button>

    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="translate-y-1 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-1 opacity-0"
    >
      <div
        v-show="open"
        class="absolute right-0 top-[calc(100%+10px)] z-[60] w-[min(calc(100vw-2rem),320px)]"
        role="dialog"
        aria-label="账户信息"
        @click.stop
      >
        <!-- 指向头像的小三角 -->
        <div
          class="pointer-events-none absolute -top-[7px] right-3 h-3 w-3 rotate-45 border-l-2 border-t-2 border-blue-200/90 bg-white"
          aria-hidden="true"
        />

        <div
          class="relative overflow-hidden rounded-2xl border-2 border-blue-100 bg-white shadow-[0_12px_40px_-8px_rgba(15,23,42,0.18)]"
        >
          <!-- 头部：头像、姓名、标签 -->
          <div class="relative border-b border-slate-100 px-4 pb-4 pt-4">
            <button
              type="button"
              class="absolute right-3 top-3 rounded-md p-1 text-blue-500 transition hover:bg-blue-50"
              aria-label="编辑资料"
              @click="demo('编辑资料')"
            >
              <svg
                class="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>

            <div class="flex gap-3 pr-7">
              <div class="relative shrink-0">
                <img
                  :src="avatarUrl"
                  alt=""
                  width="56"
                  height="56"
                  class="size-14 rounded-full border border-slate-100 object-cover shadow-sm"
                />
                <span
                  class="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-md ring-2 ring-white"
                  aria-hidden="true"
                >
                  <svg
                    class="size-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </span>
              </div>
              <div class="min-w-0 flex-1 pt-0.5">
                <p class="text-[17px] font-semibold text-slate-900">
                  李超涛
                </p>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    class="inline-flex max-w-full items-center rounded-full border border-blue-400/80 bg-blue-50/80 px-2.5 py-0.5 text-[12px] font-medium text-blue-700"
                  >
                    体验用户
                  </span>
                  <button
                    type="button"
                    class="inline-flex size-7 items-center justify-center rounded-md bg-orange-400 text-white shadow-sm transition hover:bg-orange-500"
                    aria-label="切换账号"
                    title="切换账号"
                    @click="demo('切换账号')"
                  >
                    <svg
                      class="size-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M8 10l4-4 4 4M8 14l4 4 4-4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 手机号 -->
          <div
            class="flex items-center gap-3 border-b border-slate-100 px-4 py-3"
          >
            <span
              class="flex size-8 shrink-0 items-center justify-center text-slate-500"
              aria-hidden="true"
            >
              <svg
                class="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </span>
            <span class="min-w-0 flex-1 truncate text-[14px] text-slate-800"
            >18600224182</span
            >
            <button
              type="button"
              class="shrink-0 rounded-md bg-orange-500 px-2.5 py-1.5 text-[12px] font-medium text-white shadow-sm transition hover:bg-orange-600"
              @click="demo('修改手机号')"
            >
              修改手机号
            </button>
          </div>

          <!-- 密码 -->
          <div class="flex items-center gap-3 px-4 py-3">
            <span
              class="flex size-8 shrink-0 items-center justify-center text-slate-500"
              aria-hidden="true"
            >
              <svg
                class="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </span>
            <span class="flex-1 font-mono text-[15px] tracking-widest text-slate-700"
            >******</span
            >
            <button
              type="button"
              class="shrink-0 rounded-md bg-orange-500 px-2.5 py-1.5 text-[12px] font-medium text-white shadow-sm transition hover:bg-orange-600"
              @click="demo('修改密码')"
            >
              修改密码
            </button>
          </div>

          <div class="border-t border-slate-100 bg-slate-50/50 px-4 py-4">
            <button
              type="button"
              class="w-full rounded-full bg-blue-600 py-2.5 text-[14px] font-medium text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700"
              @click="onLogout"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
