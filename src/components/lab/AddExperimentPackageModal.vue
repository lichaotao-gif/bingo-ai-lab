<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import type { LabPackageOption } from "@/data/labPackages";
import {
  LAB_PACKAGE_OPTIONS,
  PACKAGE_APPLICATION_TIME_OPTIONS,
  type PackageApplicationTimeId,
  type PackageApplicationTimeSelectId,
} from "@/data/labPackages";

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
  add: [
    payload: {
      classId: string;
      packageId: string;
      applicationTimeId: PackageApplicationTimeId;
    },
  ];
}>();

function close() {
  pendingPackage.value = null;
  emit("update:open", false);
}

function isAdded(packageId: string): boolean {
  const id = props.classId;
  if (!id) {
    return false;
  }
  return (props.addedByClass[id] ?? []).includes(packageId);
}

/** 待确认添加的包（弹出应用时间选择） */
const pendingPackage = ref<LabPackageOption | null>(null);
/** 下拉仅含具体时间；跳过稍后配置用「跳过，稍后配置」写入 pending */
const selectedApplicationTimeId = ref<PackageApplicationTimeSelectId>("unlimited");

function openConfirm(pkg: LabPackageOption) {
  if (!props.classId || isAdded(pkg.id)) {
    return;
  }
  pendingPackage.value = pkg;
  selectedApplicationTimeId.value = "unlimited";
}

function cancelConfirm() {
  pendingPackage.value = null;
}

function confirmAdd() {
  const pkg = pendingPackage.value;
  const cid = props.classId;
  if (!cid || !pkg || isAdded(pkg.id)) {
    return;
  }
  emit("add", {
    classId: cid,
    packageId: pkg.id,
    applicationTimeId: selectedApplicationTimeId.value,
  });
  pendingPackage.value = null;
}

function skipAndAddLater() {
  const pkg = pendingPackage.value;
  const cid = props.classId;
  if (!cid || !pkg || isAdded(pkg.id)) {
    return;
  }
  emit("add", {
    classId: cid,
    packageId: pkg.id,
    applicationTimeId: "pending",
  });
  pendingPackage.value = null;
}

const list = computed(() => LAB_PACKAGE_OPTIONS);

watch(
  () => props.open,
  (v) => {
    document.body.style.overflow = v ? "hidden" : "";
    if (!v) {
      pendingPackage.value = null;
    }
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
                  @click="openConfirm(pkg)"
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

        <!-- 确认添加：选择应用时间 -->
        <Transition
          enter-active-class="transition-opacity duration-200"
          leave-active-class="transition-opacity duration-150"
          enter-from-class="opacity-0"
          leave-to-class="opacity-0"
        >
          <div
            v-if="pendingPackage"
            class="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-pkg-confirm-title"
            @click.self="cancelConfirm"
          >
            <div
              class="w-full max-w-md rounded-2xl bg-surface p-5 shadow-popover ring-1 ring-black/[0.06]"
              @click.stop
            >
              <h3
                id="add-pkg-confirm-title"
                class="text-[16px] font-semibold text-black"
              >
                确认添加实验包
              </h3>
              <p class="mt-2 text-[13px] leading-relaxed text-fg-muted">
                将为
                <span class="font-medium text-fg-soft">{{ classTitle }}</span>
                添加「<span class="font-medium text-black">{{
                  pendingPackage.title
                }}</span>」。应用时间可下拉选择，也可跳过稍后在「AI实验管理」中配置。
              </p>

              <label
                class="mb-1 mt-4 block text-[12px] font-medium text-fg-muted"
                for="add-pkg-app-time"
              >应用时间</label>
              <select
                id="add-pkg-app-time"
                v-model="selectedApplicationTimeId"
                class="w-full rounded-xl border border-border-subtle bg-white px-3 py-2.5 text-[14px] text-black outline-none ring-primary/30 focus:border-primary/50 focus:ring-2"
              >
                <option
                  v-for="opt in PACKAGE_APPLICATION_TIME_OPTIONS"
                  :key="opt.id"
                  :value="opt.id"
                >
                  {{ opt.label }}
                </option>
              </select>

              <div class="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  class="self-start text-[13px] font-medium text-primary underline-offset-2 hover:underline"
                  @click="skipAndAddLater"
                >
                  跳过，稍后配置
                </button>
                <div class="flex w-full justify-end gap-2 sm:w-auto">
                  <button
                    type="button"
                    class="rounded-xl px-4 py-2 text-[14px] font-medium text-fg-muted transition hover:bg-card-inner hover:text-black"
                    @click="cancelConfirm"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    class="rounded-xl bg-primary px-4 py-2 text-[14px] font-medium text-white shadow-sm transition hover:opacity-95"
                    @click="confirmAdd"
                  >
                    确定添加
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
