<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { RouterLink } from "vue-router";
import IconGear from "@/components/icons/IconGear.vue";

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

function onDeviceCheck() {
  close();
  const { userAgent } = navigator;
  const w = window.screen.width;
  const h = window.screen.height;
  window.alert(
    `设备信息（演示）\nUA: ${userAgent.slice(0, 80)}…\n屏幕: ${w} × ${h}`,
  );
}

function onDownloadPc() {
  close();
  window.alert("下载 PC 客户端：请替换为实际安装包地址。");
}

function onFeedback() {
  close();
  window.alert("用户反馈：请替换为问卷链接或客服入口。");
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="group flex min-w-[56px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium outline-none transition-all hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.96]"
      :class="
        open
          ? 'bg-primary/10 text-primary'
          : 'text-fg-muted hover:bg-primary/[0.07]'
      "
      aria-haspopup="true"
      :aria-expanded="open"
      @click.stop="toggle"
    >
      <span
        class="flex h-9 w-9 items-center justify-center rounded-full bg-page text-fg-soft shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.06] transition group-hover:bg-white group-hover:text-primary group-hover:ring-primary/25"
        :class="open ? 'bg-white text-primary ring-primary/30' : ''"
      >
        <IconGear />
      </span>
      <span class="leading-none tracking-tight">设置</span>
    </button>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-show="open"
        class="absolute right-0 top-full z-50 mt-2 min-w-[208px] rounded-xl border border-border-subtle bg-surface py-1.5 shadow-popover"
        role="menu"
        @click.stop
      >
        <button
          type="button"
          role="menuitem"
          class="flex w-full px-4 py-2.5 text-left text-[14px] text-fg-soft transition hover:bg-card-inner"
          @click="onDeviceCheck"
        >
          设备检测
        </button>
        <button
          type="button"
          role="menuitem"
          class="flex w-full px-4 py-2.5 text-left text-[14px] text-fg-soft transition hover:bg-card-inner"
          @click="onDownloadPc"
        >
          下载PC端
        </button>
        <button
          type="button"
          role="menuitem"
          class="flex w-full px-4 py-2.5 text-left text-[14px] text-fg-soft transition hover:bg-card-inner"
          @click="onFeedback"
        >
          用户反馈
        </button>
        <div class="my-1 border-t border-border-subtle" />
        <RouterLink
          to="/settings"
          role="menuitem"
          class="block px-4 py-2.5 text-[14px] text-fg-muted transition hover:bg-card-inner hover:text-primary"
          @click="close"
        >
          账号与偏好…
        </RouterLink>
      </div>
    </Transition>
  </div>
</template>
