<script setup lang="ts">
import { onUnmounted, ref, useId, watch } from "vue";

const props = defineProps<{
  open: boolean;
  title: string;
  placeholder: string;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  confirm: [value: string];
}>();

const titleId = useId();
const input = ref("");

watch(
  () => props.open,
  (v) => {
    document.body.style.overflow = v ? "hidden" : "";
    if (v) {
      input.value = "";
    }
  },
);

onUnmounted(() => {
  document.body.style.overflow = "";
});

function close() {
  emit("update:open", false);
}

function onConfirm() {
  emit("confirm", input.value.trim());
  close();
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.self="close"
      >
        <div
          class="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-popover"
          @click.stop
        >
          <header
            class="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4"
          >
            <h2
              :id="titleId"
              class="text-[17px] font-semibold text-black"
            >
              {{ title }}
            </h2>
            <button
              type="button"
              class="flex size-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-black"
              aria-label="关闭"
              @click="close"
            >
              <svg
                class="size-5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  d="M6 6l12 12M18 6L6 18"
                />
              </svg>
            </button>
          </header>
          <div class="px-5 py-5">
            <input
              v-model="input"
              type="text"
              class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-black outline-none ring-primary/0 transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              :placeholder="placeholder"
              @keydown.enter.prevent="onConfirm"
            />
          </div>
          <footer class="border-t border-slate-100 px-5 pb-5 pt-2">
            <button
              type="button"
              class="w-full rounded-full bg-blue-600 py-3 text-[15px] font-medium text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
              @click="onConfirm"
            >
              确定
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
