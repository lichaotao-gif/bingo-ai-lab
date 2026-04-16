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
  /** 实验包 id → 应用时间（含 pending 表示稍后配置、待补全） */
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
  return props.applicationTimeIdByPackageId?.[packageId] ?? "pending";
}

function isTimePending(packageId: string): boolean {
  const id = timeIdForPackage(packageId);
  return id === "pending";
}

function statusLabelForPackage(packageId: string): string {
  return packageApplicationTimeLabel(timeIdForPackage(packageId));
}

/** 修改应用时间子弹窗 */
const editTimeTarget = ref<LabPackageOption | null>(null);
const editTimeDraft = ref<PackageApplicationTimeSelectId | "">("");

function openEditTime(pkg: LabPackageOption) {
  editTimeTarget.value = pkg;
  const id = timeIdForPackage(pkg.id);
  editTimeDraft.value = id === "pending" ? "" : id;
}

function closeEditTime() {
  editTimeTarget.value = null;
}

function confirmEditTime() {
  const pkg = editTimeTarget.value;
  const gid = props.groupId;
  const raw = editTimeDraft.value;
  if (!pkg || !gid || !raw) {
    return;
  }
  emit("updateApplicationTime", {
    groupId: gid,
    packageId: pkg.id,
    applicationTimeId: raw,
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
                    class="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left transition hover:bg-card-inner/80"
                    @click="onViewPackageDetail(pkg)"
                  >
                    <div
                      class="size-[72px] shrink-0 overflow-hidden rounded-lg bg-card-inner ring-1 ring-black/[0.06]"
                    >
                      <img
                        :src="pkg.cover"
                        alt=""
                        class="size-full object-cover"
                        loading="lazy"
                        referrerpolicy="no-referrer"
                      />
                    </div>
                    <span
                      class="min-w-0 flex-1 text-[14px] font-medium leading-snug text-black"
                    >
                      {{ pkg.title }}
                    </span>
                  </button>
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

                <div
                  class="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-border-subtle/80 pt-3"
                  @click.stop
                >
                  <div class="min-w-0 flex-1">
                    <p class="text-[12px] font-medium text-fg-muted">
                      应用时间
                    </p>
                    <p
                      class="mt-0.5 text-[14px] font-medium leading-snug"
                      :class="
                        isTimePending(pkg.id)
                          ? 'text-amber-800'
                          : 'text-black'
                      "
                    >
                      {{ statusLabelForPackage(pkg.id) }}
                      <span
                        v-if="isTimePending(pkg.id)"
                        class="ml-1 text-[12px] font-normal text-amber-700/90"
                      >（待配置）</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    class="shrink-0 rounded-lg border-2 border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-800 transition hover:border-primary hover:bg-primary-muted hover:text-primary"
                    @click="openEditTime(pkg)"
                  >
                    修改
                  </button>
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
                <option value="" disabled>
                  请选择应用时间
                </option>
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
                  class="rounded-xl bg-primary px-4 py-2 text-[14px] font-medium text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="!editTimeDraft"
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
