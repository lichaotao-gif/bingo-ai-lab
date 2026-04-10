<script setup lang="ts">
defineProps<{
  label: string;
  /** 当前高亮（如菜单展开、路由命中） */
  active?: boolean;
}>();

defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    type="button"
    class="group flex min-w-[56px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-fg-muted outline-none transition-all hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.96"
    :class="active ? 'bg-primary/10 text-primary' : 'hover:bg-primary/[0.07]'"
    @click="$emit('click')"
  >
    <span
      class="flex h-9 w-9 items-center justify-center rounded-full bg-page text-fg-soft shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.06] transition group-hover:bg-white group-hover:text-primary group-hover:ring-primary/25"
      :class="active ? 'bg-white text-primary ring-primary/30' : ''"
    >
      <slot />
    </span>
    <span class="leading-none tracking-tight">{{ label }}</span>
  </button>
</template>
