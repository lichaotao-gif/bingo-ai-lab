<script setup lang="ts">
import { computed, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import type { GroupMember } from "@/data/groupMembers";

const props = defineProps<{
  open: boolean;
  /** 用于实验统计页筛选成员列表 */
  groupId: string | null;
  groupTitle: string;
  members: GroupMember[];
  /** 合并进统计页 query（如 pkg、grade） */
  statsQuery?: Record<string, string>;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  deleteMember: [memberId: string];
  renameGroup: [];
}>();

function onEditName() {
  emit("renameGroup");
}

const router = useRouter();

const countLabel = computed(() => `${props.members.length}人`);

function close() {
  emit("update:open", false);
}

function onInvite() {
  window.alert("邀请成员（演示）：可接复制链接 / 二维码。");
}

function onViewStats(member: GroupMember) {
  const q: Record<string, string> = {
    layout: "member-first",
    group: props.groupId ?? "",
    member: member.id,
    from: "my-lab",
    ...(props.statsQuery ?? {}),
  };
  void router.push({ name: "stats", query: q });
  close();
}

function onDelete(m: GroupMember) {
  if (!window.confirm(`确定将「${m.name}」移出群组？`)) {
    return;
  }
  emit("deleteMember", m.id);
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
        aria-labelledby="group-members-title"
        @click.self="close"
      >
        <div
          class="flex max-h-[min(520px,88vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-surface shadow-popover"
          @click.stop
        >
          <header
            class="flex shrink-0 items-start justify-between gap-3 border-b border-border-subtle px-5 py-4"
          >
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2
                  id="group-members-title"
                  class="text-[17px] font-semibold text-black"
                >
                  {{ groupTitle }} ({{ countLabel }})
                </h2>
                <button
                  type="button"
                  class="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-fg-muted transition hover:bg-card-inner hover:text-primary"
                  aria-label="编辑群组名称"
                  @click="onEditName"
                >
                  <svg class="size-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M4 20h4l10.5-10.5a2 2 0 000-3L17 4.5a2 2 0 00-3 0L4 15v4zM13.5 5.5l5 5"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <button
                type="button"
                class="rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-white shadow-sm transition hover:opacity-95"
                @click="onInvite"
              >
                邀请
              </button>
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
            </div>
          </header>

          <ul class="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <li
              v-for="m in members"
              :key="m.id"
              class="flex items-center gap-3 rounded-xl border border-border-subtle/80 bg-white p-3 shadow-card"
            >
              <div class="shrink-0">
                <img
                  :src="m.avatar"
                  alt=""
                  width="48"
                  height="48"
                  class="size-12 rounded-full border border-border-subtle object-cover"
                  loading="lazy"
                  referrerpolicy="no-referrer"
                />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span class="text-[15px] font-medium text-black">{{ m.name }}</span>
                  <span
                    v-if="m.role === 'admin'"
                    class="inline-flex shrink-0 items-center rounded-full bg-success px-2 py-0.5 text-[11px] font-medium leading-none text-white"
                  >
                    管理员
                  </span>
                </div>
              </div>
              <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  class="rounded-lg border-2 border-primary bg-white px-3 py-1.5 text-[13px] font-medium text-primary transition hover:bg-primary-muted"
                  @click="onViewStats(m)"
                >
                  查看统计
                </button>
                <button
                  v-if="m.role !== 'admin'"
                  type="button"
                  class="rounded-lg border-2 border-red-500 bg-white px-3 py-1.5 text-[13px] font-medium text-red-500 transition hover:bg-red-50"
                  @click="onDelete(m)"
                >
                  删除
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
