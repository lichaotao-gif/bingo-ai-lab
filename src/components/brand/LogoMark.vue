<script setup lang="ts">
/**
 * 顶栏图标：`src/assets/bingo-brand-logo.svg`（?raw 内联）
 * 历史蓝色水母稿见 `src/assets/bingo-brand-logo-blue.svg`（需时改回可替换引用或覆盖主文件）
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
