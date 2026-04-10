<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const emit = defineEmits<{
  join: [];
  create: [];
}>();

const menuOpen = ref(false);
const root = ref<HTMLElement | null>(null);

function toggleFab(e: Event) {
  e.stopPropagation();
  menuOpen.value = !menuOpen.value;
}

function closeMenu() {
  menuOpen.value = false;
}

function onDocClick(ev: MouseEvent) {
  const el = root.value;
  if (el && !el.contains(ev.target as Node)) {
    closeMenu();
  }
}

function onJoin() {
  closeMenu();
  emit("join");
}

function onCreate() {
  closeMenu();
  emit("create");
}

onMounted(() => {
  document.addEventListener("click", onDocClick, true);
});

onUnmounted(() => {
  document.removeEventListener("click", onDocClick, true);
});
</script>

<template>
  <div
    ref="root"
    class="fixed bottom-8 right-6 z-20 md:right-10"
  >
    <!-- 弹出菜单：加入 / 创建 -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="translate-y-1 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-1 opacity-0"
    >
      <div
        v-show="menuOpen"
        class="absolute bottom-[calc(100%+12px)] right-0 w-[min(calc(100vw-2rem),220px)] overflow-hidden rounded-xl border border-slate-100 bg-white py-2 shadow-[0_8px_30px_-4px_rgba(15,23,42,0.18)]"
        role="menu"
        @click.stop
      >
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] font-medium text-blue-600 transition hover:bg-blue-50/80"
          @click="onJoin"
        >
          <span
            class="flex size-8 shrink-0 items-center justify-center text-blue-500"
            aria-hidden="true"
          >
            <svg
              class="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 11h-4M20 9v4" />
            </svg>
          </span>
          加入实验组
        </button>
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] font-medium text-blue-600 transition hover:bg-blue-50/80"
          @click="onCreate"
        >
          <span
            class="flex size-8 shrink-0 items-center justify-center text-blue-500"
            aria-hidden="true"
          >
            <svg
              class="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke-width="1.75"
              />
              <path
                stroke-width="1.75"
                stroke-linecap="round"
                d="M12 8v8M8 12h8"
              />
            </svg>
          </span>
          创建实验组
        </button>
      </div>
    </Transition>

    <!-- 主按钮 -->
    <button
      type="button"
      class="flex flex-col items-center justify-center gap-0.5 rounded-full bg-gradient-to-br from-[#3b82f6] via-[#6366f1] to-[#8b5cf6] px-3.5 py-3.5 text-white shadow-lg shadow-indigo-500/30 transition hover:opacity-95 active:scale-[0.98]"
      :class="menuOpen ? 'ring-2 ring-white/50' : ''"
      aria-haspopup="menu"
      :aria-expanded="menuOpen"
      aria-label="实验组"
      @click="toggleFab"
    >
      <span class="text-xl font-light leading-none">+</span>
      <span class="max-w-[3.25rem] text-center text-[10px] font-medium leading-tight">
        实验组
      </span>
    </button>
  </div>
</template>
