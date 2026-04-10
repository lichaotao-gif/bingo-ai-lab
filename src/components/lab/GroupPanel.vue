<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import IconRobot from "@/components/icons/IconRobot.vue";

defineProps<{
  title: string;
  /** 班级/实验组唯一标识，用于添加实验包逻辑 */
  groupId: string;
  showAdmin?: boolean;
  showAddExperiment?: boolean;
}>();

const emit = defineEmits<{
  addExperiment: [groupId: string];
  openMembers: [groupId: string];
  aiExperimentManage: [groupId: string];
  dissolveGroup: [groupId: string];
}>();

const moreOpen = ref(false);
const moreRoot = ref<HTMLElement | null>(null);

function toggleMore() {
  moreOpen.value = !moreOpen.value;
}

function closeMore() {
  moreOpen.value = false;
}

function onDocClick(e: MouseEvent) {
  const el = moreRoot.value;
  if (el && !el.contains(e.target as Node)) {
    closeMore();
  }
}

onMounted(() => {
  document.addEventListener("click", onDocClick, true);
});

onUnmounted(() => {
  document.removeEventListener("click", onDocClick, true);
});

function onAiManage(groupId: string) {
  closeMore();
  emit("aiExperimentManage", groupId);
}

function onDissolve(groupId: string) {
  closeMore();
  emit("dissolveGroup", groupId);
}
</script>

<template>
  <section class="rounded-2xl border border-border-subtle bg-white shadow-card">
    <header
      class="flex flex-wrap items-center gap-2 border-b border-border-subtle/80 px-4 py-3"
    >
      <IconRobot class="shrink-0 text-primary" />
      <h2 class="text-[18px] font-normal text-black">{{ title }}</h2>
      <span
        v-if="showAdmin"
        class="rounded-pill bg-success px-2.5 py-1 text-[12px] text-white"
      >
        管理员
      </span>
      <div class="ml-auto flex flex-wrap items-center gap-2 text-[12px]">
        <button
          v-if="showAddExperiment"
          type="button"
          class="inline-flex items-center gap-1 rounded-md bg-primary-muted px-2.5 py-1.5 text-primary"
          @click="emit('addExperiment', groupId)"
        >
          <span class="text-base leading-none">+</span>
          添加实验
        </button>
        <button
          type="button"
          class="rounded-md bg-primary-muted px-2.5 py-1.5 text-primary"
          @click="emit('openMembers', groupId)"
        >
          群组成员
        </button>
        <div ref="moreRoot" class="relative">
          <button
            type="button"
            class="rounded-md bg-primary-muted px-2.5 py-1.5 text-primary transition"
            :class="moreOpen ? 'ring-2 ring-primary/25' : ''"
            @click.stop="toggleMore"
          >
            更多
          </button>

          <Transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-show="moreOpen"
              class="absolute right-0 top-full z-30 mt-1 min-w-[168px] rounded-xl border border-border-subtle bg-surface py-1.5 shadow-popover"
              role="menu"
              @click.stop
            >
              <button
                type="button"
                role="menuitem"
                class="flex w-full px-4 py-2.5 text-left text-[14px] font-medium text-primary transition hover:bg-card-inner"
                @click="onAiManage(groupId)"
              >
                AI实验管理
              </button>
              <button
                type="button"
                role="menuitem"
                class="flex w-full px-4 py-2.5 text-left text-[14px] font-medium text-red-500 transition hover:bg-red-50"
                @click="onDissolve(groupId)"
              >
                解散实验组
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </header>
    <div class="p-4">
      <slot />
    </div>
  </section>
</template>
