<script setup lang="ts">
import { computed, onUnmounted, watch } from "vue";
import type { LabPackageOption } from "@/data/labPackages";
import { LAB_PACKAGE_OPTIONS } from "@/data/labPackages";

const props = defineProps<{
  open: boolean;
  /** 当前要添加实验包的班级标识 */
  classId: string | null;
  /** 班级展示名（仅展示） */
  classTitle: string;
  /** 各班级已添加的包 id */
  addedByClass: Record<string, string[]>;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  add: [payload: { classId: string; packageId: string }];
}>();

function close() {
  emit("update:open", false);
}

function isAdded(packageId: string): boolean {
  const id = props.classId;
  if (!id) {
    return false;
  }
  return (props.addedByClass[id] ?? []).includes(packageId);
}

function onAdd(pkg: LabPackageOption) {
  if (!props.classId || isAdded(pkg.id)) {
    return;
  }
  emit("add", { classId: props.classId, packageId: pkg.id });
}

const list = computed(() => LAB_PACKAGE_OPTIONS);

watch(
  () => props.open,
  (v) => {
    document.body.style.overflow = v ? "hidden" : "";
  },
);

onUnmounted(() => {
  document.body.style.overflow = "";
});
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
        aria-labelledby="add-pkg-modal-title"
        @click.self="close"
      >
        <div
          class="flex max-h-[min(560px,85vh)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface shadow-popover"
          @click.stop
        >
          <header
            class="flex shrink-0 items-center justify-between border-b border-border-subtle px-5 py-4"
          >
            <h2 id="add-pkg-modal-title" class="text-[17px] font-semibold text-black">
              添加实验包
            </h2>
            <button
              type="button"
              class="flex size-9 items-center justify-center rounded-full text-fg-muted transition hover:bg-card-inner hover:text-black"
              aria-label="关闭"
              @click="close"
            >
              <svg class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  d="M6 6l12 12M18 6L6 18"
                />
              </svg>
            </button>
          </header>

          <p class="shrink-0 border-b border-border-subtle/80 px-5 py-2 text-[13px] text-fg-muted">
            目标班级：<span class="font-medium text-fg-soft">{{ classTitle }}</span>
          </p>

          <ul class="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <li
              v-for="pkg in list"
              :key="pkg.id"
              class="flex items-center gap-3 rounded-xl border border-transparent px-2 py-3 transition hover:border-border-subtle hover:bg-card-inner"
            >
              <div
                class="size-[72px] shrink-0 overflow-hidden rounded-lg bg-card-inner ring-1 ring-black/[0.06]"
              >
                <img
                  :src="pkg.cover"
                  alt=""
                  class="size-full object-cover"
                  loading="lazy"
                  decoding="async"
                  referrerpolicy="no-referrer"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[14px] font-medium leading-snug text-black">
                  {{ pkg.title }}
                </p>
              </div>
              <div class="shrink-0">
                <button
                  v-if="!isAdded(pkg.id)"
                  type="button"
                  class="rounded-lg border-2 border-primary bg-white px-3 py-1.5 text-[13px] font-medium text-primary transition hover:bg-primary-muted"
                  @click="onAdd(pkg)"
                >
                  添加实验包
                </button>
                <button
                  v-else
                  type="button"
                  disabled
                  class="cursor-not-allowed rounded-lg border border-transparent bg-black/[0.06] px-3 py-1.5 text-[13px] font-medium text-fg-muted"
                >
                  已添加
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
