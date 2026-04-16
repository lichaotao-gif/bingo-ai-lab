<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import type { LabPackageOption } from "@/data/labPackages";
import {
  PACKAGE_APPLICATION_TIME_OPTIONS,
  packageApplicationTimeLabel,
  type PackageApplicationTimeId,
  type PackageApplicationTimeSelectId,
} from "@/data/labPackages";

const props = defineProps<{
  open: boolean;
  packages: LabPackageOption[];
  groupId: string | null;
  /** 实验包 id → 应用时间 */
  applicationTimeIdByPackageId?: Record<string, PackageApplicationTimeId>;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  removePackage: [payload: { groupId: string; packageId: string }];
  viewPackageDetail: [pkg: LabPackageOption];
  updateApplicationTime: [
    payload: {
      groupId: string;
      packageId: string;
      applicationTimeId: PackageApplicationTimeSelectId;
    },
  ];
}>();

const router = useRouter();

const count = computed(() => props.packages.length);

function close() {
  emit("update:open", false);
}

function onViewStats(pkg: LabPackageOption) {
  void router.push({
    name: "stats",
    query: {
      group: props.groupId ?? "",
      pkg: pkg.id,
      grade: String(pkg.gradeRouteIndex),
    },
  });
  close();
}

function onViewPackageDetail(pkg: LabPackageOption) {
  emit("viewPackageDetail", pkg);
  close();
}

function onDelete(pkg: LabPackageOption) {
  const gid = props.groupId;
  if (!gid) {
    return;
  }
  if (!window.confirm(`确定从本班级移除实验包「${pkg.title}」吗？`)) {
    return;
  }
  emit("removePackage", { groupId: gid, packageId: pkg.id });
}

function timeIdForPackage(packageId: string): PackageApplicationTimeId {
  return props.applicationTimeIdByPackageId?.[packageId] ?? "unlimited";
}

function statusLabelForPackage(packageId: string): string {
  return packageApplicationTimeLabel(timeIdForPackage(packageId));
}

/** 修改应用时间子弹窗 */
const editTimeTarget = ref<LabPackageOption | null>(null);
const editTimeDraft = ref<PackageApplicationTimeSelectId>("unlimited");

function openEditTime(pkg: LabPackageOption) {
  editTimeTarget.value = pkg;
  editTimeDraft.value = timeIdForPackage(pkg.id);
}

function closeEditTime() {
  editTimeTarget.value = null;
}

function confirmEditTime() {
  const pkg = editTimeTarget.value;
  const gid = props.groupId;
  if (!pkg || !gid) {
    return;
  }
  emit("updateApplicationTime", {
    groupId: gid,
    packageId: pkg.id,
    applicationTimeId: editTimeDraft.value,
  });
  closeEditTime();
}

watch(
  () => props.open,
  (v) => {
    document.body.style.overflow = v ? "hidden" : "";
    if (!v) {
      closeEditTime();
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
        class="fixed inset-0 z-[100]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-manage-modal-title"
      >
        <div
          class="flex min-h-full items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          @click.self="close"
        >
          <div
            class="flex max-h-[min(560px,88vh)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface shadow-popover"
            @click.stop
          >
          <header
            class="flex shrink-0 items-center justify-between border-b border-border-subtle px-5 py-4"
          >
            <h2
              id="ai-manage-modal-title"
              class="text-[17px] font-semibold text-black"
            >
              AI实验管理 ({{ count }})
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

          <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <p
              v-if="packages.length === 0"
              class="py-12 text-center text-[14px] text-fg-muted"
            >
              暂无已添加的实验包，请先在班级中「添加实验」。
            </p>

            <ul v-else class="space-y-3">
              <li
                v-for="pkg in packages"
                :key="pkg.id"
                class="rounded-xl border border-border-subtle bg-white p-3 shadow-sm"
              >
                <div class="flex items-start gap-3">
                  <button
                    type="button"
                    class="shrink-0 overflow-hidden rounded-lg transition hover:opacity-90"
                    @click="onViewPackageDetail(pkg)"
                  >
                    <div
                      class="size-[72px] overflow-hidden bg-card-inner ring-1 ring-black/[0.06]"
                    >
                      <img
                        :src="pkg.cover"
                        alt=""
                        class="size-full object-cover"
                        loading="lazy"
                        referrerpolicy="no-referrer"
                      />
                    </div>
                  </button>
                  <div class="min-w-0 flex-1">
                    <button
                      type="button"
                      class="block w-full rounded-lg text-left text-[14px] font-medium leading-snug text-black transition hover:bg-card-inner/80"
                      @click="onViewPackageDetail(pkg)"
                    >
                      {{ pkg.title }}
                    </button>
                    <div
                      class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1"
                      @click.stop
                    >
                      <span class="text-[12px] text-fg-muted">应用时间</span>
                      <span
                        class="text-[14px] font-medium tabular-nums text-black"
                      >{{ statusLabelForPackage(pkg.id) }}</span>
                      <button
                        type="button"
                        class="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[12px] font-medium text-slate-800 transition hover:border-primary hover:bg-primary-muted hover:text-primary"
                        @click="openEditTime(pkg)"
                      >
                        修改
                      </button>
                    </div>
                  </div>
                  <div
                    class="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <button
                      type="button"
                      class="rounded-lg border-2 border-primary bg-white px-3 py-1.5 text-[13px] font-medium text-primary transition hover:bg-primary-muted"
                      @click="onViewStats(pkg)"
                    >
                      查看统计
                    </button>
                    <button
                      type="button"
                      class="rounded-lg border-2 border-red-500 bg-white px-3 py-1.5 text-[13px] font-medium text-red-500 transition hover:bg-red-50"
                      @click="onDelete(pkg)"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </div>
          </div>
        </div>

        <!-- 修改应用时间 -->
        <Transition
          enter-active-class="transition-opacity duration-200"
          leave-active-class="transition-opacity duration-150"
          enter-from-class="opacity-0"
          leave-to-class="opacity-0"
        >
          <div
            v-if="editTimeTarget"
            class="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-manage-edit-time-title"
            @click.self="closeEditTime"
          >
            <div
              class="w-full max-w-md rounded-2xl bg-surface p-5 shadow-popover ring-1 ring-black/[0.06]"
              @click.stop
            >
              <h3
                id="ai-manage-edit-time-title"
                class="text-[16px] font-semibold text-black"
              >
                修改应用时间
              </h3>
              <p class="mt-1 text-[13px] text-fg-muted">
                {{ editTimeTarget.title }}
              </p>

              <label
                class="mb-1 mt-4 block text-[12px] font-medium text-fg-muted"
                for="ai-manage-edit-time-select"
              >应用时间</label>
              <select
                id="ai-manage-edit-time-select"
                v-model="editTimeDraft"
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

              <div class="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  class="rounded-xl px-4 py-2 text-[14px] font-medium text-fg-muted transition hover:bg-card-inner hover:text-black"
                  @click="closeEditTime"
                >
                  取消
                </button>
                <button
                  type="button"
                  class="rounded-xl bg-primary px-4 py-2 text-[14px] font-medium text-white shadow-sm transition hover:opacity-95"
                  @click="confirmEditTime"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
