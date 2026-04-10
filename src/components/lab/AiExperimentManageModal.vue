<script setup lang="ts">
import { computed, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import type { LabPackageOption } from "@/data/labPackages";

const props = defineProps<{
  open: boolean;
  packages: LabPackageOption[];
  groupId: string | null;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  removePackage: [payload: { groupId: string; packageId: string }];
  viewPackageDetail: [pkg: LabPackageOption];
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
        aria-labelledby="ai-manage-modal-title"
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
                class="flex items-center gap-3 rounded-xl border border-border-subtle bg-white p-3 shadow-sm"
              >
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
                <div class="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
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
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
