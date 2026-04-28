<script setup lang="ts">
/**
 * 顶栏图标：`src/assets/bingo-brand-logo.svg`（?raw 内联，避免缓存旧 Vue chunk）
 */
import markup from "@/assets/bingo-brand-logo.svg?raw";
</script>

<template>
  <div
    class="brand-logo-root h-full w-full"
    v-html="markup"
  />
</template>

<style scoped>
.brand-logo-root :deep(svg) {
  display: block;
  height: 100%;
  width: 100%;
  max-height: 40px;
  max-width: 40px;
}
</style>
